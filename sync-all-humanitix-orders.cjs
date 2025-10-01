#!/usr/bin/env node

// Direct sync of all Humanitix orders to Supabase
const https = require('https');

const HUMANITIX_API_KEY = 'e1d1dd7f16c5e2ad034d89e2f2056d0684e7113d154476a6c59735a31ed78c91915e068534197c92e187ad0251c171fdf0bb0d7b99ee6cbc2cb62d5753a01f1e279cd316e5b64420b4264891f3332edac4b8404e400bf07e1f79f4e2ba0acf946c8c0b3c35963ea7a1c89e86c1ceb2';
const SUPABASE_URL = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTYxNTY3OCwiZXhwIjoyMDUxMTkxNjc4fQ.vqHJcZHjQO2d37qiJF2aYzOUj1mlBt5FlJ5U3bqe_bE';

const results = {
  events: { processed: 0, skipped: 0, errors: 0 },
  orders: { processed: 0, skipped: 0, errors: 0 }
};

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const url = require('url');
    const parsedUrl = url.parse(options.url);

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.path,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (postData) {
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

// Check if record exists
async function checkExists(table, sourceId) {
  try {
    const response = await makeRequest({
      url: `${SUPABASE_URL}/rest/v1/${table}?source_id=eq.${sourceId}&select=source_id`,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return Array.isArray(response) && response.length > 0;
  } catch (error) {
    console.error(`Error checking existence for ${table}:`, error.message);
    return false;
  }
}

// Insert records to Supabase
async function insertRecords(table, records) {
  if (records.length === 0) return;

  try {
    await makeRequest({
      url: `${SUPABASE_URL}/rest/v1/${table}`,
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    }, JSON.stringify(records));
    console.log(`✅ Inserted ${records.length} records into ${table}`);
  } catch (error) {
    console.error(`❌ Failed to insert ${table}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Humanitix complete sync...');

  // Fetch Events
  console.log('📅 Fetching events...');
  const eventsResponse = await makeRequest({
    url: 'https://api.humanitix.com/v1/events?page=1&pageSize=100',
    method: 'GET',
    headers: { 'X-API-Key': HUMANITIX_API_KEY }
  });

  const eventsToInsert = [];
  const ordersToInsert = [];

  if (eventsResponse.events) {
    console.log(`📊 Found ${eventsResponse.events.length} events`);

    for (const event of eventsResponse.events) {
      try {
        console.log(`\n🎭 Processing event: ${event.name}`);

        // Check if event exists
        if (await checkExists('events_htx', event._id)) {
          results.events.skipped++;
          console.log(`⏭️  Event already exists, skipping`);
        } else {
          // Prepare event record
          eventsToInsert.push({
            source: 'humanitix',
            source_id: event._id,
            name: event.name,
            description: event.description,
            start_date: event.startDate,
            end_date: event.endDate,
            timezone: event.timezone,
            status: event.status,
            location: event.location,
            currency: event.currency,
            raw: event,
            ingested_at: new Date().toISOString()
          });
          results.events.processed++;
          console.log(`📝 Event prepared for insert`);
        }

        // Fetch ALL orders for this event with pagination
        console.log(`🎫 Fetching orders for event...`);
        let page = 1;
        let hasMore = true;
        let eventOrderCount = 0;

        while (hasMore) {
          try {
            const ordersResponse = await makeRequest({
              url: `https://api.humanitix.com/v1/events/${event._id}/orders?page=${page}&pageSize=100`,
              method: 'GET',
              headers: { 'X-API-Key': HUMANITIX_API_KEY }
            });

            if (ordersResponse.orders && ordersResponse.orders.length > 0) {
              console.log(`📃 Page ${page}: Found ${ordersResponse.orders.length} orders`);

              for (const order of ordersResponse.orders) {
                try {
                  // Check if order exists
                  if (await checkExists('orders_htx', order._id)) {
                    results.orders.skipped++;
                    continue;
                  }

                  // Prepare order record
                  ordersToInsert.push({
                    source: 'humanitix',
                    source_id: order._id,
                    event_source_id: event._id,
                    event_date_id: order.eventDateId,
                    status: order.status,
                    financial_status: order.financialStatus,
                    first_name: order.firstName,
                    last_name: order.lastName,
                    purchaser_email: order.email,
                    mobile: order.mobile,
                    currency: order.currency,
                    total_cents: order.totals?.total ? Math.round(order.totals.total * 100) : null,
                    taxes_cents: order.totals?.totalTaxes ? Math.round(order.totals.totalTaxes * 100) : null,
                    discount_cents: order.totals?.discounts ? Math.round(order.totals.discounts * 100) : null,
                    fees_cents: order.totals?.bookingFee ? Math.round(order.totals.bookingFee * 100) : null,
                    net_sales_cents: order.totals?.netSales ? Math.round(order.totals.netSales * 100) : null,
                    gross_sales_cents: order.totals?.grossSales ? Math.round(order.totals.grossSales * 100) : null,
                    humanitix_fee_cents: order.totals?.humanitixFee ? Math.round(order.totals.humanitixFee * 100) : null,
                    booking_fee_cents: order.totals?.bookingFee ? Math.round(order.totals.bookingFee * 100) : null,
                    raw: order,
                    created_at: order.createdAt,
                    updated_at: order.updatedAt,
                    ingested_at: new Date().toISOString()
                  });

                  results.orders.processed++;
                  eventOrderCount++;

                } catch (orderError) {
                  console.error(`❌ Error processing order ${order._id}:`, orderError.message);
                  results.orders.errors++;
                }
              }

              // Check if we should continue pagination
              if (ordersResponse.orders.length < 100) {
                hasMore = false;
              } else {
                page++;
              }
            } else {
              hasMore = false;
            }
          } catch (orderFetchError) {
            console.error(`❌ Error fetching orders for event ${event._id}, page ${page}:`, orderFetchError.message);
            hasMore = false;
          }
        }

        console.log(`🎯 Event ${event.name}: Found ${eventOrderCount} orders`);

      } catch (eventError) {
        console.error(`❌ Error processing event ${event._id}:`, eventError.message);
        results.events.errors++;
      }
    }
  }

  // Insert all records
  console.log('\n💾 Inserting data into Supabase...');

  if (eventsToInsert.length > 0) {
    await insertRecords('events_htx', eventsToInsert);
  }

  if (ordersToInsert.length > 0) {
    await insertRecords('orders_htx', ordersToInsert);
  }

  console.log('\n🎉 Sync completed!');
  console.log('📊 Results:', results);
  console.log(`📅 Events: ${results.events.processed} processed, ${results.events.skipped} skipped, ${results.events.errors} errors`);
  console.log(`🎫 Orders: ${results.orders.processed} processed, ${results.orders.skipped} skipped, ${results.orders.errors} errors`);
}

main().catch(console.error);