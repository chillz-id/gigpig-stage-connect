import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

interface EventRow {
  id: string;
  capacity: number;
  event_date: string;
  start_time?: string;
  name?: string;
  venue?: string;
  duration_minutes?: number;
}

// deno-lint-ignore no-explicit-any
type GygProduct = any;

// =============================================================================
// Auth
// =============================================================================

function validateBasicAuth(req: Request): boolean {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Basic ')) return false;

  const decoded = atob(authHeader.slice(6));
  const [username, ...passwordParts] = decoded.split(':');
  const password = passwordParts.join(':');

  return username === Deno.env.get('GYG_BASIC_AUTH_USERNAME') &&
         password === Deno.env.get('GYG_BASIC_AUTH_PASSWORD');
}

// =============================================================================
// Helpers
// =============================================================================

function gygError(code: string, message: string, status = 400, extra?: Record<string, unknown>): Response {
  return new Response(
    JSON.stringify({ errorCode: code, errorMessage: message, ...extra }),
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
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const arr = new Uint8Array(20);
  crypto.getRandomValues(arr);
  return `GYG-${Array.from(arr).map(b => chars[b % chars.length]).join('')}`;
}

function generateTicketCode(): string {
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Format a JS Date to ISO 8601 without milliseconds and with explicit +00:00 offset
function toISONoMs(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, '+00:00');
}

// Events store local time with +00 offset. Extract the date portion for matching.
function extractDatePortion(dateTimeStr: string): string {
  return dateTimeStr.split('T')[0]?.split(' ')[0] || dateTimeStr.substring(0, 10);
}

// Cache for timezone offsets (keyed by year-month + timezone)
const tzCache = new Map<string, string>();

// Compute the UTC offset (e.g. "+11:00") for a timezone on a given date
function getTimezoneOffset(localDateStr: string, timezone: string): string {
  const key = `${localDateStr.substring(0, 7)}_${timezone}`;
  const cached = tzCache.get(key);
  if (cached) return cached;

  const datePart = localDateStr.substring(0, 10);
  const utcRef = new Date(`${datePart}T12:00:00Z`);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const formatted = formatter.format(utcRef);
  const [dateParts, timeParts] = formatted.split(', ');
  const [mo, d, y] = dateParts!.split('/');
  const [hh, mm, ss] = timeParts!.split(':');

  const localAsUtc = new Date(Date.UTC(
    parseInt(y!), parseInt(mo!) - 1, parseInt(d!),
    parseInt(hh!), parseInt(mm!), parseInt(ss!)
  ));

  const diffMin = (localAsUtc.getTime() - utcRef.getTime()) / 60000;
  const sign = diffMin >= 0 ? '+' : '-';
  const abs = Math.abs(diffMin);
  const result = `${sign}${Math.floor(abs / 60).toString().padStart(2, '0')}:${(abs % 60).toString().padStart(2, '0')}`;
  tzCache.set(key, result);
  return result;
}

// Convert event_date (local time with fake +00 offset) to ISO 8601 with correct timezone
function formatEventDateForGYG(eventDateStr: string, timezone = 'Australia/Sydney'): string {
  const local = eventDateStr
    .replace(/\.\d+/, '')
    .replace(/[+-]\d{2}:?\d{2}$/, '')
    .replace(/Z$/, '')
    .replace(' ', 'T')
    .trim();
  return `${local}${getTimezoneOffset(local, timezone)}`;
}

// =============================================================================
// Event resolution
// =============================================================================

async function resolveEventsInRange(
  supabase: SupabaseClient,
  product: GygProduct,
  fromDateTime: string,
  toDateTime: string
): Promise<EventRow[]> {
  const fromDate = extractDatePortion(fromDateTime);
  const toDate = extractDatePortion(toDateTime);
  const fromQuery = `${fromDate}T00:00:00+00:00`;
  const toQuery = `${toDate}T23:59:59+00:00`;

  if (product.event_name_match) {
    const { data } = await supabase
      .from('events')
      .select('id, capacity, event_date, start_time, name, venue, duration_minutes')
      .eq('name', product.event_name_match)
      .gte('event_date', fromQuery)
      .lte('event_date', toQuery)
      .order('event_date', { ascending: true });
    return (data || []) as EventRow[];
  }

  if (product.event_id) {
    const { data } = await supabase
      .from('events')
      .select('id, capacity, event_date, start_time, name, venue, duration_minutes')
      .eq('id', product.event_id)
      .gte('event_date', fromQuery)
      .lte('event_date', toQuery)
      .single();
    return data ? [data as EventRow] : [];
  }

  return [];
}

async function resolveEventByDateTime(
  supabase: SupabaseClient,
  product: GygProduct,
  dateTime: string
): Promise<EventRow | null> {
  const targetDate = extractDatePortion(dateTime);
  const dayStart = `${targetDate}T00:00:00+00:00`;
  const dayEnd = `${targetDate}T23:59:59+00:00`;

  if (product.event_name_match) {
    const { data } = await supabase
      .from('events')
      .select('id, capacity, event_date, start_time, name, venue, duration_minutes')
      .eq('name', product.event_name_match)
      .gte('event_date', dayStart)
      .lte('event_date', dayEnd)
      .limit(1)
      .single();
    return data as EventRow | null;
  }

  if (product.event_id) {
    const { data } = await supabase
      .from('events')
      .select('id, capacity, event_date, start_time, name, venue, duration_minutes')
      .eq('id', product.event_id)
      .single();
    return data as EventRow | null;
  }

  return null;
}

// =============================================================================
// Batched availability: fetches ticket_platforms and reservations in 2 queries
// instead of 2 per event
// =============================================================================

async function getBatchedAvailability(
  supabase: SupabaseClient,
  gygProductId: string,
  events: EventRow[],
  capacityOverride?: number | null
): Promise<Map<string, { vacancies: number }>> {
  const eventIds = events.map(e => e.id);

  // Fetch all ticket_platforms for these events in one query
  const { data: allPlatforms } = await supabase
    .from('ticket_platforms')
    .select('event_id, tickets_sold')
    .in('event_id', eventIds);

  // Fetch all active reservations for this product in one query
  const { data: activeReservations } = await supabase
    .from('gyg_reservations')
    .select('total_tickets, date_time')
    .eq('gyg_product_id', gygProductId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString());

  // Index sold tickets by event_id
  const soldByEvent = new Map<string, number>();
  for (const p of (allPlatforms || [])) {
    soldByEvent.set(p.event_id, (soldByEvent.get(p.event_id) || 0) + (p.tickets_sold || 0));
  }

  // Index reserved tickets by date
  const reservedByDate = new Map<string, number>();
  for (const r of (activeReservations || [])) {
    const d = extractDatePortion(String(r.date_time || ''));
    reservedByDate.set(d, (reservedByDate.get(d) || 0) + (r.total_tickets || 0));
  }

  const result = new Map<string, { vacancies: number }>();
  for (const event of events) {
    const capacity = capacityOverride ?? event.capacity ?? 0;
    const sold = soldByEvent.get(event.id) || 0;
    const reserved = reservedByDate.get(extractDatePortion(event.event_date)) || 0;
    result.set(event.id, { vacancies: Math.max(0, capacity - sold - reserved) });
  }
  return result;
}

// Single event availability (for reserve/book validation)
async function getAvailabilityForEvent(
  supabase: SupabaseClient,
  gygProductId: string,
  event: EventRow,
  capacityOverride?: number | null
): Promise<{ vacancies: number }> {
  const result = await getBatchedAvailability(supabase, gygProductId, [event], capacityOverride);
  return result.get(event.id) || { vacancies: 0 };
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

  const { data: product } = await supabase
    .from('gyg_products')
    .select('*')
    .eq('gyg_product_id', productId)
    .eq('is_active', true)
    .single();

  if (!product) {
    return gygError('INVALID_PRODUCT', `Product ${productId} not found`);
  }

  const events = await resolveEventsInRange(supabase, product, fromDateTime, toDateTime);

  const now = new Date();
  const cutoffSeconds = product.cutoff_seconds || 3600;
  const cutoffMs = cutoffSeconds * 1000;
  const currency = product.default_currency || 'AUD';

  const retailPrices = (product.pricing_categories || []).map(
    (cat: { category: string; price: number }) => ({
      category: cat.category,
      price: cat.price,
    })
  );

  // Filter events past cutoff
  const validEvents = events.filter(e => new Date(e.event_date).getTime() - now.getTime() >= cutoffMs);

  // Batch fetch availability for all valid events at once
  const availMap = validEvents.length > 0
    ? await getBatchedAvailability(supabase, productId, validEvents, product.capacity_per_slot)
    : new Map();

  const availabilities = validEvents.map(event => ({
    dateTime: formatEventDateForGYG(event.event_date),
    productId: product.gyg_product_id,
    vacancies: availMap.get(event.id)?.vacancies ?? 0,
    cutoffSeconds,
    currency,
    pricesByCategory: { retailPrices },
  }));

  return gygSuccess({ availabilities });
}

async function handleReserve(
  req: Request,
  supabase: SupabaseClient
): Promise<Response> {
  const rawBody = await req.json();
  const body = rawBody.data || rawBody;

  const { productId, dateTime, bookingItems, gygBookingReference } = body;

  if (!productId || !dateTime || !bookingItems || !gygBookingReference) {
    return gygError('MISSING_PARAMETER', 'productId, dateTime, bookingItems, and gygBookingReference are required');
  }

  const { data: product } = await supabase
    .from('gyg_products')
    .select('*')
    .eq('gyg_product_id', productId)
    .eq('is_active', true)
    .single();

  if (!product) {
    return gygError('INVALID_PRODUCT', `Product ${productId} not found`);
  }

  const validCategories = (product.pricing_categories || []).map(
    (c: { category: string }) => c.category
  );
  for (const item of bookingItems as BookingItem[]) {
    if (!validCategories.includes(item.category)) {
      return gygError('INVALID_TICKET_CATEGORY', `Ticket category '${item.category}' is not supported for this product`, 400, { ticketCategory: item.category });
    }
  }

  const event = await resolveEventByDateTime(supabase, product, dateTime);
  if (!event) {
    return gygError('NO_AVAILABILITY', 'No event found for the requested date');
  }

  const eventDate = new Date(event.event_date);
  const now = new Date();
  const cutoffMs = (product.cutoff_seconds || 3600) * 1000;
  if (eventDate.getTime() - now.getTime() < cutoffMs) {
    return gygError('NO_AVAILABILITY', 'Booking cutoff has passed');
  }

  const totalTickets = (bookingItems as BookingItem[]).reduce(
    (sum, item) => sum + item.count, 0
  );

  const avail = await getAvailabilityForEvent(supabase, productId, event, product.capacity_per_slot);
  if (avail.vacancies < totalTickets) {
    return gygError('NO_AVAILABILITY', 'Not enough tickets available');
  }

  const reservationReference = generateBookingRef();
  const expiresAt = toISONoMs(new Date(Date.now() + 30 * 60 * 1000));

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
    return gygError('INTERNAL_SYSTEM_FAILURE', 'Failed to create reservation', 500);
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
  const rawBody = await req.json();
  const body = rawBody.data || rawBody;
  const { reservationReference } = body;

  if (!reservationReference) {
    return gygError('MISSING_PARAMETER', 'reservationReference is required');
  }

  const { data: reservation } = await supabase
    .from('gyg_reservations')
    .select('status')
    .eq('reservation_reference', reservationReference)
    .single();

  if (!reservation) {
    return gygError('INVALID_RESERVATION', `Reservation ${reservationReference} not found`);
  }

  if (reservation.status !== 'active') {
    return gygError('INVALID_RESERVATION', `Reservation ${reservationReference} is not active`);
  }

  const { error } = await supabase
    .from('gyg_reservations')
    .update({ status: 'cancelled' })
    .eq('reservation_reference', reservationReference);

  if (error) {
    console.error('Cancel reservation error:', error);
    return gygError('INTERNAL_SYSTEM_FAILURE', 'Failed to cancel reservation', 500);
  }

  return gygSuccess({});
}

async function handleBook(
  req: Request,
  supabase: SupabaseClient
): Promise<Response> {
  const rawBody = await req.json();
  const body = rawBody.data || rawBody;
  const {
    reservationReference,
    gygBookingReference,
    productId,
    dateTime,
    bookingItems,
    addonItems,
    travelers,
    travelerHotel,
    comment,
    language,
  } = body;

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
      return gygError('INVALID_RESERVATION', `Reservation ${reservationReference} not found`);
    }
    if (data.status !== 'active') {
      return gygError('INVALID_RESERVATION', `Reservation ${reservationReference} is not active`);
    }
    if (new Date(data.expires_at) < new Date()) {
      return gygError('INVALID_RESERVATION', 'Reservation has expired');
    }

    reservation = data;
    effectiveProductId = effectiveProductId || data.gyg_product_id;
    effectiveDateTime = effectiveDateTime || data.date_time;
    effectiveBookingItems = effectiveBookingItems || data.booking_items;
  }

  if (!effectiveProductId || !effectiveDateTime || !effectiveBookingItems) {
    return gygError('MISSING_PARAMETER', 'productId, dateTime, and bookingItems are required');
  }

  const { data: product } = await supabase
    .from('gyg_products')
    .select('*')
    .eq('gyg_product_id', effectiveProductId)
    .eq('is_active', true)
    .single();

  if (!product) {
    return gygError('INVALID_PRODUCT', `Product ${effectiveProductId} not found`);
  }

  const validCategories = (product.pricing_categories || []).map(
    (c: { category: string }) => c.category
  );
  for (const item of effectiveBookingItems as BookingItem[]) {
    if (!validCategories.includes(item.category)) {
      return gygError('INVALID_TICKET_CATEGORY', `Ticket category '${item.category}' is not supported`, 400, { ticketCategory: item.category });
    }
  }

  const event = await resolveEventByDateTime(supabase, product, effectiveDateTime);
  if (!event) {
    return gygError('INVALID_PRODUCT', 'No event found for the requested date');
  }

  const totalTickets = (effectiveBookingItems as BookingItem[]).reduce(
    (sum, item) => sum + item.count, 0
  );

  if (!reservationReference) {
    const avail = await getAvailabilityForEvent(supabase, effectiveProductId, event, product.capacity_per_slot);
    if (avail.vacancies < totalTickets) {
      return gygError('NO_AVAILABILITY', 'Not enough tickets available');
    }
  }

  const totalRevenue = (effectiveBookingItems as BookingItem[]).reduce(
    (sum, item) => sum + (item.retailPrice || 0) * item.count, 0
  );

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
  const effectiveGygRef = gygBookingReference || reservation?.gyg_booking_reference || '';

  const { error: bookingError } = await supabase.from('gyg_bookings').insert({
    gyg_product_id: effectiveProductId,
    event_id: event.id,
    booking_reference: bookingReference,
    gyg_booking_reference: effectiveGygRef,
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
    return gygError('INTERNAL_SYSTEM_FAILURE', 'Failed to create booking', 500);
  }

  // Fire-and-forget: update reservation status, ticket_platforms, ticket_sales
  // These don't affect the booking response
  if (reservationReference) {
    supabase
      .from('gyg_reservations')
      .update({ status: 'converted' })
      .eq('reservation_reference', reservationReference)
      .then(() => {});
  }

  const { data: currentPlatform } = await supabase
    .from('ticket_platforms')
    .select('tickets_sold, gross_sales')
    .eq('event_id', event.id)
    .eq('platform', 'getyourguide')
    .single();

  const newSold = (currentPlatform?.tickets_sold || 0) + totalTickets;
  const newGross = parseFloat(String(currentPlatform?.gross_sales || 0)) + totalRevenue / 100;
  const eventCapacity = product.capacity_per_slot ?? event.capacity ?? 0;

  // Run these in parallel
  await Promise.all([
    supabase.rpc('update_ticket_sales', {
      p_event_id: event.id,
      p_platform: 'getyourguide',
      p_external_event_id: effectiveProductId,
      p_tickets_sold: newSold,
      p_tickets_available: Math.max(0, eventCapacity - newSold),
      p_gross_sales: newGross,
      p_external_url: null,
      p_platform_data: { gyg_booking_reference: effectiveGygRef },
    }),
    supabase.from('ticket_sales').insert({
      event_id: event.id,
      customer_name: (travelers as Traveler[] | null)?.[0]
        ? `${(travelers as Traveler[])[0].firstName} ${(travelers as Traveler[])[0].lastName}`.trim()
        : 'GetYourGuide Guest',
      customer_email: (travelers as Traveler[] | null)?.[0]?.email || 'gyg@getyourguide.com',
      ticket_quantity: totalTickets,
      ticket_type: 'general',
      total_amount: totalRevenue / 100,
      platform: 'getyourguide',
      platform_order_id: bookingReference,
      currency: product.default_currency || 'AUD',
      raw_data: body,
    }),
  ]);

  return gygSuccess({
    bookingReference,
    tickets: ticketCodes,
  });
}

async function handleCancelBooking(
  req: Request,
  supabase: SupabaseClient
): Promise<Response> {
  const rawBody = await req.json();
  const body = rawBody.data || rawBody;
  const { bookingReference } = body;

  if (!bookingReference) {
    return gygError('MISSING_PARAMETER', 'bookingReference is required');
  }

  const { data: booking } = await supabase
    .from('gyg_bookings')
    .select('*, gyg_products!inner(capacity_per_slot)')
    .eq('booking_reference', bookingReference)
    .single();

  if (!booking) {
    return gygError('INVALID_BOOKING', `Booking ${bookingReference} not found`);
  }

  if (booking.status === 'cancelled') {
    return gygError('BOOKING_ALREADY_CANCELED', 'Booking is already cancelled');
  }

  if (booking.status === 'redeemed') {
    return gygError('BOOKING_REDEEMED', 'Cannot cancel a redeemed booking');
  }

  if (new Date(booking.date_time) < new Date()) {
    return gygError('BOOKING_IN_PAST', 'Cannot cancel a past booking');
  }

  const { error } = await supabase
    .from('gyg_bookings')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('booking_reference', bookingReference);

  if (error) {
    console.error('Cancel booking error:', error);
    return gygError('INTERNAL_SYSTEM_FAILURE', 'Failed to cancel booking', 500);
  }

  // Update ticket counts
  const [{ data: eventData }, { data: currentPlatform }] = await Promise.all([
    supabase.from('events').select('capacity').eq('id', booking.event_id).single(),
    supabase.from('ticket_platforms').select('tickets_sold, gross_sales')
      .eq('event_id', booking.event_id).eq('platform', 'getyourguide').single(),
  ]);

  if (currentPlatform) {
    const newSold = Math.max(0, (currentPlatform.tickets_sold || 0) - booking.total_tickets);
    const newGross = Math.max(0, parseFloat(String(currentPlatform.gross_sales || 0)) - (booking.total_revenue || 0) / 100);
    const eventCapacity = booking.gyg_products?.capacity_per_slot ?? eventData?.capacity ?? 0;

    await Promise.all([
      supabase.rpc('update_ticket_sales', {
        p_event_id: booking.event_id,
        p_platform: 'getyourguide',
        p_external_event_id: booking.gyg_product_id,
        p_tickets_sold: newSold,
        p_tickets_available: Math.max(0, eventCapacity - newSold),
        p_gross_sales: newGross,
        p_external_url: null,
        p_platform_data: null,
      }),
      supabase.from('ticket_sales')
        .update({ refund_status: 'refunded', refund_date: new Date().toISOString() })
        .eq('platform', 'getyourguide')
        .eq('platform_order_id', bookingReference),
    ]);
  }

  return gygSuccess({});
}

async function handleProductDetails(
  _req: Request,
  supabase: SupabaseClient,
  productId: string
): Promise<Response> {
  const { data: product } = await supabase
    .from('gyg_products')
    .select('*')
    .eq('gyg_product_id', productId)
    .single();

  if (!product) {
    return gygError('INVALID_PRODUCT', `Product ${productId} not found`);
  }

  let eventInfo: { name?: string; venue?: string; duration_minutes?: number } | null = null;
  if (product.event_name_match) {
    const { data } = await supabase
      .from('events')
      .select('name, venue, duration_minutes')
      .eq('name', product.event_name_match)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(1)
      .single();
    eventInfo = data;
  } else if (product.event_id) {
    const { data } = await supabase
      .from('events')
      .select('name, venue, duration_minutes')
      .eq('id', product.event_id)
      .single();
    eventInfo = data;
  }

  return gygSuccess({
    supplierId: 'idcomedy',
    productTitle: product.product_title || eventInfo?.name || '',
    productDescription: product.product_title || eventInfo?.name || '',
    destinationLocation: { city: 'AU SYD', country: 'AUS' },
    configuration: {
      participantsConfiguration: {
        min: 1,
        max: product.capacity_per_slot || 250,
      },
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
    .select('pricing_categories, default_currency, capacity_per_slot')
    .eq('gyg_product_id', productId)
    .single();

  if (!product) {
    return gygError('INVALID_PRODUCT', `Product ${productId} not found`);
  }

  const currency = product.default_currency || 'AUD';
  const maxTickets = product.capacity_per_slot || 250;

  return gygSuccess({
    pricingCategories: (product.pricing_categories || []).map(
      (cat: {
        category: string; price: number;
        minTicketAmount?: number; maxTicketAmount?: number;
        bookingCategory?: string; ageFrom?: number; ageTo?: number;
      }) => ({
        category: cat.category,
        minTicketAmount: cat.minTicketAmount ?? (cat.category === 'ADULT' ? 1 : 0),
        maxTicketAmount: cat.maxTicketAmount ?? maxTickets,
        bookingCategory: cat.bookingCategory || 'STANDARD',
        ageFrom: cat.ageFrom ?? null,
        ageTo: cat.ageTo ?? null,
        price: [{ amount: cat.price, currency }],
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
    .select('gyg_product_id, product_title')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return gygSuccess({
    supplierId: 'idcomedy',
    supplierName: 'iD Comedy',
    products: (products || []).map((p) => ({
      productId: p.gyg_product_id,
      productTitle: p.product_title || '',
    })),
  });
}

async function handleNotify(
  req: Request,
  supabase: SupabaseClient
): Promise<Response> {
  const body = await req.json();
  const notifData = body.data || body;
  const notificationType = notifData.notificationType;
  const gygProductId = notifData.productDetails?.productId;

  await supabase.from('gyg_notification_log').insert({
    notification_type: notificationType,
    gyg_product_id: gygProductId,
    payload: body,
  });

  if (notificationType === 'PRODUCT_DEACTIVATION' && gygProductId) {
    await supabase
      .from('gyg_products')
      .update({ is_active: false })
      .eq('gyg_product_id', gygProductId);
  }

  return gygSuccess({});
}

// =============================================================================
// Router
// =============================================================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

  if (!validateBasicAuth(req)) {
    return gygError('AUTHORIZATION_FAILURE', 'Invalid credentials', 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const url = new URL(req.url);
  let apiPath = url.pathname;
  for (const prefix of ['/functions/v1/gyg-supplier-api', '/gyg-supplier-api']) {
    if (apiPath.startsWith(prefix)) {
      apiPath = apiPath.slice(prefix.length);
      break;
    }
  }

  const path = apiPath.replace(/\/$/, '') || '/';

  try {
    if (path === '/1/get-availabilities' && req.method === 'GET') {
      return await handleGetAvailabilities(req, supabase);
    }
    if (path === '/1/reserve' && req.method === 'POST') {
      return await handleReserve(req, supabase);
    }
    if (path === '/1/cancel-reservation' && req.method === 'POST') {
      return await handleCancelReservation(req, supabase);
    }
    if (path === '/1/book' && req.method === 'POST') {
      return await handleBook(req, supabase);
    }
    if (path === '/1/cancel-booking' && req.method === 'POST') {
      return await handleCancelBooking(req, supabase);
    }
    if (path === '/1/notify' && req.method === 'POST') {
      return await handleNotify(req, supabase);
    }

    const pricingMatch = path.match(/^\/1\/products\/([^/]+)\/pricing-categories$/);
    if (pricingMatch && req.method === 'GET') {
      return await handlePricingCategories(req, supabase, pricingMatch[1]);
    }

    const addonsMatch = path.match(/^\/1\/products\/([^/]+)\/addons$/);
    if (addonsMatch && req.method === 'GET') {
      return gygSuccess({ addons: [] });
    }

    const productMatch = path.match(/^\/1\/products\/([^/]+)$/);
    if (productMatch && req.method === 'GET') {
      return await handleProductDetails(req, supabase, productMatch[1]);
    }

    const supplierMatch = path.match(/^\/1\/suppliers\/[^/]+\/products$/);
    if (supplierMatch && req.method === 'GET') {
      return await handleSupplierProducts(req, supabase);
    }

    return gygError('ENDPOINT_NOT_FOUND', `Unknown endpoint: ${req.method} ${path}`, 404);
  } catch (err) {
    console.error('GYG Supplier API error:', err);
    return gygError('INTERNAL_SYSTEM_FAILURE', 'Internal server error', 500);
  }
});
