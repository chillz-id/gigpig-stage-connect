#!/usr/bin/env node

/**
 * Backfill Eventbrite Event Data
 *
 * This script fetches complete event data for all existing Eventbrite orders
 * by querying the Eventbrite API with event expansion and updating the database.
 *
 * Usage:
 *   node scripts/backfill-eventbrite-event-data.js
 *
 * Environment variables required:
 *   - EVENTBRITE_PRIVATE_TOKEN or EVENTBRITE_API_KEY
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import https from 'https';
import { createClient } from '@supabase/supabase-js';

// Configuration
const EVENTBRITE_TOKEN = process.env.EVENTBRITE_PRIVATE_TOKEN || process.env.EVENTBRITE_API_KEY || 'KPGTS46ZFV2ECF7QUZKE';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE';

// Rate limiting
const RATE_LIMIT_DELAY = 500; // ms between API calls
const BATCH_SIZE = 50; // orders per batch

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// HTTP request helper
const httpsRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
};

// Fetch event details with full expansion
const fetchEvent = async (eventId) => {
  const url = `https://www.eventbriteapi.com/v3/events/${eventId}/?expand=ticket_classes,venue,category,subcategory,format,organizer`;
  const options = {
    headers: {
      'Authorization': `Bearer ${EVENTBRITE_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const event = await httpsRequest(url, options);
    return event;
  } catch (error) {
    console.error(`Failed to fetch event ${eventId}:`, error.message);
    return null;
  }
};

// Fetch all orders for an event with full expansion
const fetchEventOrders = async (eventId) => {
  const orders = [];
  let hasMore = true;
  let continuation = null;

  while (hasMore) {
    const url = continuation
      ? `https://www.eventbriteapi.com/v3/events/${eventId}/orders/?expand=attendees,event,refunds&continuation=${continuation}`
      : `https://www.eventbriteapi.com/v3/events/${eventId}/orders/?expand=attendees,event,refunds`;

    const options = {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    try {
      const response = await httpsRequest(url, options);
      if (response.orders && Array.isArray(response.orders)) {
        orders.push(...response.orders);
      }

      hasMore = response.pagination?.has_more_items ?? false;
      continuation = response.pagination?.continuation ?? null;

      if (hasMore) {
        await sleep(RATE_LIMIT_DELAY);
      }
    } catch (error) {
      console.error(`Failed to fetch orders for event ${eventId}:`, error.message);
      break;
    }
  }

  return orders;
};

// Mapping helpers (same as N8N workflow)
const toIso = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  const str = String(val).trim();
  if (!str || str === 'null') return null;
  try {
    return new Date(str).toISOString();
  } catch {
    return null;
  }
};

const parseCents = (val) => {
  if (val === null || val === undefined) return null;
  const num = Number(val);
  return isNaN(num) ? null : Math.round(num);
};

const centsOrZero = (val) => {
  const cents = parseCents(val);
  return cents === null ? 0 : cents;
};

// Map order record with event data
const mapOrderRecord = (order, ingestedAt) => {
  if (!order?.id) return null;

  const costs = order.costs ?? {};
  const gross = parseCents(costs.gross?.value);
  const fees = centsOrZero(costs.eventbrite_fee?.value) + centsOrZero(costs.payment_fee?.value);
  const taxes = centsOrZero(costs.tax?.value);
  const net = gross === null ? null : Math.max(gross - fees - taxes, 0);
  const base = parseCents(costs.base_price?.value);
  const discount = parseCents(costs.discount?.value);
  const currency = costs.gross?.currency ?? costs.base_price?.currency ?? null;

  const fallbackPurchaserName = [order.first_name, order.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  const purchaserNameRaw = order.name ?? (fallbackPurchaserName.length ? fallbackPurchaserName : null);
  const purchaserName = purchaserNameRaw && purchaserNameRaw.length ? purchaserNameRaw : null;
  const eventId = order.event_id ?? order.event?.id ?? null;

  // Extract event data
  const event = order.event ?? {};
  const venue = event.venue ?? {};
  const venueAddress = venue.address ?? {};
  const category = event.category ?? {};
  const format = event.format ?? {};

  return {
    source: 'eventbrite',
    source_id: order.id,
    event_source_id: eventId,
    session_source_id: eventId,
    status: order.status ?? null,
    financial_status: order.payment_status ?? order.status ?? null,
    total_cents: gross,
    subtotal_cents: base,
    net_sales_cents: net,
    gross_sales_cents: gross,
    discounts_cents: discount,
    taxes_cents: taxes,
    fees_cents: fees || null,
    purchaser_email: order.email ?? order.profile?.email ?? null,
    purchaser_name: purchaserName,
    ordered_at: toIso(order.created),
    updated_at: toIso(order.changed),
    currency,
    additional_fields: Array.isArray(order.attendees) && order.attendees.length ? order.attendees : null,

    // Event columns (using LOCAL times)
    event_name: event.name?.text ?? null,
    event_description: event.description?.text ?? null,
    event_status: event.status ?? null,
    event_start_date: toIso(event.start?.local),
    event_end_date: toIso(event.end?.local),
    event_timezone: event.start?.timezone ?? null,
    event_capacity: event.capacity ?? null,
    capacity_is_custom: event.capacity_is_custom ?? null,
    venue_name: venue.name ?? null,
    venue_city: venueAddress.city ?? null,
    venue_region: venueAddress.region ?? null,
    venue_country: venueAddress.country ?? null,
    online_event: event.online_event ?? null,
    category_name: category.name ?? null,
    format_name: format.name ?? null,
    is_free: event.is_free ?? null,
    event_published_at: toIso(event.published),
    listed: event.listed ?? null,
    invite_only: event.invite_only ?? null,
    shareable: event.shareable ?? null,
    event_created_at: toIso(event.created),
    event_changed_at: toIso(event.changed),

    raw: order,
    ingested_at: ingestedAt,
    updated_at_api: toIso(order.changed),
  };
};

// Upsert orders to Supabase
const upsertOrders = async (supabase, orders) => {
  if (!orders || orders.length === 0) return { success: true, count: 0 };

  const { error } = await supabase
    .from('orders_eventbrite')
    .upsert(orders, {
      onConflict: 'source_id',
      ignoreDuplicates: false
    });

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  return { success: true, count: orders.length };
};

// Main backfill function
async function backfillEventData() {
  console.log('🚀 Starting Eventbrite event data backfill...\n');

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Get all unique event IDs from existing orders
  console.log('📊 Fetching unique event IDs from database...');
  const { data: events, error: eventsError } = await supabase
    .from('orders_eventbrite')
    .select('event_source_id')
    .not('event_source_id', 'is', null);

  if (eventsError) {
    console.error('❌ Failed to fetch event IDs:', eventsError.message);
    process.exit(1);
  }

  const uniqueEventIds = [...new Set(events.map(e => e.event_source_id))];
  console.log(`✅ Found ${uniqueEventIds.length} unique events\n`);

  // Process each event
  let totalProcessed = 0;
  let totalOrders = 0;
  let totalErrors = 0;
  const ingestedAt = new Date().toISOString();

  for (let i = 0; i < uniqueEventIds.length; i++) {
    const eventId = uniqueEventIds[i];
    const progress = `[${i + 1}/${uniqueEventIds.length}]`;

    console.log(`${progress} Processing event ${eventId}...`);

    try {
      // Fetch event details first to verify it exists
      const event = await fetchEvent(eventId);
      if (!event) {
        console.log(`   ⚠️  Event not found or inaccessible, skipping`);
        totalErrors++;
        await sleep(RATE_LIMIT_DELAY);
        continue;
      }

      console.log(`   📅 Event: "${event.name?.text ?? 'Unnamed'}" (${event.status ?? 'unknown status'})`);

      // Fetch all orders for this event with event expansion
      const orders = await fetchEventOrders(eventId);
      console.log(`   📦 Fetched ${orders.length} orders`);

      if (orders.length === 0) {
        console.log(`   ✓ No orders to update`);
        totalProcessed++;
        await sleep(RATE_LIMIT_DELAY);
        continue;
      }

      // Merge venue data from the separately fetched event into each order's event object
      // The orders endpoint doesn't expand event.venue, so we need to merge it from the full event fetch
      // IMPORTANT: We merge into the order object AND update the raw field so venue data persists in DB
      const ordersWithVenue = orders.map(order => {
        const mergedOrder = {
          ...order,
          event: {
            ...(order.event || {}),
            venue: event.venue || null
          }
        };
        return mergedOrder;
      });

      // Map and upsert orders in batches
      const mappedOrders = ordersWithVenue
        .map(order => mapOrderRecord(order, ingestedAt))
        .filter(Boolean);

      for (let j = 0; j < mappedOrders.length; j += BATCH_SIZE) {
        const batch = mappedOrders.slice(j, j + BATCH_SIZE);
        await upsertOrders(supabase, batch);
        console.log(`   ✓ Updated batch ${Math.floor(j / BATCH_SIZE) + 1}/${Math.ceil(mappedOrders.length / BATCH_SIZE)} (${batch.length} orders)`);
      }

      totalOrders += mappedOrders.length;
      totalProcessed++;

      // Rate limiting
      await sleep(RATE_LIMIT_DELAY);

    } catch (error) {
      console.error(`   ❌ Error processing event ${eventId}:`, error.message);
      totalErrors++;
    }

    console.log('');
  }

  // Summary
  console.log('═══════════════════════════════════════════');
  console.log('📊 BACKFILL SUMMARY');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ Events processed: ${totalProcessed}/${uniqueEventIds.length}`);
  console.log(`📦 Orders updated: ${totalOrders}`);
  console.log(`❌ Errors: ${totalErrors}`);
  console.log('═══════════════════════════════════════════\n');

  // Verify results
  console.log('🔍 Verifying results...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('orders_eventbrite')
    .select('event_name, event_start_date')
    .not('event_name', 'is', null);

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError.message);
  } else {
    console.log(`✅ ${verifyData.length} orders now have event data\n`);
  }

  console.log('🎉 Backfill complete!');
}

// Run the backfill
backfillEventData().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
