#!/usr/bin/env node

// Generate SQL INSERT statements for bulk MCP loading
const https = require('https');
const fs = require('fs');

const HUMANITIX_API_KEY = 'e1d1dd7f16c5e2ad034d89e2f2056d0684e7113d154476a6c59735a31ed78c91915e068534197c92e187ad0251c171fdf0bb0d7b99ee6cbc2cb62d5753a01f1e279cd316e5b64420b4264891f3332edac4b8404e400bf07e1f79f4e2ba0acf946c8c0b3c35963ea7a1c89e86c1ceb2';

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

// Escape SQL strings
function escapeSql(str) {
  if (!str) return '';
  return str.toString().replace(/'/g, "''").replace(/\\/g, '\\\\');
}

async function main() {
  console.log('🚀 Generating bulk INSERT statements...');

  const orderInserts = [];
  const sessionInserts = [];
  const ticketInserts = [];

  // Fetch Events
  console.log('📅 Fetching events...');
  const eventsResponse = await makeRequest({
    url: 'https://api.humanitix.com/v1/events?page=1&pageSize=100',
    method: 'GET',
    headers: { 'X-API-Key': HUMANITIX_API_KEY }
  });

  if (eventsResponse.events) {
    console.log(`📊 Found ${eventsResponse.events.length} events`);

    for (const event of eventsResponse.events) {
      console.log(`\n🎭 Processing event: ${event.name}`);

      // Process sessions (event dates)
      if (event.dates && Array.isArray(event.dates)) {
        for (const session of event.dates) {
          const sessionSql = `INSERT INTO sessions_htx (source, source_id, event_source_id, start_date, end_date, timezone, status, ingested_at) VALUES ('humanitix', '${escapeSql(session._id)}', '${escapeSql(event._id)}', '${escapeSql(session.startDate)}', '${escapeSql(session.endDate)}', '${escapeSql(session.timezone)}', '${escapeSql(session.status)}', '${new Date().toISOString()}') ON CONFLICT (source, source_id) DO NOTHING;`;
          sessionInserts.push(sessionSql);
        }
      }

      // Fetch orders for this event with pagination
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
              // Generate order INSERT
              const orderSql = `INSERT INTO orders_htx (
                source, source_id, event_source_id, event_date_id, status, financial_status,
                first_name, last_name, purchaser_email, mobile, currency,
                total_cents, taxes_cents, discount_cents, fees_cents,
                net_sales_cents, gross_sales_cents, humanitix_fee_cents, booking_fee_cents,
                created_at, updated_at, ingested_at
              ) VALUES (
                'humanitix', '${escapeSql(order._id)}', '${escapeSql(event._id)}', '${escapeSql(order.eventDateId)}',
                '${escapeSql(order.status)}', '${escapeSql(order.financialStatus)}',
                '${escapeSql(order.firstName)}', '${escapeSql(order.lastName)}', '${escapeSql(order.email)}',
                '${escapeSql(order.mobile)}', '${escapeSql(order.currency)}',
                ${order.totals?.total ? Math.round(order.totals.total * 100) : 'NULL'},
                ${order.totals?.totalTaxes ? Math.round(order.totals.totalTaxes * 100) : 'NULL'},
                ${order.totals?.discounts ? Math.round(order.totals.discounts * 100) : 'NULL'},
                ${order.totals?.bookingFee ? Math.round(order.totals.bookingFee * 100) : 'NULL'},
                ${order.totals?.netSales ? Math.round(order.totals.netSales * 100) : 'NULL'},
                ${order.totals?.grossSales ? Math.round(order.totals.grossSales * 100) : 'NULL'},
                ${order.totals?.humanitixFee ? Math.round(order.totals.humanitixFee * 100) : 'NULL'},
                ${order.totals?.bookingFee ? Math.round(order.totals.bookingFee * 100) : 'NULL'},
                '${escapeSql(order.createdAt)}', '${escapeSql(order.updatedAt)}', '${new Date().toISOString()}'
              ) ON CONFLICT (source, source_id) DO NOTHING;`;
              orderInserts.push(orderSql);

              // Process tickets for this order
              if (order.tickets && Array.isArray(order.tickets)) {
                for (const ticket of order.tickets) {
                  const ticketSql = `INSERT INTO tickets_htx (
                    source, source_id, order_source_id, event_source_id, event_date_id,
                    ticket_type, status, first_name, last_name, email,
                    price_cents, fees_cents, taxes_cents, discount_cents,
                    created_at, updated_at, ingested_at
                  ) VALUES (
                    'humanitix', '${escapeSql(ticket._id)}', '${escapeSql(order._id)}', '${escapeSql(event._id)}', '${escapeSql(order.eventDateId)}',
                    '${escapeSql(ticket.ticketType)}', '${escapeSql(ticket.status)}', '${escapeSql(ticket.firstName)}',
                    '${escapeSql(ticket.lastName)}', '${escapeSql(ticket.email)}',
                    ${ticket.price ? Math.round(ticket.price * 100) : 'NULL'},
                    ${ticket.fees ? Math.round(ticket.fees * 100) : 'NULL'},
                    ${ticket.taxes ? Math.round(ticket.taxes * 100) : 'NULL'},
                    ${ticket.discount ? Math.round(ticket.discount * 100) : 'NULL'},
                    '${escapeSql(ticket.createdAt || order.createdAt)}', '${escapeSql(ticket.updatedAt || order.updatedAt)}', '${new Date().toISOString()}'
                  ) ON CONFLICT (source, source_id) DO NOTHING;`;
                  ticketInserts.push(ticketSql);
                }
              }

              eventOrderCount++;
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

      console.log(`🎯 Event ${event.name}: Generated ${eventOrderCount} order INSERTs`);
    }
  }

  // Write SQL files
  console.log('\n💾 Writing SQL files...');

  if (orderInserts.length > 0) {
    fs.writeFileSync('/root/agents/bulk-orders.sql', orderInserts.join('\n'));
    console.log(`✅ Generated ${orderInserts.length} order INSERT statements -> bulk-orders.sql`);
  }

  if (sessionInserts.length > 0) {
    fs.writeFileSync('/root/agents/bulk-sessions.sql', sessionInserts.join('\n'));
    console.log(`✅ Generated ${sessionInserts.length} session INSERT statements -> bulk-sessions.sql`);
  }

  if (ticketInserts.length > 0) {
    fs.writeFileSync('/root/agents/bulk-tickets.sql', ticketInserts.join('\n'));
    console.log(`✅ Generated ${ticketInserts.length} ticket INSERT statements -> bulk-tickets.sql`);
  }

  console.log('\n🎉 SQL generation completed!');
  console.log('📋 Next steps:');
  console.log('   1. Execute bulk-orders.sql using MCP');
  console.log('   2. Execute bulk-sessions.sql using MCP');
  console.log('   3. Execute bulk-tickets.sql using MCP');
}

main().catch(console.error);