/**
 * Establish Relations Between Events, Event Dates, Orders, and Tickets
 *
 * This script creates proper relational links between all entities in Notion:
 * - Event Dates → Events
 * - Orders → Events and Event Dates
 * - Tickets → Events, Event Dates, and Orders
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/root/agents/.env' });

const NOTION_TOKEN = process.env.NOTION_TOKEN;

// Database IDs
const EVENTS_DATABASE_ID = "2794745b-8cbe-8112-9ce0-dc2229da701c";
const EVENT_DATES_DATABASE_ID = "2794745b-8cbe-81b8-b290-c4d552eb0c0f";
const ORDERS_DATABASE_ID = "2794745b-8cbe-811d-ae4f-fe88f3295973";
const TICKETS_DATABASE_ID = "2794745b-8cbe-81bb-b17b-e9e9d53e05c8";

/**
 * Query Notion database for all pages
 */
async function queryNotionDatabase(databaseId, filter = null) {
  try {
    let allResults = [];
    let hasMore = true;
    let nextCursor = null;

    while (hasMore) {
      const body = {
        page_size: 100
      };

      if (filter) body.filter = filter;
      if (nextCursor) body.start_cursor = nextCursor;

      const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Notion query failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      allResults = allResults.concat(data.results);
      hasMore = data.has_more;
      nextCursor = data.next_cursor;
    }

    return allResults;
  } catch (error) {
    console.error('❌ Failed to query Notion database:', error.message);
    throw error;
  }
}

/**
 * Update Notion page properties
 */
async function updateNotionPage(pageId, properties) {
  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({ properties })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion update failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Failed to update Notion page:', error.message);
    throw error;
  }
}

/**
 * Extract text content from Notion rich text or title property
 */
function extractTextContent(property) {
  if (!property) return '';

  if (property.title && property.title.length > 0) {
    return property.title[0].text.content;
  }

  if (property.rich_text && property.rich_text.length > 0) {
    return property.rich_text[0].text.content;
  }

  return '';
}

/**
 * Create lookup maps for efficient relation matching
 */
async function createLookupMaps() {
  console.log('📋 Creating lookup maps...');

  // Load all entities
  const [events, eventDates, orders, tickets] = await Promise.all([
    queryNotionDatabase(EVENTS_DATABASE_ID),
    queryNotionDatabase(EVENT_DATES_DATABASE_ID),
    queryNotionDatabase(ORDERS_DATABASE_ID),
    queryNotionDatabase(TICKETS_DATABASE_ID)
  ]);

  // Create lookup maps
  const eventsByEventId = new Map();
  const eventDatesByDateId = new Map();
  const ordersByOrderId = new Map();

  // Map events by Event ID (title field)
  events.forEach(event => {
    const eventId = extractTextContent(event.properties["Event ID"]);
    if (eventId) {
      eventsByEventId.set(eventId, event);
    }
  });

  // Map event dates by Event Date ID (title field)
  eventDates.forEach(eventDate => {
    const dateId = extractTextContent(eventDate.properties["Event Date ID"]);
    if (dateId) {
      eventDatesByDateId.set(dateId, eventDate);
    }
  });

  // Map orders by Order ID (title field)
  orders.forEach(order => {
    const orderId = extractTextContent(order.properties["Order ID"]);
    if (orderId) {
      ordersByOrderId.set(orderId, order);
    }
  });

  console.log(`✅ Created lookup maps:`);
  console.log(`   - ${eventsByEventId.size} events`);
  console.log(`   - ${eventDatesByDateId.size} event dates`);
  console.log(`   - ${ordersByOrderId.size} orders`);
  console.log(`   - ${tickets.length} tickets`);

  return {
    events,
    eventDates,
    orders,
    tickets,
    eventsByEventId,
    eventDatesByDateId,
    ordersByOrderId
  };
}

/**
 * Establish Event Date → Event relations
 */
async function establishEventDateRelations(lookupMaps) {
  console.log('\n🔗 Establishing Event Date → Event relations...');

  let successCount = 0;
  let errorCount = 0;

  for (const eventDate of lookupMaps.eventDates) {
    try {
      // Check if relation already exists
      const existingEventRelation = eventDate.properties["Event"]?.relation;
      if (existingEventRelation && existingEventRelation.length > 0) {
        console.log(`⏭️ Event Date ${extractTextContent(eventDate.properties["Event Date ID"])} already has Event relation`);
        continue;
      }

      // Get the Event Date ID to find matching event in our API data
      const eventDateId = extractTextContent(eventDate.properties["Event Date ID"]);
      if (!eventDateId) {
        console.log(`⚠️ No Event Date ID found for event date: ${eventDate.id}`);
        continue;
      }

      // Load our real API data to find which event this date belongs to
      const fs = await import('fs/promises');
      const apiData = JSON.parse(await fs.readFile('/root/agents/data/real-humanitix-api-data.json', 'utf8'));

      let parentEventId = null;
      for (const event of apiData.events) {
        if (event.rawApiData?.dates) {
          const matchingDate = event.rawApiData.dates.find(date => date._id === eventDateId);
          if (matchingDate) {
            parentEventId = event.eventId;
            break;
          }
        }
      }

      if (!parentEventId) {
        console.log(`⚠️ No parent event found for Event Date: ${eventDateId}`);
        continue;
      }

      // Find the corresponding Event page
      const eventPage = lookupMaps.eventsByEventId.get(parentEventId);
      if (!eventPage) {
        console.log(`⚠️ No Event page found for Event ID: ${parentEventId}`);
        continue;
      }

      // Update Event Date with Event relation
      const properties = {
        "Event": {
          "relation": [{ "id": eventPage.id }]
        }
      };

      await updateNotionPage(eventDate.id, properties);
      successCount++;
      console.log(`✅ Linked Event Date ${eventDateId} → Event ${parentEventId}`);

    } catch (error) {
      console.error(`❌ Failed to establish relation for Event Date ${eventDate.id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`📊 Event Date Relations: ${successCount} success, ${errorCount} errors`);
  return { successCount, errorCount };
}

/**
 * Establish Order relations (Order → Event and Order → Event Date)
 */
async function establishOrderRelations(lookupMaps) {
  console.log('\n🔗 Establishing Order relations...');

  let successCount = 0;
  let errorCount = 0;

  for (const order of lookupMaps.orders) {
    try {
      const orderId = extractTextContent(order.properties["Order ID"]);
      const eventId = extractTextContent(order.properties["Event ID"]);
      const eventDateId = extractTextContent(order.properties["Event Date ID"]);

      if (!eventId || !eventDateId) {
        console.log(`⚠️ Missing Event ID or Event Date ID for Order: ${orderId}`);
        continue;
      }

      const properties = {};
      let hasUpdates = false;

      // Link to Event
      const existingEventRelation = order.properties["Event"]?.relation;
      if (!existingEventRelation || existingEventRelation.length === 0) {
        const eventPage = lookupMaps.eventsByEventId.get(eventId);
        if (eventPage) {
          properties["Event"] = { "relation": [{ "id": eventPage.id }] };
          hasUpdates = true;
        }
      }

      // Link to Event Date
      const existingDateRelation = order.properties["Event Date"]?.relation;
      if (!existingDateRelation || existingDateRelation.length === 0) {
        const eventDatePage = lookupMaps.eventDatesByDateId.get(eventDateId);
        if (eventDatePage) {
          properties["Event Date"] = { "relation": [{ "id": eventDatePage.id }] };
          hasUpdates = true;
        }
      }

      if (hasUpdates) {
        await updateNotionPage(order.id, properties);
        successCount++;
        console.log(`✅ Linked Order ${orderId} → Event ${eventId} & Event Date ${eventDateId}`);
      } else {
        console.log(`⏭️ Order ${orderId} already has all relations`);
      }

    } catch (error) {
      console.error(`❌ Failed to establish relations for Order ${order.id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`📊 Order Relations: ${successCount} success, ${errorCount} errors`);
  return { successCount, errorCount };
}

/**
 * Establish Ticket relations (Ticket → Event, Event Date, and Order)
 */
async function establishTicketRelations(lookupMaps) {
  console.log('\n🔗 Establishing Ticket relations...');

  let successCount = 0;
  let errorCount = 0;

  for (const ticket of lookupMaps.tickets) {
    try {
      const ticketId = extractTextContent(ticket.properties["Ticket ID"]);
      const eventId = extractTextContent(ticket.properties["Event ID"]);
      const eventDateId = extractTextContent(ticket.properties["Event Date ID"]);
      const orderId = extractTextContent(ticket.properties["Order ID"]);

      if (!eventId || !eventDateId || !orderId) {
        console.log(`⚠️ Missing IDs for Ticket: ${ticketId}`);
        continue;
      }

      const properties = {};
      let hasUpdates = false;

      // Link to Event
      const existingEventRelation = ticket.properties["Event"]?.relation;
      if (!existingEventRelation || existingEventRelation.length === 0) {
        const eventPage = lookupMaps.eventsByEventId.get(eventId);
        if (eventPage) {
          properties["Event"] = { "relation": [{ "id": eventPage.id }] };
          hasUpdates = true;
        }
      }

      // Link to Event Date
      const existingDateRelation = ticket.properties["Event Date"]?.relation;
      if (!existingDateRelation || existingDateRelation.length === 0) {
        const eventDatePage = lookupMaps.eventDatesByDateId.get(eventDateId);
        if (eventDatePage) {
          properties["Event Date"] = { "relation": [{ "id": eventDatePage.id }] };
          hasUpdates = true;
        }
      }

      // Link to Order
      const existingOrderRelation = ticket.properties["Order"]?.relation;
      if (!existingOrderRelation || existingOrderRelation.length === 0) {
        const orderPage = lookupMaps.ordersByOrderId.get(orderId);
        if (orderPage) {
          properties["Order"] = { "relation": [{ "id": orderPage.id }] };
          hasUpdates = true;
        }
      }

      if (hasUpdates) {
        await updateNotionPage(ticket.id, properties);
        successCount++;
        console.log(`✅ Linked Ticket ${ticketId} → Event, Event Date, & Order`);
      } else {
        console.log(`⏭️ Ticket ${ticketId} already has all relations`);
      }

    } catch (error) {
      console.error(`❌ Failed to establish relations for Ticket ${ticket.id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`📊 Ticket Relations: ${successCount} success, ${errorCount} errors`);
  return { successCount, errorCount };
}

/**
 * Main execution function
 */
async function establishAllRelations() {
  try {
    console.log('🔗 Establishing All Relations Between Entities');
    console.log('=============================================\n');

    // Verify API credentials
    if (!NOTION_TOKEN) {
      throw new Error('NOTION_TOKEN environment variable not set');
    }

    // Create lookup maps
    const lookupMaps = await createLookupMaps();

    // Establish relations
    const eventDateResults = await establishEventDateRelations(lookupMaps);
    const orderResults = await establishOrderRelations(lookupMaps);
    const ticketResults = await establishTicketRelations(lookupMaps);

    // Final summary
    console.log('\n🎉 RELATIONS ESTABLISHMENT COMPLETED!');
    console.log('====================================');
    console.log(`📅 Event Date Relations: ${eventDateResults.successCount} success, ${eventDateResults.errorCount} errors`);
    console.log(`💰 Order Relations: ${orderResults.successCount} success, ${orderResults.errorCount} errors`);
    console.log(`🎟️ Ticket Relations: ${ticketResults.successCount} success, ${ticketResults.errorCount} errors`);

    const totalSuccess = eventDateResults.successCount + orderResults.successCount + ticketResults.successCount;
    const totalErrors = eventDateResults.errorCount + orderResults.errorCount + ticketResults.errorCount;

    console.log(`\n✨ Total Relations Established: ${totalSuccess}`);
    if (totalErrors > 0) {
      console.log(`⚠️ Total Errors: ${totalErrors}`);
    }

  } catch (error) {
    console.error('💥 Relations establishment failed:', error.message);
    process.exit(1);
  }
}

// Export function
export { establishAllRelations };

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  establishAllRelations();
}