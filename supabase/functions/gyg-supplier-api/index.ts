import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

// =============================================================================
// Types
// =============================================================================

interface BookingItem {
  category: string;
  count: number;
  retailPrice?: number;
  groupSize?: number;
}

interface Traveler {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
}

// =============================================================================
// Auth
// =============================================================================

function validateBasicAuth(req: Request): boolean {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Basic ')) return false;

  const decoded = atob(authHeader.slice(6));
  const [username, password] = decoded.split(':');

  const expectedUser = Deno.env.get('GYG_BASIC_AUTH_USERNAME');
  const expectedPass = Deno.env.get('GYG_BASIC_AUTH_PASSWORD');

  return username === expectedUser && password === expectedPass;
}

// =============================================================================
// Helpers
// =============================================================================

function gygError(code: string, message: string, status = 400): Response {
  return new Response(
    JSON.stringify({ data: { errorCode: code, errorMessage: message } }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

function gygSuccess(data: Record<string, unknown>, status = 200): Response {
  return new Response(
    JSON.stringify({ data }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

function generateBookingRef(): string {
  // Max 25 chars: "GYG-" + 20 random alphanumeric
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const arr = new Uint8Array(20);
  crypto.getRandomValues(arr);
  const random = Array.from(arr).map(b => chars[b % chars.length]).join('');
  return `GYG-${random}`;
}

function generateTicketCode(): string {
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// =============================================================================
// Calculate availability for a product
// =============================================================================

async function getAvailability(
  supabase: SupabaseClient,
  gygProductId: string,
  dateTime: string
): Promise<{ vacancies: number; capacity: number; totalSold: number } | null> {
  // Get product + event info
  const { data: product } = await supabase
    .from('gyg_products')
    .select('*, events!inner(id, capacity, event_date, total_tickets_sold)')
    .eq('gyg_product_id', gygProductId)
    .eq('is_active', true)
    .single();

  if (!product) return null;

  const capacity = product.capacity_per_slot ?? product.events.capacity ?? 0;

  // Get total sold across ALL platforms
  const { data: platforms } = await supabase
    .from('ticket_platforms')
    .select('tickets_sold')
    .eq('event_id', product.events.id);

  const totalSold = (platforms || []).reduce(
    (sum: number, p: { tickets_sold: number }) => sum + (p.tickets_sold || 0),
    0
  );

  // Also count active reservations (holds) for this product + datetime
  const { data: activeReservations } = await supabase
    .from('gyg_reservations')
    .select('total_tickets')
    .eq('gyg_product_id', gygProductId)
    .eq('date_time', dateTime)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString());

  const reservedTickets = (activeReservations || []).reduce(
    (sum: number, r: { total_tickets: number }) => sum + (r.total_tickets || 0),
    0
  );

  const vacancies = Math.max(0, capacity - totalSold - reservedTickets);

  return { vacancies, capacity, totalSold };
}

// =============================================================================
// Handlers
// =============================================================================

async function handleGetAvailabilities(
  req: Request,
  supabase: SupabaseClient
): Promise<Response> {
  const url = new URL(req.url);
  const productId = url.searchParams.get('productId');
  const fromDateTime = url.searchParams.get('fromDateTime');
  const toDateTime = url.searchParams.get('toDateTime');

  if (!productId || !fromDateTime || !toDateTime) {
    return gygError('MISSING_PARAMETER', 'productId, fromDateTime, and toDateTime are required');
  }

  // Look up product
  const { data: product } = await supabase
    .from('gyg_products')
    .select('*, events!inner(id, capacity, event_date, start_time)')
    .eq('gyg_product_id', productId)
    .eq('is_active', true)
    .single();

  if (!product) {
    return gygError('PRODUCT_NOT_FOUND', `Product ${productId} not found`);
  }

  const eventDate = new Date(product.events.event_date);
  const from = new Date(fromDateTime);
  const to = new Date(toDateTime);

  // Check if event falls within requested range
  if (eventDate < from || eventDate > to) {
    return gygSuccess({ availabilities: [] });
  }

  // Check cutoff
  const now = new Date();
  const cutoffMs = (product.cutoff_seconds || 3600) * 1000;
  if (eventDate.getTime() - now.getTime() < cutoffMs) {
    return gygSuccess({ availabilities: [] });
  }

  const avail = await getAvailability(supabase, productId, fromDateTime);
  if (!avail) {
    return gygSuccess({ availabilities: [] });
  }

  // Build pricing categories from product config
  const pricingCategories = (product.pricing_categories || []).map(
    (cat: { category: string; price: number; currency?: string }) => ({
      category: cat.category,
      price: cat.price,
      currency: cat.currency || product.default_currency || 'AUD',
    })
  );

  return gygSuccess({
    availabilities: [
      {
        dateTime: product.events.event_date,
        productId: product.gyg_product_id,
        vacancies: avail.vacancies,
        pricingCategories,
      },
    ],
  });
}

async function handleReserve(
  req: Request,
  supabase: SupabaseClient
): Promise<Response> {
  const body = await req.json();
  const {
    productId,
    dateTime,
    bookingItems,
    bookingReference: gygBookingReference,
  } = body;

  if (!productId || !dateTime || !bookingItems || !gygBookingReference) {
    return gygError('MISSING_PARAMETER', 'productId, dateTime, bookingItems, and bookingReference are required');
  }

  // Validate product exists
  const { data: product } = await supabase
    .from('gyg_products')
    .select('*, events!inner(id, event_date, capacity)')
    .eq('gyg_product_id', productId)
    .eq('is_active', true)
    .single();

  if (!product) {
    return gygError('PRODUCT_NOT_FOUND', `Product ${productId} not found`);
  }

  // Check cutoff
  const eventDate = new Date(product.events.event_date);
  const now = new Date();
  const cutoffMs = (product.cutoff_seconds || 3600) * 1000;
  if (eventDate.getTime() - now.getTime() < cutoffMs) {
    return gygError('NO_AVAILABILITY', 'Booking cutoff has passed');
  }

  // Calculate total tickets requested
  const totalTickets = (bookingItems as BookingItem[]).reduce(
    (sum, item) => sum + item.count,
    0
  );

  // Check availability
  const avail = await getAvailability(supabase, productId, dateTime);
  if (!avail || avail.vacancies < totalTickets) {
    return gygError('NO_AVAILABILITY', 'Not enough tickets available');
  }

  // Create reservation
  const reservationReference = generateBookingRef();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

  const { error } = await supabase.from('gyg_reservations').insert({
    gyg_product_id: productId,
    reservation_reference: reservationReference,
    gyg_booking_reference: gygBookingReference,
    date_time: dateTime,
    booking_items: bookingItems,
    total_tickets: totalTickets,
    expires_at: expiresAt,
    status: 'active',
  });

  if (error) {
    console.error('Reserve insert error:', error);
    return gygError('INTERNAL_ERROR', 'Failed to create reservation', 500);
  }

  return gygSuccess({
    reservationReference,
    reservationExpiration: expiresAt,
  });
}

async function handleCancelReservation(
  req: Request,
  supabase: SupabaseClient
): Promise<Response> {
  const body = await req.json();
  const { reservationReference } = body;

  if (!reservationReference) {
    return gygError('MISSING_PARAMETER', 'reservationReference is required');
  }

  const { data: reservation } = await supabase
    .from('gyg_reservations')
    .select('*')
    .eq('reservation_reference', reservationReference)
    .single();

  if (!reservation) {
    return gygError('RESERVATION_NOT_FOUND', `Reservation ${reservationReference} not found`);
  }

  if (reservation.status !== 'active') {
    return gygError('RESERVATION_NOT_FOUND', `Reservation ${reservationReference} is not active`);
  }

  const { error } = await supabase
    .from('gyg_reservations')
    .update({ status: 'cancelled' })
    .eq('reservation_reference', reservationReference);

  if (error) {
    console.error('Cancel reservation error:', error);
    return gygError('INTERNAL_ERROR', 'Failed to cancel reservation', 500);
  }

  return gygSuccess({});
}

async function handleBook(
  req: Request,
  supabase: SupabaseClient
): Promise<Response> {
  const body = await req.json();
  const {
    reservationReference,
    bookingReference: gygBookingReference,
    productId,
    dateTime,
    bookingItems,
    addonItems,
    travelers,
    travelerHotel,
    comment,
    language,
  } = body;

  // Validate reservation if provided
  let reservation = null;
  let effectiveProductId = productId;
  let effectiveDateTime = dateTime;
  let effectiveBookingItems = bookingItems;

  if (reservationReference) {
    const { data } = await supabase
      .from('gyg_reservations')
      .select('*')
      .eq('reservation_reference', reservationReference)
      .single();

    if (!data) {
      return gygError('RESERVATION_NOT_FOUND', `Reservation ${reservationReference} not found`);
    }

    if (data.status !== 'active') {
      return gygError('RESERVATION_NOT_FOUND', `Reservation ${reservationReference} is not active`);
    }

    if (new Date(data.expires_at) < new Date()) {
      return gygError('RESERVATION_EXPIRED', 'Reservation has expired');
    }

    reservation = data;
    effectiveProductId = effectiveProductId || data.gyg_product_id;
    effectiveDateTime = effectiveDateTime || data.date_time;
    effectiveBookingItems = effectiveBookingItems || data.booking_items;
  }

  if (!effectiveProductId || !effectiveDateTime || !effectiveBookingItems) {
    return gygError('MISSING_PARAMETER', 'productId, dateTime, and bookingItems are required');
  }

  // Get product + event
  const { data: product } = await supabase
    .from('gyg_products')
    .select('*, events!inner(id, capacity, event_date)')
    .eq('gyg_product_id', effectiveProductId)
    .eq('is_active', true)
    .single();

  if (!product) {
    return gygError('PRODUCT_NOT_FOUND', `Product ${effectiveProductId} not found`);
  }

  const totalTickets = (effectiveBookingItems as BookingItem[]).reduce(
    (sum, item) => sum + item.count,
    0
  );

  // Check availability for direct bookings (no prior reservation)
  if (!reservationReference) {
    const avail = await getAvailability(supabase, effectiveProductId, effectiveDateTime);
    if (!avail || avail.vacancies < totalTickets) {
      return gygError('NO_AVAILABILITY', 'Not enough tickets available');
    }
  }

  // Calculate revenue (sum of retailPrice * count in smallest currency unit)
  const totalRevenue = (effectiveBookingItems as BookingItem[]).reduce(
    (sum, item) => sum + (item.retailPrice || 0) * item.count,
    0
  );

  // Generate ticket codes
  const ticketCodes: { category: string; ticketCode: string; ticketCodeType: string }[] = [];
  for (const item of effectiveBookingItems as BookingItem[]) {
    for (let i = 0; i < item.count; i++) {
      ticketCodes.push({
        category: item.category,
        ticketCode: generateTicketCode(),
        ticketCodeType: 'QR_CODE',
      });
    }
  }

  const bookingReference = generateBookingRef();

  // Insert booking
  const { error: bookingError } = await supabase.from('gyg_bookings').insert({
    gyg_product_id: effectiveProductId,
    event_id: product.events.id,
    booking_reference: bookingReference,
    gyg_booking_reference: gygBookingReference || reservation?.gyg_booking_reference || '',
    reservation_reference: reservationReference || null,
    date_time: effectiveDateTime,
    currency: product.default_currency || 'AUD',
    booking_items: effectiveBookingItems,
    addon_items: addonItems || null,
    travelers: travelers || null,
    traveler_hotel: travelerHotel || null,
    comment: comment || null,
    language: language || null,
    total_tickets: totalTickets,
    total_revenue: totalRevenue,
    ticket_codes: ticketCodes,
    status: 'confirmed',
  });

  if (bookingError) {
    console.error('Book insert error:', bookingError);
    return gygError('INTERNAL_ERROR', 'Failed to create booking', 500);
  }

  // Mark reservation as converted
  if (reservationReference) {
    await supabase
      .from('gyg_reservations')
      .update({ status: 'converted' })
      .eq('reservation_reference', reservationReference);
  }

  // Update ticket_platforms via update_ticket_sales()
  // First get current sold count for GYG on this event
  const { data: currentPlatform } = await supabase
    .from('ticket_platforms')
    .select('tickets_sold, gross_sales')
    .eq('event_id', product.events.id)
    .eq('platform', 'getyourguide')
    .single();

  const newSold = (currentPlatform?.tickets_sold || 0) + totalTickets;
  const newGross = parseFloat(String(currentPlatform?.gross_sales || 0)) + totalRevenue / 100;

  await supabase.rpc('update_ticket_sales', {
    p_event_id: product.events.id,
    p_platform: 'getyourguide',
    p_external_event_id: effectiveProductId,
    p_tickets_sold: newSold,
    p_tickets_available: Math.max(0, (product.capacity_per_slot ?? product.events.capacity ?? 0) - newSold),
    p_gross_sales: newGross,
    p_external_url: null,
    p_platform_data: { gyg_booking_reference: gygBookingReference },
  });

  // Insert ticket_sales for unified tracking
  const traveler = (travelers as Traveler[] | null)?.[0];
  await supabase.from('ticket_sales').insert({
    event_id: product.events.id,
    customer_name: traveler
      ? `${traveler.firstName} ${traveler.lastName}`.trim()
      : 'GetYourGuide Guest',
    customer_email: traveler?.email || 'gyg@getyourguide.com',
    ticket_quantity: totalTickets,
    ticket_type: 'general',
    total_amount: totalRevenue / 100,
    platform: 'getyourguide',
    platform_order_id: bookingReference,
    currency: product.default_currency || 'AUD',
    raw_data: body,
  });

  return gygSuccess({
    bookingReference,
    tickets: ticketCodes,
  });
}

async function handleCancelBooking(
  req: Request,
  supabase: SupabaseClient
): Promise<Response> {
  const body = await req.json();
  const { bookingReference } = body;

  if (!bookingReference) {
    return gygError('MISSING_PARAMETER', 'bookingReference is required');
  }

  const { data: booking } = await supabase
    .from('gyg_bookings')
    .select('*, events!inner(id, capacity), gyg_products!inner(capacity_per_slot)')
    .eq('booking_reference', bookingReference)
    .single();

  if (!booking) {
    return gygError('BOOKING_NOT_FOUND', `Booking ${bookingReference} not found`);
  }

  if (booking.status === 'cancelled') {
    return gygError('ALREADY_CANCELLED', 'Booking is already cancelled');
  }

  if (booking.status === 'redeemed') {
    return gygError('ALREADY_REDEEMED', 'Cannot cancel a redeemed booking');
  }

  // Check if event is in the past
  if (new Date(booking.date_time) < new Date()) {
    return gygError('PAST_BOOKING', 'Cannot cancel a past booking');
  }

  // Cancel the booking
  const { error } = await supabase
    .from('gyg_bookings')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('booking_reference', bookingReference);

  if (error) {
    console.error('Cancel booking error:', error);
    return gygError('INTERNAL_ERROR', 'Failed to cancel booking', 500);
  }

  // Decrement ticket_platforms count
  const { data: currentPlatform } = await supabase
    .from('ticket_platforms')
    .select('tickets_sold, gross_sales')
    .eq('event_id', booking.event_id)
    .eq('platform', 'getyourguide')
    .single();

  if (currentPlatform) {
    const newSold = Math.max(0, (currentPlatform.tickets_sold || 0) - booking.total_tickets);
    const newGross = Math.max(
      0,
      parseFloat(String(currentPlatform.gross_sales || 0)) - (booking.total_revenue || 0) / 100
    );

    await supabase.rpc('update_ticket_sales', {
      p_event_id: booking.event_id,
      p_platform: 'getyourguide',
      p_external_event_id: booking.gyg_product_id,
      p_tickets_sold: newSold,
      p_tickets_available: Math.max(0, (booking.gyg_products?.capacity_per_slot ?? booking.events?.capacity ?? 0) - newSold),
      p_gross_sales: newGross,
      p_external_url: null,
      p_platform_data: null,
    });
  }

  // Mark ticket_sale as refunded
  await supabase
    .from('ticket_sales')
    .update({ refund_status: 'refunded', refund_date: new Date().toISOString() })
    .eq('platform', 'getyourguide')
    .eq('platform_order_id', bookingReference);

  return gygSuccess({});
}

async function handleProductDetails(
  _req: Request,
  supabase: SupabaseClient,
  productId: string
): Promise<Response> {
  const { data: product } = await supabase
    .from('gyg_products')
    .select('*, events!inner(id, title, venue_name, event_date, duration_minutes)')
    .eq('gyg_product_id', productId)
    .single();

  if (!product) {
    return gygError('PRODUCT_NOT_FOUND', `Product ${productId} not found`);
  }

  return gygSuccess({
    product: {
      productId: product.gyg_product_id,
      optionId: product.gyg_option_id,
      title: product.product_title || product.events.title,
      currency: product.default_currency,
      isActive: product.is_active,
      pricingCategories: product.pricing_categories,
      location: product.events.venue_name,
      durationMinutes: product.events.duration_minutes,
    },
  });
}

async function handlePricingCategories(
  _req: Request,
  supabase: SupabaseClient,
  productId: string
): Promise<Response> {
  const { data: product } = await supabase
    .from('gyg_products')
    .select('pricing_categories, default_currency')
    .eq('gyg_product_id', productId)
    .single();

  if (!product) {
    return gygError('PRODUCT_NOT_FOUND', `Product ${productId} not found`);
  }

  return gygSuccess({
    pricingCategories: (product.pricing_categories || []).map(
      (cat: { category: string; price: number; minAge?: number; maxAge?: number }) => ({
        category: cat.category,
        price: cat.price,
        currency: product.default_currency || 'AUD',
        minAge: cat.minAge,
        maxAge: cat.maxAge,
      })
    ),
  });
}

async function handleSupplierProducts(
  _req: Request,
  supabase: SupabaseClient
): Promise<Response> {
  const { data: products } = await supabase
    .from('gyg_products')
    .select('*, events!inner(id, title, venue_name, event_date)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return gygSuccess({
    products: (products || []).map((p) => ({
      productId: p.gyg_product_id,
      optionId: p.gyg_option_id,
      title: p.product_title || p.events.title,
      currency: p.default_currency,
      isActive: p.is_active,
    })),
  });
}

async function handleNotify(
  req: Request,
  supabase: SupabaseClient
): Promise<Response> {
  const body = await req.json();
  const { notificationType, productId } = body;

  // Log notification
  await supabase.from('gyg_notification_log').insert({
    notification_type: notificationType,
    gyg_product_id: productId,
    payload: body,
  });

  // Handle product deactivation
  if (notificationType === 'PRODUCT_DEACTIVATION' && productId) {
    await supabase
      .from('gyg_products')
      .update({ is_active: false })
      .eq('gyg_product_id', productId);
  }

  return gygSuccess({});
}

// =============================================================================
// Router
// =============================================================================

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

  // Basic Auth
  if (!validateBasicAuth(req)) {
    return gygError('AUTHORIZATION_FAILURE', 'Invalid credentials', 401);
  }

  // Create Supabase client with service role (bypasses RLS)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Parse path: strip the base function path to get the API path
  const url = new URL(req.url);
  const fullPath = url.pathname;

  // The edge function is mounted at /functions/v1/gyg-supplier-api
  // So /functions/v1/gyg-supplier-api/1/reserve/ → apiPath = /1/reserve/
  const basePath = '/functions/v1/gyg-supplier-api';
  const apiPath = fullPath.startsWith(basePath)
    ? fullPath.slice(basePath.length)
    : fullPath;

  // Normalize: strip trailing slash for matching
  const normalizedPath = apiPath.replace(/\/$/, '') || '/';

  try {
    // Route: GET /1/get-availabilities/
    if (normalizedPath === '/1/get-availabilities' && req.method === 'GET') {
      return await handleGetAvailabilities(req, supabase);
    }

    // Route: POST /1/reserve/
    if (normalizedPath === '/1/reserve' && req.method === 'POST') {
      return await handleReserve(req, supabase);
    }

    // Route: POST /1/cancel-reservation/
    if (normalizedPath === '/1/cancel-reservation' && req.method === 'POST') {
      return await handleCancelReservation(req, supabase);
    }

    // Route: POST /1/book/
    if (normalizedPath === '/1/book' && req.method === 'POST') {
      return await handleBook(req, supabase);
    }

    // Route: POST /1/cancel-booking/
    if (normalizedPath === '/1/cancel-booking' && req.method === 'POST') {
      return await handleCancelBooking(req, supabase);
    }

    // Route: POST /1/notify/
    if (normalizedPath === '/1/notify' && req.method === 'POST') {
      return await handleNotify(req, supabase);
    }

    // Route: GET /1/products/:productId/pricing-categories/
    const pricingMatch = normalizedPath.match(/^\/1\/products\/([^/]+)\/pricing-categories$/);
    if (pricingMatch && req.method === 'GET') {
      return await handlePricingCategories(req, supabase, pricingMatch[1]);
    }

    // Route: GET /1/products/:productId
    const productMatch = normalizedPath.match(/^\/1\/products\/([^/]+)$/);
    if (productMatch && req.method === 'GET') {
      return await handleProductDetails(req, supabase, productMatch[1]);
    }

    // Route: GET /1/suppliers/:supplierId/products/
    const supplierMatch = normalizedPath.match(/^\/1\/suppliers\/[^/]+\/products$/);
    if (supplierMatch && req.method === 'GET') {
      return await handleSupplierProducts(req, supabase);
    }

    return gygError('ENDPOINT_NOT_FOUND', `Unknown endpoint: ${req.method} ${normalizedPath}`, 404);
  } catch (err) {
    console.error('GYG Supplier API error:', err);
    return gygError('INTERNAL_ERROR', 'Internal server error', 500);
  }
});
