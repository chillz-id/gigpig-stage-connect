/**
 * Verify Complete Humanitix Import
 *
 * This script verifies that all data has been correctly imported and relations established:
 * - Counts all records in each database
 * - Verifies relations are properly established
 * - Shows data integrity statistics
 * - Compares against API source data
 */

import fs from 'fs/promises';
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
 * Query Notion database with count
 */
async function queryNotionDatabaseCount(databaseId, title = "") {
  try {
    let allResults = [];
    let hasMore = true;
    let nextCursor = null;

    while (hasMore) {
      const body = {
        page_size: 100
      };

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

    console.log(`📊 ${title}: ${allResults.length} records`);
    return allResults;
  } catch (error) {
    console.error(`❌ Failed to query ${title} database:`, error.message);
    return [];
  }
}

/**
 * Extract text content from Notion property
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
 * Check relation integrity
 */
function checkRelationIntegrity(records, relationProperty, entityName) {
  let withRelations = 0;
  let withoutRelations = 0;

  records.forEach(record => {
    const relation = record.properties[relationProperty]?.relation;
    if (relation && relation.length > 0) {
      withRelations++;
    } else {
      withoutRelations++;
    }
  });

  console.log(`   - ${relationProperty}: ${withRelations} linked, ${withoutRelations} unlinked`);
  return { withRelations, withoutRelations };
}

/**
 * Verify data integrity
 */
async function verifyDataIntegrity() {
  console.log('🔍 Verifying Data Integrity');
  console.log('===========================\n');

  // Load all databases
  console.log('📋 Loading all databases...');
  const [events, eventDates, orders, tickets] = await Promise.all([
    queryNotionDatabaseCount(EVENTS_DATABASE_ID, "Events"),
    queryNotionDatabaseCount(EVENT_DATES_DATABASE_ID, "Event Dates"),
    queryNotionDatabaseCount(ORDERS_DATABASE_ID, "Orders"),
    queryNotionDatabaseCount(TICKETS_DATABASE_ID, "Tickets")
  ]);

  console.log('\n🔗 Checking Relations Integrity:');

  // Check Event Date relations
  console.log('\n📅 Event Dates:');
  const eventDateRelations = checkRelationIntegrity(eventDates, "Event", "Event");

  // Check Order relations
  console.log('\n💰 Orders:');
  const orderEventRelations = checkRelationIntegrity(orders, "Event", "Event");
  const orderDateRelations = checkRelationIntegrity(orders, "Event Date", "Event Date");

  // Check Ticket relations
  console.log('\n🎟️ Tickets:');
  const ticketEventRelations = checkRelationIntegrity(tickets, "Event", "Event");
  const ticketDateRelations = checkRelationIntegrity(tickets, "Event Date", "Event Date");
  const ticketOrderRelations = checkRelationIntegrity(tickets, "Order", "Order");

  return {
    counts: {
      events: events.length,
      eventDates: eventDates.length,
      orders: orders.length,
      tickets: tickets.length
    },
    relations: {
      eventDates: eventDateRelations,
      orders: {
        events: orderEventRelations,
        eventDates: orderDateRelations
      },
      tickets: {
        events: ticketEventRelations,
        eventDates: ticketDateRelations,
        orders: ticketOrderRelations
      }
    }
  };
}

/**
 * Compare with API source data
 */
async function compareWithApiData() {
  console.log('\n📊 Comparing with API Source Data');
  console.log('==================================\n');

  try {
    // Load original API data
    const apiData = JSON.parse(await fs.readFile('/root/agents/data/real-humanitix-api-data.json', 'utf8'));

    console.log(`📋 API Source Data:`);
    console.log(`   - Events from API: ${apiData.totalEvents}`);

    // Count expected dates from API
    let expectedDates = 0;
    apiData.events.forEach(event => {
      if (event.rawApiData?.dates) {
        expectedDates += event.rawApiData.dates.length;
      }
    });

    console.log(`   - Expected Event Dates: ${expectedDates}`);

    return {
      apiEvents: apiData.totalEvents,
      expectedDates: expectedDates
    };

  } catch (error) {
    console.error('❌ Failed to load API data for comparison:', error.message);
    return { apiEvents: 0, expectedDates: 0 };
  }
}

/**
 * Show sample data from each database
 */
async function showSampleData() {
  console.log('\n📖 Sample Data from Each Database');
  console.log('==================================\n');

  try {
    // Sample Event Date
    const sampleEventDates = await queryNotionDatabaseCount(EVENT_DATES_DATABASE_ID);
    if (sampleEventDates.length > 0) {
      const sample = sampleEventDates[0];
      console.log('📅 Sample Event Date:');
      console.log(`   - ID: ${extractTextContent(sample.properties["Event Date ID"])}`);
      console.log(`   - Start: ${sample.properties["Start Date"]?.date?.start || 'N/A'}`);
      console.log(`   - Venue: ${extractTextContent(sample.properties["Venue Name"])}`);
      console.log(`   - Has Event Relation: ${sample.properties["Event"]?.relation?.length > 0 ? 'Yes' : 'No'}`);
    }

    // Sample Order
    const sampleOrders = await queryNotionDatabaseCount(ORDERS_DATABASE_ID);
    if (sampleOrders.length > 0) {
      const sample = sampleOrders[0];
      console.log('\n💰 Sample Order:');
      console.log(`   - ID: ${extractTextContent(sample.properties["Order ID"])}`);
      console.log(`   - Customer: ${extractTextContent(sample.properties["First Name"])} ${extractTextContent(sample.properties["Last Name"])}`);
      console.log(`   - Total: $${sample.properties["Total Amount"]?.number || 0}`);
      console.log(`   - Has Event Relation: ${sample.properties["Event"]?.relation?.length > 0 ? 'Yes' : 'No'}`);
      console.log(`   - Has Event Date Relation: ${sample.properties["Event Date"]?.relation?.length > 0 ? 'Yes' : 'No'}`);
    }

    // Sample Ticket
    const sampleTickets = await queryNotionDatabaseCount(TICKETS_DATABASE_ID);
    if (sampleTickets.length > 0) {
      const sample = sampleTickets[0];
      console.log('\n🎟️ Sample Ticket:');
      console.log(`   - ID: ${extractTextContent(sample.properties["Ticket ID"])}`);
      console.log(`   - Attendee: ${extractTextContent(sample.properties["First Name"])} ${extractTextContent(sample.properties["Last Name"])}`);
      console.log(`   - Type: ${extractTextContent(sample.properties["Ticket Type Name"])}`);
      console.log(`   - Has Event Relation: ${sample.properties["Event"]?.relation?.length > 0 ? 'Yes' : 'No'}`);
      console.log(`   - Has Order Relation: ${sample.properties["Order"]?.relation?.length > 0 ? 'Yes' : 'No'}`);
    }

  } catch (error) {
    console.error('❌ Failed to show sample data:', error.message);
  }
}

/**
 * Calculate data quality score
 */
function calculateDataQualityScore(verification, apiComparison) {
  let score = 0;
  let maxScore = 0;

  // Events imported (should match API)
  maxScore += 20;
  if (verification.counts.events === apiComparison.apiEvents) {
    score += 20;
  } else {
    score += Math.round((verification.counts.events / apiComparison.apiEvents) * 20);
  }

  // Event dates imported
  maxScore += 15;
  if (verification.counts.eventDates >= apiComparison.expectedDates * 0.8) {
    score += 15;
  } else {
    score += Math.round((verification.counts.eventDates / apiComparison.expectedDates) * 15);
  }

  // Orders imported
  maxScore += 15;
  if (verification.counts.orders > 0) {
    score += 15;
  }

  // Tickets imported
  maxScore += 15;
  if (verification.counts.tickets > 0) {
    score += 15;
  }

  // Event Date relations
  maxScore += 10;
  if (verification.relations.eventDates.withoutRelations === 0) {
    score += 10;
  } else {
    score += Math.round((verification.relations.eventDates.withRelations / verification.counts.eventDates) * 10);
  }

  // Order relations
  maxScore += 15;
  const orderRelationScore = (
    (verification.relations.orders.events.withoutRelations === 0 ? 7.5 : 0) +
    (verification.relations.orders.eventDates.withoutRelations === 0 ? 7.5 : 0)
  );
  score += orderRelationScore;

  // Ticket relations
  maxScore += 10;
  const ticketRelationScore = (
    (verification.relations.tickets.events.withoutRelations === 0 ? 3.33 : 0) +
    (verification.relations.tickets.eventDates.withoutRelations === 0 ? 3.33 : 0) +
    (verification.relations.tickets.orders.withoutRelations === 0 ? 3.33 : 0)
  );
  score += Math.round(ticketRelationScore);

  return Math.round((score / maxScore) * 100);
}

/**
 * Main verification function
 */
async function runVerification() {
  try {
    console.log('✅ Humanitix Import Verification');
    console.log('================================\n');

    // Verify API credentials
    if (!NOTION_TOKEN) {
      throw new Error('NOTION_TOKEN environment variable not set');
    }

    // Run all verifications
    const verification = await verifyDataIntegrity();
    const apiComparison = await compareWithApiData();
    await showSampleData();

    // Calculate data quality score
    const qualityScore = calculateDataQualityScore(verification, apiComparison);

    // Final summary
    console.log('\n🏆 VERIFICATION SUMMARY');
    console.log('=======================');
    console.log(`📊 Data Quality Score: ${qualityScore}%`);

    if (qualityScore >= 90) {
      console.log('🎉 EXCELLENT - Import is complete and high quality!');
    } else if (qualityScore >= 75) {
      console.log('✅ GOOD - Import is mostly complete with minor issues');
    } else if (qualityScore >= 50) {
      console.log('⚠️ FAIR - Import has some significant gaps');
    } else {
      console.log('❌ POOR - Import needs significant attention');
    }

    console.log('\n📈 Record Counts:');
    console.log(`   - Events: ${verification.counts.events} (Expected: ${apiComparison.apiEvents})`);
    console.log(`   - Event Dates: ${verification.counts.eventDates} (Expected: ~${apiComparison.expectedDates})`);
    console.log(`   - Orders: ${verification.counts.orders}`);
    console.log(`   - Tickets: ${verification.counts.tickets}`);

    console.log('\n🔗 Relation Quality:');
    const eventDateRelationPercent = Math.round((verification.relations.eventDates.withRelations / verification.counts.eventDates) * 100);
    const orderEventRelationPercent = Math.round((verification.relations.orders.events.withRelations / verification.counts.orders) * 100);
    const orderDateRelationPercent = Math.round((verification.relations.orders.eventDates.withRelations / verification.counts.orders) * 100);
    const ticketEventRelationPercent = Math.round((verification.relations.tickets.events.withRelations / verification.counts.tickets) * 100);
    const ticketOrderRelationPercent = Math.round((verification.relations.tickets.orders.withRelations / verification.counts.tickets) * 100);

    console.log(`   - Event Dates → Events: ${eventDateRelationPercent}%`);
    console.log(`   - Orders → Events: ${orderEventRelationPercent}%`);
    console.log(`   - Orders → Event Dates: ${orderDateRelationPercent}%`);
    console.log(`   - Tickets → Events: ${ticketEventRelationPercent}%`);
    console.log(`   - Tickets → Orders: ${ticketOrderRelationPercent}%`);

    return {
      qualityScore,
      verification,
      apiComparison
    };

  } catch (error) {
    console.error('💥 Verification failed:', error.message);
    process.exit(1);
  }
}

// Export function
export { runVerification };

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  runVerification();
}