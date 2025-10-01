#!/usr/bin/env node

// Bulk insert orders using correct schema
const https = require('https');

const HUMANITIX_API_KEY = 'e1d1dd7f16c5e2ad034d89e2f2056d0684e7113d154476a6c59735a31ed78c91915e068534197c92e187ad0251c171fdf0bb0d7b99ee6cbc2cb62d5753a01f1e279cd316e5b64420b4264891f3332edac4b8404e400bf07e1f79f4e2ba0acf946c8c0b3c35963ea7a1c89e86c1ceb2';

let insertCount = 0;

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

// Execute SQL via subprocess
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

// Escape SQL strings
function escapeSql(str) {
  if (!str) return '';
  return str.toString().replace(/'/g, "''").replace(/\\/g, '\\\\');
}

async function main() {
  console.log('🚀 Bulk inserting orders...');

  // Fetch Events
  const eventsResponse = await makeRequest({
    url: 'https://api.humanitix.com/v1/events?page=1&pageSize=100',
    method: 'GET',
    headers: { 'X-API-Key': HUMANITIX_API_KEY }
  });

  if (eventsResponse.events) {
    console.log(`📊 Found ${eventsResponse.events.length} events`);

    for (const event of eventsResponse.events) {
      console.log(`\n🎭 Processing event: ${event.name}`);

      // Fetch orders for this event with pagination
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        try {
          const ordersResponse = await makeRequest({
            url: `https://api.humanitix.com/v1/events/${event._id}/orders?page=${page}&pageSize=100`,
            method: 'GET',
            headers: { 'X-API-Key': HUMANITIX_API_KEY }
          });

          if (ordersResponse.orders && ordersResponse.orders.length > 0) {
            console.log(`📃 Page ${page}: Found ${ordersResponse.orders.length} orders`);

            // Process orders in batches of 10 to avoid MCP timeouts
            for (let i = 0; i < ordersResponse.orders.length; i += 10) {
              const batch = ordersResponse.orders.slice(i, i + 10);

              for (const order of batch) {
                try {
                  // Map to correct schema columns
                  const insertQuery = `
                    INSERT INTO orders_htx (
                      source, source_id, event_source_id, session_source_id,
                      order_reference, status, total_cents, net_sales_cents,
                      fees_cents, tax_cents, discount_cents, purchaser_email,
                      purchaser_name, ordered_at, ingested_at
                    ) VALUES (
                      'humanitix',
                      '${escapeSql(order._id)}',
                      '${escapeSql(event._id)}',
                      '${escapeSql(order.eventDateId)}',
                      '${escapeSql(order._id)}',
                      '${escapeSql(order.status)}',
                      ${order.totals?.total ? Math.round(order.totals.total * 100) : 'NULL'},
                      ${order.totals?.netSales ? Math.round(order.totals.netSales * 100) : 'NULL'},
                      ${order.totals?.bookingFee ? Math.round(order.totals.bookingFee * 100) : 'NULL'},
                      ${order.totals?.totalTaxes ? Math.round(order.totals.totalTaxes * 100) : 'NULL'},
                      ${order.totals?.discounts ? Math.round(order.totals.discounts * 100) : 'NULL'},
                      '${escapeSql(order.email)}',
                      '${escapeSql(order.firstName + ' ' + order.lastName)}',
                      '${escapeSql(order.createdAt)}',
                      '${new Date().toISOString()}'
                    ) ON CONFLICT (source, source_id) DO NOTHING;
                  `;

                  await executeMCPSQL(insertQuery);
                  insertCount++;

                  if (insertCount % 50 === 0) {
                    console.log(`✅ Inserted ${insertCount} orders so far...`);
                  }

                } catch (orderError) {
                  console.error(`❌ Error inserting order ${order._id}:`, orderError.message);
                }
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
    }
  }

  console.log(`\n🎉 Bulk insert completed! Total: ${insertCount} orders`);
}

main().catch(console.error);