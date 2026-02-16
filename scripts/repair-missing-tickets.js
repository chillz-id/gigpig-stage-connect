/**
 * One-time repair script to backfill missing tickets for orphaned orders
 *
 * This script:
 * 1. Finds all orders in orders_htx that have no associated tickets in tickets_htx
 * 2. Fetches ALL tickets from Humanitix API for each affected event
 * 3. Filters to only tickets belonging to orphaned orders
 * 4. Inserts them into tickets_htx
 *
 * Usage: node scripts/repair-missing-tickets.js
 */

const HUMANITIX_API_KEY = 'e1d1dd7f16c5e2ad034d89e2f2056d0684e7113d154476a6c59735a31ed78c91915e068534197c92e187ad0251c171fdf0bb0d7b99ee6cbc2cb62d5753a01f1e279cd316e5b64420b4264891f3332edac4b8404e400bf07e1f79f4e2ba0acf946c8c0b3c35963ea7a1c89e86c1ceb2';
const SUPABASE_URL = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cents = (value) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.round(value * 100)
    : 0;

const toIso = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const boolOrNull = (value) =>
  value === undefined || value === null ? null : Boolean(value);

async function fetchOrphanedOrders() {
  console.log('Fetching orders without tickets...');

  // Get all humanitix orders
  const queryResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/orders_htx?select=source_id,event_source_id,session_source_id,purchaser_name,purchaser_email&source=eq.humanitix`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    }
  );

  if (!queryResponse.ok) {
    throw new Error(`Failed to fetch orders: ${await queryResponse.text()}`);
  }

  const allOrders = await queryResponse.json();

  // Get all ticket order_source_ids
  const ticketsResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/tickets_htx?select=order_source_id&source=eq.humanitix`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    }
  );

  if (!ticketsResponse.ok) {
    throw new Error(`Failed to fetch tickets: ${await ticketsResponse.text()}`);
  }

  const allTickets = await ticketsResponse.json();
  const ticketOrderIds = new Set(allTickets.map(t => t.order_source_id));

  // Filter orders without tickets
  const orphanedOrders = allOrders.filter(o => !ticketOrderIds.has(o.source_id));

  return orphanedOrders;
}

// Fetch ALL tickets for an event (no since filter) with pagination
async function fetchAllTicketsForEvent(eventId) {
  const allTickets = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const response = await fetch(
      `https://api.humanitix.com/v1/events/${eventId}/tickets?page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          'X-API-Key': HUMANITIX_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch tickets for event ${eventId}: ${response.status} ${errorText}`);
      return [];
    }

    const data = await response.json();
    const tickets = data.tickets || [];
    allTickets.push(...tickets);

    // Check if there are more pages
    const hasMore = data.meta?.pagination?.hasMore || tickets.length === pageSize;
    if (!hasMore) {
      break;
    }

    page++;
    await wait(500); // Rate limiting between pages
  }

  return allTickets;
}

function transformTicket(ticket, eventId) {
  const checkIn = ticket.checkIn || {};
  const seating = ticket.seatingLocation || ticket.seating || {};
  const discounts = ticket.discounts || {};
  const discountCode = discounts.discountCode || ticket.discountCode || {};
  const autoDiscount = discounts.autoDiscount || {};
  const packageInfo = ticket.package || ticket.packageInfo || {};
  const attendeeProfile = ticket.attendee || {};
  const history = Array.isArray(ticket.checkInHistory)
    ? ticket.checkInHistory
    : Array.isArray(checkIn.history)
    ? checkIn.history
    : null;

  return {
    source: 'humanitix',
    source_id: ticket._id,
    event_source_id: ticket.eventId || eventId,
    order_source_id: ticket.orderId || null,
    session_source_id: ticket.eventDateId || ticket.sessionId || null,
    ticket_type_id: ticket.ticketTypeId || ticket.ticketType?.id || null,
    ticket_type_name: ticket.ticketTypeName || ticket.ticketType?.name || null,
    ticket_number: ticket.number || ticket.ticketNumber || null,
    first_name: ticket.firstName || attendeeProfile.firstName || null,
    last_name: ticket.lastName || attendeeProfile.lastName || null,
    organisation: ticket.organisation || ticket.organization || null,
    attendee_profile_id: ticket.attendeeProfileId || attendeeProfile.profileId || null,
    price_cents: cents(ticket.price),
    net_price_cents: cents(ticket.netPrice),
    total_cents: cents(ticket.total),
    discount_cents: cents(ticket.discount),
    taxes_cents: cents(ticket.taxes),
    fee_cents: cents(ticket.fee),
    passed_on_fee_cents: cents(ticket.passedOnFee),
    absorbed_fee_cents: cents(ticket.absorbedFee),
    dgr_donation_cents: cents(ticket.dgrDonation),
    package_id: packageInfo.id || packageInfo.packageId || null,
    package_name: packageInfo.name || null,
    package_group_id: packageInfo.groupId || packageInfo.group_id || null,
    package_price_cents: cents(packageInfo.price),
    discount_code_used: discountCode.code || null,
    discount_code_amount_cents: cents(discountCode.discountAmount || discountCode.amount),
    auto_discount_amount_cents: cents(autoDiscount.discountAmount || autoDiscount.amount),
    status: ticket.status || null,
    sales_channel: ticket.salesChannel || null,
    is_donation: boolOrNull(ticket.isDonation),
    cancelled_at: toIso(ticket.cancelledAt),
    checked_in: boolOrNull(checkIn.checkedIn),
    check_in_status: checkIn.status || null,
    check_in_date: toIso(checkIn.checkedInAt),
    check_in_device: checkIn.device || null,
    check_in_location: checkIn.location || null,
    check_in_notes: checkIn.notes || null,
    seating_map_id: seating.seatingMapId || seating.mapId || null,
    seating_name: seating.name || null,
    seating_section: seating.section || null,
    seating_table: seating.table || null,
    seating_seat: seating.seat || null,
    seating_note: seating.note || null,
    barcode: ticket.qrCodeData?._id || ticket.barcode || ticket.customScanningCode || null,
    qr_code_data: ticket.qrCodeData || null,
    custom_scanning_code: ticket.customScanningCode || null,
    access_code: ticket.accessCode || null,
    swapped_from: ticket.swappedFrom || null,
    swapped_to: ticket.swappedTo || null,
    currency: ticket.currency || null,
    location: ticket.location || null,
    order_name: ticket.orderName || null,
    additional_fields: ticket.additionalFields || ticket.metadata || null,
    check_in_history: history,
    raw: ticket,
    created_at: toIso(ticket.createdAt),
    updated_at: toIso(ticket.updatedAt),
    ingested_at: new Date().toISOString(),
    updated_at_api: toIso(ticket.updatedAt || checkIn.checkedInAt || ticket.modifiedAt),
  };
}

async function upsertTickets(tickets) {
  if (!tickets.length) return;

  const chunkSize = 50;
  console.log(`Upserting ${tickets.length} tickets...`);

  for (let i = 0; i < tickets.length; i += chunkSize) {
    const chunk = tickets.slice(i, i + chunkSize);

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/tickets_htx?on_conflict=source,source_id`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(chunk),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to upsert tickets: ${response.status} ${errorText}`);
      throw new Error(`Supabase upsert failed: ${errorText}`);
    }

    await wait(500);
  }
}

async function main() {
  console.log('=== Humanitix Ticket Repair Script ===\n');

  try {
    // Step 1: Find orphaned orders
    const orphanedOrders = await fetchOrphanedOrders();
    console.log(`Found ${orphanedOrders.length} orders without tickets\n`);

    if (orphanedOrders.length === 0) {
      console.log('No orphaned orders found. All orders have tickets.');
      return;
    }

    // Create a set of orphaned order IDs for fast lookup
    const orphanedOrderIds = new Set(orphanedOrders.map(o => o.source_id));

    // Group by event for efficiency
    const ordersByEvent = {};
    for (const order of orphanedOrders) {
      const eventId = order.event_source_id;
      if (!ordersByEvent[eventId]) {
        ordersByEvent[eventId] = [];
      }
      ordersByEvent[eventId].push(order);
    }

    const eventIds = Object.keys(ordersByEvent);
    console.log(`Orders grouped into ${eventIds.length} events\n`);

    // Step 2: For each event, fetch ALL tickets and filter to orphaned orders
    let totalTicketsFetched = 0;
    let totalTicketsMatched = 0;
    const allMatchedTickets = [];

    for (const eventId of eventIds) {
      const orders = ordersByEvent[eventId];
      console.log(`\nProcessing event ${eventId} (${orders.length} orphaned orders)...`);

      // Fetch ALL tickets for this event (no since filter)
      const eventTickets = await fetchAllTicketsForEvent(eventId);
      totalTicketsFetched += eventTickets.length;
      console.log(`  Fetched ${eventTickets.length} total tickets from API`);

      // Filter to tickets belonging to orphaned orders
      const matchedTickets = eventTickets.filter(t => orphanedOrderIds.has(t.orderId));
      totalTicketsMatched += matchedTickets.length;
      console.log(`  Matched ${matchedTickets.length} tickets to orphaned orders`);

      // Transform and collect
      for (const ticket of matchedTickets) {
        allMatchedTickets.push(transformTicket(ticket, eventId));
      }

      // Rate limiting between events
      await wait(1000);
    }

    console.log(`\n=== Fetch Summary ===`);
    console.log(`Events processed: ${eventIds.length}`);
    console.log(`Total tickets fetched from API: ${totalTicketsFetched}`);
    console.log(`Tickets matched to orphaned orders: ${totalTicketsMatched}`);

    // Step 3: Insert matched tickets into Supabase
    if (allMatchedTickets.length > 0) {
      console.log(`\nInserting ${allMatchedTickets.length} tickets into tickets_htx...`);
      await upsertTickets(allMatchedTickets);
      console.log('Done!');
    } else {
      console.log('\nNo matching tickets found. Orders may be cancelled/refunded with no tickets.');
    }

    console.log('\n=== Repair Complete ===');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
