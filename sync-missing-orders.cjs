#!/usr/bin/env node

// Sync only NEW orders that don't exist in Supabase
const https = require('https');

const HUMANITIX_API_KEY = 'e1d1dd7f16c5e2ad034d89e2f2056d0684e7113d154476a6c59735a31ed78c91915e068534197c92e187ad0251c171fdf0bb0d7b99ee6cbc2cb62d5753a01f1e279cd316e5b64420b4264891f3332edac4b8404e400bf07e1f79f4e2ba0acf946c8c0b3c35963ea7a1c89e86c1ceb2';
const SUPABASE_URL = 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTYxNTY3OCwiZXhwIjoyMDUxMTkxNjc4fQ.vqHJcZHjQO2d37qiJF2aYzOUj1mlBt5FlJ5U3bqe_bE';

const results = {
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

// Get existing order IDs from Supabase
async function getExistingOrderIds() {
  try {
    const response = await makeRequest({
      url: `${SUPABASE_URL}/rest/v1/orders_htx?select=source_id`,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return new Set(response.map(order => order.source_id));
  } catch (error) {
    console.error('Error getting existing orders:', error.message);
    return new Set();
  }
}

// Insert records in smaller batches
async function insertRecordsBatch(table, records, batchSize = 100) {
  if (records.length === 0) return;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
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
      }, JSON.stringify(batch));
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records into ${table}`);
    } catch (error) {
      console.error(`❌ Failed to insert batch ${Math.floor(i/batchSize) + 1}:`, error.message);
      results.orders.errors += batch.length;
    }
  }
}

async function main() {
  console.log('🚀 Starting NEW orders sync...');

  // Get existing order IDs
  console.log('📋 Getting existing order IDs from Supabase...');
  const existingOrderIds = await getExistingOrderIds();
  console.log(`📊 Found ${existingOrderIds.size} existing orders in Supabase`);

  // Fetch Events
  console.log('📅 Fetching events...');
  const eventsResponse = await makeRequest({
    url: 'https://api.humanitix.com/v1/events?page=1&pageSize=100',
    method: 'GET',
    headers: { 'X-API-Key': HUMANITIX_API_KEY }
  });

  const ordersToInsert = [];

  if (eventsResponse.events) {
    console.log(`📊 Found ${eventsResponse.events.length} events`);

    for (const event of eventsResponse.events) {
      console.log(`\n🎭 Processing event: ${event.name}`);

      // Fetch ALL orders for this event with pagination
      let page = 1;
      let hasMore = true;
      let eventNewOrderCount = 0;

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
                // Skip if order already exists
                if (existingOrderIds.has(order._id)) {
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
                eventNewOrderCount++;

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

      console.log(`🎯 Event ${event.name}: Found ${eventNewOrderCount} NEW orders`);
    }
  }

  // Insert all NEW records in batches
  console.log('\n💾 Inserting NEW orders into Supabase...');

  if (ordersToInsert.length > 0) {
    await insertRecordsBatch('orders_htx', ordersToInsert);
  } else {
    console.log('ℹ️  No new orders to insert');
  }

  console.log('\n🎉 Sync completed!');
  console.log('📊 Results:', results);
  console.log(`🎫 Orders: ${results.orders.processed} NEW, ${results.orders.skipped} already existed, ${results.orders.errors} errors`);
}

main().catch(console.error);