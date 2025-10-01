#!/usr/bin/env node

// Sync orders using MCP Supabase for reliable inserts
const https = require('https');

const HUMANITIX_API_KEY = 'e1d1dd7f16c5e2ad034d89e2f2056d0684e7113d154476a6c59735a31ed78c91915e068534197c92e187ad0251c171fdf0bb0d7b99ee6cbc2cb62d5753a01f1e279cd316e5b64420b4264891f3332edac4b8404e400bf07e1f79f4e2ba0acf946c8c0b3c35963ea7a1c89e86c1ceb2';

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

// Execute SQL via a subprocess to use MCP
function executeMCPSQL(query) {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    const claude = spawn('claude', ['mcp:supabase:execute_sql', `--query=${query}`], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let error = '';

    claude.stdout.on('data', (data) => {
      output += data.toString();
    });

    claude.stderr.on('data', (data) => {
      error += data.toString();
    });

    claude.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(error || `Process exited with code ${code}`));
      }
    });
  });
}

async function main() {
  console.log('🚀 Starting orders sync via MCP...');

  // Fetch Events
  console.log('📅 Fetching events...');
  const eventsResponse = await makeRequest({
    url: 'https://api.humanitix.com/v1/events?page=1&pageSize=100',
    method: 'GET',
    headers: { 'X-API-Key': HUMANITIX_API_KEY }
  });

  if (eventsResponse.events) {
    console.log(`📊 Found ${eventsResponse.events.length} events`);

    for (const event of eventsResponse.events.slice(0, 3)) { // Process 3 events for testing
      console.log(`\n🎭 Processing event: ${event.name}`);

      // Fetch orders for this event (first page only for testing)
      try {
        const ordersResponse = await makeRequest({
          url: `https://api.humanitix.com/v1/events/${event._id}/orders?page=1&pageSize=10`,
          method: 'GET',
          headers: { 'X-API-Key': HUMANITIX_API_KEY }
        });

        if (ordersResponse.orders && ordersResponse.orders.length > 0) {
          console.log(`📃 Found ${ordersResponse.orders.length} orders`);

          for (const order of ordersResponse.orders.slice(0, 3)) { // Process 3 orders per event
            try {
              // Prepare order record for SQL insertion
              const sourceId = order._id.replace(/'/g, "''"); // Escape single quotes
              const eventSourceId = event._id.replace(/'/g, "''");
              const status = (order.status || '').replace(/'/g, "''");
              const firstName = (order.firstName || '').replace(/'/g, "''");
              const lastName = (order.lastName || '').replace(/'/g, "''");
              const email = (order.email || '').replace(/'/g, "''");
              const currency = (order.currency || '').replace(/'/g, "''");
              const eventDateId = (order.eventDateId || '').replace(/'/g, "''");
              const financialStatus = (order.financialStatus || '').replace(/'/g, "''");
              const mobile = (order.mobile || '').replace(/'/g, "''");
              const createdAt = order.createdAt || new Date().toISOString();
              const updatedAt = order.updatedAt || new Date().toISOString();
              const ingestedAt = new Date().toISOString();

              const totalCents = order.totals?.total ? Math.round(order.totals.total * 100) : null;
              const taxesCents = order.totals?.totalTaxes ? Math.round(order.totals.totalTaxes * 100) : null;
              const discountCents = order.totals?.discounts ? Math.round(order.totals.discounts * 100) : null;
              const feesCents = order.totals?.bookingFee ? Math.round(order.totals.bookingFee * 100) : null;

              // Check if order already exists
              const checkQuery = `SELECT COUNT(*) as count FROM orders_htx WHERE source_id = '${sourceId}';`;
              const checkResult = await executeMCPSQL(checkQuery);

              if (checkResult.includes('"count":0')) {
                // Insert the order
                const insertQuery = `
                  INSERT INTO orders_htx (
                    source, source_id, event_source_id, event_date_id, status, financial_status,
                    first_name, last_name, purchaser_email, mobile, currency,
                    total_cents, taxes_cents, discount_cents, fees_cents,
                    created_at, updated_at, ingested_at
                  ) VALUES (
                    'humanitix', '${sourceId}', '${eventSourceId}', '${eventDateId}', '${status}', '${financialStatus}',
                    '${firstName}', '${lastName}', '${email}', '${mobile}', '${currency}',
                    ${totalCents}, ${taxesCents}, ${discountCents}, ${feesCents},
                    '${createdAt}', '${updatedAt}', '${ingestedAt}'
                  );
                `;

                await executeMCPSQL(insertQuery);
                console.log(`✅ Inserted order ${order._id}`);
                results.orders.processed++;
              } else {
                console.log(`⏭️  Order ${order._id} already exists`);
                results.orders.skipped++;
              }

            } catch (orderError) {
              console.error(`❌ Error processing order ${order._id}:`, orderError.message);
              results.orders.errors++;
            }
          }
        }
      } catch (orderFetchError) {
        console.error(`❌ Error fetching orders for event ${event._id}:`, orderFetchError.message);
      }
    }
  }

  console.log('\n🎉 Sync completed!');
  console.log('📊 Results:', results);
  console.log(`🎫 Orders: ${results.orders.processed} processed, ${results.orders.skipped} skipped, ${results.orders.errors} errors`);
}

main().catch(console.error);