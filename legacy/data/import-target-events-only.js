/**
 * Import ONLY the 5 Target Events with Complete Data
 *
 * This script focuses on the 5 target events and ensures they have:
 * - All event dates imported
 * - All orders imported for each date
 * - All tickets imported from orders
 * - All relations properly established
 */

import fs from 'fs/promises';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/root/agents/.env' });

const HUMANITIX_API_KEY = process.env.HUMANITIX_API_KEY;
const NOTION_TOKEN = process.env.NOTION_TOKEN;

// Our 5 target events ONLY
const TARGET_EVENTS = [
  "68c248d8d4381d850eb0a4da", // ID Comedy Club x Mary's Underground - Sat
  "689f33cf2482b38c232f3c3f", // Max Dary Is Leaving
  "689d8a3c9e771b6de8e3bc0e", // Frenchy - New Material Night (18+)
  "68947b841d67cb4b00f4c974", // Jordan Shanks - Self Help LIVE (18+)
  "6874a5d3eeeb85a1fdf86fbb"  // Rory Lowe - Real Men Do Pilates [Mandurah] (ENCORE SHOW)
];

// Database IDs
const EVENTS_DATABASE_ID = "2794745b-8cbe-8112-9ce0-dc2229da701c";
const EVENT_DATES_DATABASE_ID = "2794745b-8cbe-81b8-b290-c4d552eb0c0f";
const ORDERS_DATABASE_ID = "2794745b-8cbe-811d-ae4f-fe88f3295973";
const TICKETS_DATABASE_ID = "2794745b-8cbe-81bb-b17b-e9e9d53e05c8";

/**
 * Make authenticated request to Humanitix API
 */
async function makeHumanitixRequest(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': HUMANITIX_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'StandUpSydney-Import/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Humanitix API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Humanitix API request failed:', error.message);
    throw error;
  }
}

/**
 * Create or update page in Notion database
 */
async function createNotionPage(databaseId, properties) {
  try {
    const response = await fetch(`https://api.notion.com/v1/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: properties
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Notion API request failed:', error.message);
    throw error;
  }
}

/**
 * Find existing Notion page by title field
 */
async function findNotionPage(databaseId, titleField, titleValue) {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        filter: {
          property: titleField,
          title: { equals: titleValue }
        },
        page_size: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Notion query failed: ${response.status}`);
    }

    const data = await response.json();
    return data.results.length > 0 ? data.results[0] : null;
  } catch (error) {
    console.error('❌ Failed to find Notion page:', error.message);
    return null;
  }
}

/**
 * Load only target events from existing data
 */
async function loadTargetEvents() {
  try {
    const data = await fs.readFile('/root/agents/data/real-humanitix-api-data.json', 'utf8');
    const apiData = JSON.parse(data);

    // Filter to only include our 5 target events
    const targetEvents = apiData.events.filter(event =>
      TARGET_EVENTS.includes(event.eventId)
    );

    console.log(`📋 Loaded ${targetEvents.length} target events from API data`);
    return targetEvents;
  } catch (error) {
    console.error('❌ Failed to load target events:', error.message);
    throw error;
  }
}

/**
 * Import Event Dates for target events only
 */
async function importTargetEventDates() {
  console.log('🗓️ Starting Event Dates Import (Target Events Only)...');

  const events = await loadTargetEvents();
  let importedCount = 0;
  let skippedCount = 0;
  const importDetails = [];

  for (const event of events) {
    console.log(`\n📅 Processing dates for: ${event.eventName}`);

    if (!event.rawApiData?.dates || event.rawApiData.dates.length === 0) {
      console.log(`⚠️ No dates found for event: ${event.eventName}`);
      continue;
    }

    for (const date of event.rawApiData.dates) {
      // Check if event date already exists
      const existingDate = await findNotionPage(
        EVENT_DATES_DATABASE_ID,
        "Event Date ID",
        date._id
      );

      if (existingDate) {
        console.log(`  ⏭️ Date already exists: ${date._id}`);
        skippedCount++;
        continue;
      }

      // Map event date to Notion properties
      const properties = {
        "Event Date ID": {
          "title": [{ "text": { "content": date._id } }]
        },
        "Start Date": {
          "date": { "start": date.startDate }
        },
        "End Date": {
          "date": { "start": date.endDate }
        },
        "Disabled": {
          "checkbox": date.disabled || false
        },
        "Deleted": {
          "checkbox": date.deleted || false
        },
        "Timezone": {
          "rich_text": [{ "text": { "content": event.rawApiData.timezone || "" } }]
        },
        "Venue Name": {
          "rich_text": [{ "text": { "content": event.rawApiData.eventLocation?.address?.venueName || "" } }]
        },
        "Venue Address": {
          "rich_text": [{ "text": { "content": getFullAddress(event.rawApiData.eventLocation?.address) } }]
        },
        "Venue Capacity": {
          "number": event.rawApiData.totalCapacity || null
        },
        "Date Status": {
          "select": { "name": getDateStatus(date, event.rawApiData) }
        }
      };

      // Remove null/empty properties
      Object.keys(properties).forEach(key => {
        if (properties[key] === null ||
            (properties[key].rich_text && properties[key].rich_text[0].text.content === "") ||
            (properties[key].number === null)) {
          delete properties[key];
        }
      });

      try {
        await createNotionPage(EVENT_DATES_DATABASE_ID, properties);
        importedCount++;
        importDetails.push({ eventName: event.eventName, dateId: date._id });
        console.log(`  ✅ Imported date: ${date._id}`);
      } catch (error) {
        console.error(`  ❌ Failed to import date ${date._id}:`, error.message);
      }
    }
  }

  console.log(`\n📊 Event Dates Import Summary:`);
  console.log(`✅ Imported: ${importedCount} event dates`);
  console.log(`⏭️ Skipped: ${skippedCount} existing dates`);

  return { importedCount, skippedCount, importDetails };
}

/**
 * Import Orders for target events only
 */
async function importTargetOrders() {
  console.log('\n💰 Starting Orders Import (Target Events Only)...');

  const events = await loadTargetEvents();
  let importedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const importDetails = [];

  for (const event of events) {
    console.log(`\n💳 Processing orders for: ${event.eventName}`);

    if (!event.rawApiData?.dates || event.rawApiData.dates.length === 0) {
      console.log(`  ⚠️ No dates found, skipping orders`);
      continue;
    }

    for (const date of event.rawApiData.dates) {
      try {
        console.log(`  📅 Fetching orders for date: ${date._id}`);

        // Fetch orders for this event and date
        const ordersResponse = await makeHumanitixRequest(
          `https://api.humanitix.com/v1/events/${event.eventId}/orders?eventDateId=${date._id}&pageSize=50`
        );

        if (!ordersResponse.orders || ordersResponse.orders.length === 0) {
          console.log(`    📋 No orders found`);
          continue;
        }

        console.log(`    📦 Found ${ordersResponse.orders.length} orders`);

        for (const order of ordersResponse.orders) {
          // Check if order already exists
          const existingOrder = await findNotionPage(
            ORDERS_DATABASE_ID,
            "Order ID",
            order._id
          );

          if (existingOrder) {
            console.log(`    ⏭️ Order already exists: ${order._id}`);
            skippedCount++;
            continue;
          }

          // Map order to Notion properties
          const properties = mapOrderToNotionProperties(order, event.eventId, date._id);

          try {
            await createNotionPage(ORDERS_DATABASE_ID, properties);
            importedCount++;
            importDetails.push({
              eventName: event.eventName,
              orderId: order._id,
              customer: `${order.firstName} ${order.lastName}`
            });
            console.log(`    ✅ Imported order: ${order._id} (${order.firstName} ${order.lastName})`);
          } catch (error) {
            console.error(`    ❌ Failed to import order ${order._id}:`, error.message);
            errorCount++;
          }
        }

      } catch (error) {
        console.error(`  ❌ Failed to fetch orders for date ${date._id}:`, error.message);
        errorCount++;
      }
    }
  }

  console.log(`\n📊 Orders Import Summary:`);
  console.log(`✅ Imported: ${importedCount} orders`);
  console.log(`⏭️ Skipped: ${skippedCount} existing orders`);
  console.log(`❌ Errors: ${errorCount} failures`);

  return { importedCount, skippedCount, errorCount, importDetails };
}

/**
 * Import Tickets for target events only
 */
async function importTargetTickets() {
  console.log('\n🎟️ Starting Tickets Import (Target Events Only)...');

  const events = await loadTargetEvents();
  let importedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const importDetails = [];

  for (const event of events) {
    console.log(`\n🎫 Processing tickets for: ${event.eventName}`);

    if (!event.rawApiData?.dates || event.rawApiData.dates.length === 0) {
      console.log(`  ⚠️ No dates found, skipping tickets`);
      continue;
    }

    for (const date of event.rawApiData.dates) {
      try {
        console.log(`  📅 Fetching tickets for date: ${date._id}`);

        // Fetch orders for this event and date (orders contain tickets)
        const ordersResponse = await makeHumanitixRequest(
          `https://api.humanitix.com/v1/events/${event.eventId}/orders?eventDateId=${date._id}&pageSize=50`
        );

        if (!ordersResponse.orders || ordersResponse.orders.length === 0) {
          console.log(`    📋 No orders found`);
          continue;
        }

        for (const order of ordersResponse.orders) {
          if (!order.tickets || order.tickets.length === 0) {
            continue;
          }

          console.log(`    🎟️ Processing ${order.tickets.length} tickets from order ${order._id}`);

          for (const ticket of order.tickets) {
            // Check if ticket already exists
            const existingTicket = await findNotionPage(
              TICKETS_DATABASE_ID,
              "Ticket ID",
              ticket._id
            );

            if (existingTicket) {
              console.log(`      ⏭️ Ticket already exists: ${ticket._id}`);
              skippedCount++;
              continue;
            }

            // Map ticket to Notion properties
            const properties = mapTicketToNotionProperties(ticket, order, event.eventId, date._id);

            try {
              await createNotionPage(TICKETS_DATABASE_ID, properties);
              importedCount++;
              importDetails.push({
                eventName: event.eventName,
                ticketId: ticket._id,
                attendee: `${ticket.firstName} ${ticket.lastName}`
              });
              console.log(`      ✅ Imported ticket: ${ticket._id} (${ticket.firstName} ${ticket.lastName})`);
            } catch (error) {
              console.error(`      ❌ Failed to import ticket ${ticket._id}:`, error.message);
              errorCount++;
            }
          }
        }

      } catch (error) {
        console.error(`  ❌ Failed to fetch tickets for date ${date._id}:`, error.message);
        errorCount++;
      }
    }
  }

  console.log(`\n📊 Tickets Import Summary:`);
  console.log(`✅ Imported: ${importedCount} tickets`);
  console.log(`⏭️ Skipped: ${skippedCount} existing tickets`);
  console.log(`❌ Errors: ${errorCount} failures`);

  return { importedCount, skippedCount, errorCount, importDetails };
}

/**
 * Helper functions
 */

function getFullAddress(address) {
  if (!address) return "";

  const parts = [
    address.street,
    address.city,
    address.state,
    address.postalCode
  ].filter(part => part);

  return parts.join(", ");
}

function getDateStatus(date, event) {
  if (date.deleted) return "Cancelled";
  if (date.disabled) return "Cancelled";

  const now = new Date();
  const eventDate = new Date(date.startDate);

  if (eventDate < now) return "Completed";
  if (event.markedAsSoldOut) return "Sold Out";
  if (event.published && event.public) return "On Sale";

  return "Scheduled";
}

function mapOrderToNotionProperties(order, eventId, eventDateId) {
  return {
    "Order ID": {
      "title": [{ "text": { "content": order._id } }]
    },
    "Event ID": {
      "rich_text": [{ "text": { "content": eventId } }]
    },
    "Event Date ID": {
      "rich_text": [{ "text": { "content": eventDateId } }]
    },
    "User ID": {
      "rich_text": [{ "text": { "content": order.userId || "" } }]
    },
    "First Name": {
      "rich_text": [{ "text": { "content": order.firstName || "" } }]
    },
    "Last Name": {
      "rich_text": [{ "text": { "content": order.lastName || "" } }]
    },
    "Email": {
      "email": order.email || null
    },
    "Organisation": {
      "rich_text": [{ "text": { "content": order.organisation || "" } }]
    },
    "Status": {
      "select": { "name": order.status || "complete" }
    },
    "Financial Status": {
      "select": { "name": order.financialStatus || "paid" }
    },
    "Currency": {
      "select": { "name": order.currency || "AUD" }
    },
    "Total Amount": {
      "number": order.total || null
    },
    "Subtotal": {
      "number": order.subtotal || null
    },
    "Booking Fee": {
      "number": order.bookingFee || null
    },
    "Sales Channel": {
      "select": { "name": order.salesChannel || "online" }
    },
    "Created Date": {
      "date": order.createdAt ? { "start": order.createdAt } : null
    },
    "Updated At": {
      "date": order.updatedAt ? { "start": order.updatedAt } : null
    }
  };
}

function mapTicketToNotionProperties(ticket, order, eventId, eventDateId) {
  return {
    "Ticket ID": {
      "title": [{ "text": { "content": ticket._id } }]
    },
    "Event ID": {
      "rich_text": [{ "text": { "content": eventId } }]
    },
    "Order ID": {
      "rich_text": [{ "text": { "content": order._id } }]
    },
    "Event Date ID": {
      "rich_text": [{ "text": { "content": eventDateId } }]
    },
    "Number": {
      "number": ticket.number || null
    },
    "First Name": {
      "rich_text": [{ "text": { "content": ticket.firstName || "" } }]
    },
    "Last Name": {
      "rich_text": [{ "text": { "content": ticket.lastName || "" } }]
    },
    "Organisation": {
      "rich_text": [{ "text": { "content": ticket.organisation || "" } }]
    },
    "Ticket Type Name": {
      "rich_text": [{ "text": { "content": ticket.ticketTypeName || "" } }]
    },
    "Ticket Type ID": {
      "rich_text": [{ "text": { "content": ticket.ticketTypeId || "" } }]
    },
    "Access Code": {
      "rich_text": [{ "text": { "content": ticket.accessCode || "" } }]
    },
    "Status": {
      "select": { "name": ticket.status || "complete" }
    },
    "Currency": {
      "select": { "name": ticket.currency || order.currency || "AUD" }
    },
    "Price": {
      "number": ticket.price || null
    },
    "Fee": {
      "number": ticket.fee || null
    },
    "Total": {
      "number": ticket.total || null
    },
    "Sales Channel": {
      "select": { "name": ticket.salesChannel || order.salesChannel || "online" }
    },
    "Created Date": {
      "date": ticket.createdAt || order.createdAt ? { "start": ticket.createdAt || order.createdAt } : null
    }
  };
}

/**
 * Main execution function
 */
async function runTargetEventsImport() {
  try {
    console.log('🎯 TARGETED IMPORT: 5 Events Only');
    console.log('==================================\n');
    console.log('Target Events:');
    console.log('1. ID Comedy Club x Mary\'s Underground - Sat');
    console.log('2. Max Dary Is Leaving');
    console.log('3. Frenchy - New Material Night (18+)');
    console.log('4. Jordan Shanks - Self Help LIVE (18+)');
    console.log('5. Rory Lowe - Real Men Do Pilates [Mandurah] (ENCORE SHOW)');
    console.log('\n');

    // Verify API credentials
    if (!HUMANITIX_API_KEY) {
      throw new Error('HUMANITIX_API_KEY environment variable not set');
    }
    if (!NOTION_TOKEN) {
      throw new Error('NOTION_TOKEN environment variable not set');
    }

    console.log('✅ API credentials verified\n');

    // Import Event Dates
    const dateResults = await importTargetEventDates();

    // Import Orders
    const orderResults = await importTargetOrders();

    // Import Tickets
    const ticketResults = await importTargetTickets();

    // Final summary
    console.log('\n🎉 TARGET EVENTS IMPORT COMPLETED!');
    console.log('===================================');
    console.log(`📅 Event Dates: ${dateResults.importedCount} imported, ${dateResults.skippedCount} skipped`);
    console.log(`💰 Orders: ${orderResults.importedCount} imported, ${orderResults.skippedCount} skipped, ${orderResults.errorCount} errors`);
    console.log(`🎟️ Tickets: ${ticketResults.importedCount} imported, ${ticketResults.skippedCount} skipped, ${ticketResults.errorCount} errors`);

    const totalImported = dateResults.importedCount + orderResults.importedCount + ticketResults.importedCount;
    console.log(`\n✨ Total Records Imported: ${totalImported}`);

    // Show what was imported
    if (dateResults.importDetails.length > 0) {
      console.log('\n📅 Imported Event Dates:');
      dateResults.importDetails.forEach(detail => {
        console.log(`   - ${detail.eventName}: ${detail.dateId}`);
      });
    }

    if (orderResults.importDetails.length > 0) {
      console.log('\n💰 Sample Imported Orders:');
      orderResults.importDetails.slice(0, 5).forEach(detail => {
        console.log(`   - ${detail.eventName}: ${detail.customer}`);
      });
      if (orderResults.importDetails.length > 5) {
        console.log(`   ... and ${orderResults.importDetails.length - 5} more`);
      }
    }

    if (ticketResults.importDetails.length > 0) {
      console.log('\n🎟️ Sample Imported Tickets:');
      ticketResults.importDetails.slice(0, 5).forEach(detail => {
        console.log(`   - ${detail.eventName}: ${detail.attendee}`);
      });
      if (ticketResults.importDetails.length > 5) {
        console.log(`   ... and ${ticketResults.importDetails.length - 5} more`);
      }
    }

  } catch (error) {
    console.error('💥 Import failed:', error.message);
    process.exit(1);
  }
}

// Export functions
export {
  importTargetEventDates,
  importTargetOrders,
  importTargetTickets,
  runTargetEventsImport
};

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  runTargetEventsImport();
}