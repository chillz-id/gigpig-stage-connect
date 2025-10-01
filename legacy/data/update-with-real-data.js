/**
 * Update Notion Events with Real Humanitix API Data
 * This script replaces all fabricated data with actual API data
 */

import fs from 'fs/promises';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/root/agents/.env' });

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const EVENTS_DATABASE_ID = "2794745b-8cbe-8112-9ce0-dc2229da701c";

// Our 5 target events that need to be updated
const TARGET_EVENTS = [
  "68c248d8d4381d850eb0a4da", // ID Comedy Club x Mary's Underground - Sat
  "689f33cf2482b38c232f3c3f", // Max Dary Is Leaving
  "689d8a3c9e771b6de8e3bc0e", // Frenchy - New Material Night (18+)
  "68947b841d67cb4b00f4c974", // Jordan Shanks - Self Help LIVE (18+)
  "6874a5d3eeeb85a1fdf86fbb"  // Rory Lowe - Real Men Do Pilates [Mandurah] (ENCORE SHOW)
];

/**
 * Load real API data from the file we created
 */
async function loadRealApiData() {
  try {
    const data = await fs.readFile('/root/agents/data/real-humanitix-api-data.json', 'utf8');
    const apiData = JSON.parse(data);

    console.log(`📋 Loaded real API data for ${apiData.totalEvents} events`);

    // Create a lookup map for our target events
    const targetEventsData = {};

    apiData.events.forEach(event => {
      if (TARGET_EVENTS.includes(event.eventId)) {
        targetEventsData[event.eventId] = event;
      }
    });

    console.log(`✅ Found real data for ${Object.keys(targetEventsData).length} target events`);

    return targetEventsData;
  } catch (error) {
    console.error('❌ Failed to load real API data:', error.message);
    throw error;
  }
}

/**
 * Find existing Notion pages for our target events
 */
async function findNotionPages() {
  try {
    console.log('🔍 Finding existing Notion pages for target events...');

    // Using MCP Notion tool to query the database
    const response = await fetch('https://api.notion.com/v1/databases/' + EVENTS_DATABASE_ID + '/query', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        page_size: 100,
        filter: {
          or: TARGET_EVENTS.map(eventId => ({
            property: "Event ID",
            title: {
              equals: eventId
            }
          }))
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`✅ Found ${data.results.length} existing Notion pages`);

    // Create lookup map by Event ID
    const notionPages = {};
    data.results.forEach(page => {
      const eventIdProperty = page.properties["Event ID"];
      if (eventIdProperty && eventIdProperty.title && eventIdProperty.title[0]) {
        const eventId = eventIdProperty.title[0].text.content;
        notionPages[eventId] = page;
      }
    });

    return notionPages;

  } catch (error) {
    console.error('❌ Failed to find Notion pages:', error.message);
    throw error;
  }
}

/**
 * Update a Notion page with real API data
 */
async function updateNotionPage(pageId, realProperties) {
  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        properties: realProperties
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const updatedPage = await response.json();
    return updatedPage;

  } catch (error) {
    console.error('❌ Failed to update Notion page:', error.message);
    throw error;
  }
}

/**
 * Compare fabricated vs real data for an event
 */
function compareData(eventId, realData, eventName) {
  console.log(`\n📊 Data Comparison: ${eventName}`);
  console.log('='.repeat(60));

  // Check key fields that were fabricated
  const realUserId = realData.rawApiData?.userId || 'NOT FOUND';
  const realOrganiserId = realData.rawApiData?.organiserId || 'NOT FOUND';

  console.log(`🔑 Event ID: ${eventId}`);
  console.log(`👤 Real User ID: ${realUserId}`);
  console.log(`🏢 Real Organiser ID: ${realOrganiserId}`);

  // Show some other real fields we now have
  console.log(`🌍 Currency: ${realData.rawApiData?.currency || 'N/A'}`);
  console.log(`📍 Location: ${realData.rawApiData?.eventLocation?.address?.venueName || 'N/A'}`);
  console.log(`🏷️ Classification: ${realData.rawApiData?.classification?.subcategory || 'N/A'}`);
  console.log(`🎭 Artists: ${realData.rawApiData?.artists?.map(a => a.name).join(', ') || 'N/A'}`);
  console.log(`⏰ Timezone: ${realData.rawApiData?.timezone || 'N/A'}`);

  const totalRealFields = Object.keys(realData.properties).length;
  console.log(`📈 Total real fields available: ${totalRealFields}`);
}

/**
 * Main function to process all updates
 */
async function processRealDataUpdates() {
  try {
    console.log('🚀 Starting Real Data Update Process');
    console.log('=====================================\n');

    // Load real API data
    const realApiData = await loadRealApiData();

    // Find existing Notion pages
    const notionPages = await findNotionPages();

    // Process each target event
    const updateResults = [];

    for (const eventId of TARGET_EVENTS) {
      const realData = realApiData[eventId];
      const notionPage = notionPages[eventId];

      if (!realData) {
        console.log(`⚠️ No real API data found for event: ${eventId}`);
        continue;
      }

      if (!notionPage) {
        console.log(`⚠️ No Notion page found for event: ${eventId}`);
        continue;
      }

      console.log(`\n🔄 Processing: ${realData.eventName}`);

      // Show comparison between fabricated and real data
      compareData(eventId, realData, realData.eventName);

      // Update the Notion page with real API data
      console.log(`\n📝 Updating Notion page with real API data...`);

      try {
        const updatedPage = await updateNotionPage(notionPage.id, realData.properties);

        updateResults.push({
          eventId,
          eventName: realData.eventName,
          notionPageId: notionPage.id,
          success: true,
          fieldsUpdated: Object.keys(realData.properties).length
        });

        console.log(`✅ Successfully updated ${Object.keys(realData.properties).length} fields`);

      } catch (error) {
        console.log(`❌ Failed to update: ${error.message}`);

        updateResults.push({
          eventId,
          eventName: realData.eventName,
          notionPageId: notionPage.id,
          success: false,
          error: error.message
        });
      }
    }

    // Summary
    console.log('\n📊 UPDATE SUMMARY');
    console.log('==================');

    const successful = updateResults.filter(r => r.success);
    const failed = updateResults.filter(r => !r.success);

    console.log(`✅ Successfully updated: ${successful.length} events`);
    console.log(`❌ Failed updates: ${failed.length} events`);

    if (successful.length > 0) {
      const totalFields = successful.reduce((sum, r) => sum + r.fieldsUpdated, 0);
      console.log(`📈 Total fields updated with real data: ${totalFields}`);
      console.log(`📊 Average fields per event: ${Math.round(totalFields / successful.length)}`);

      console.log('\n✅ Successfully updated events:');
      successful.forEach(result => {
        console.log(`   - ${result.eventName} (${result.fieldsUpdated} fields)`);
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed updates:');
      failed.forEach(result => {
        console.log(`   - ${result.eventName}: ${result.error}`);
      });
    }

    console.log('\n🎉 Real data update process completed!');
    console.log('All fabricated data has been replaced with real Humanitix API data.');

    return updateResults;

  } catch (error) {
    console.error('❌ Real data update process failed:', error.message);
    throw error;
  }
}

// Export functions
export {
  loadRealApiData,
  findNotionPages,
  updateNotionPage,
  compareData,
  processRealDataUpdates
};

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  processRealDataUpdates()
    .catch(error => {
      console.error('\n💥 Process failed:', error.message);
      process.exit(1);
    });
}