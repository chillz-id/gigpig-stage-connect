/**
 * Create and Populate Venues Database
 *
 * This script:
 * 1. Extracts venue data from Events and Event Sessions databases
 * 2. Deduplicates venues based on name and address
 * 3. Populates the new Venues database
 * 4. Adds relations between venues and other databases
 */

import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config({ path: '/root/.n8n/.env' });

const NOTION_TOKEN = process.env.NOTION_TOKEN;

// Database IDs
const EVENTS_DATABASE_ID = "2794745b-8cbe-8112-9ce0-dc2229da701c";
const EVENT_SESSIONS_DATABASE_ID = "2794745b-8cbe-81b8-b290-c4d552eb0c0f";
const VENUES_DATABASE_ID = "27a4745b-8cbe-81a1-a0f0-fc905a00dbef";

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
 * Create Notion page
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
        properties
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion create failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Failed to create Notion page:', error.message);
    throw error;
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
 * Generate venue ID from name and address
 */
function generateVenueId(venueName, address) {
  const combined = `${venueName}-${address}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const hash = crypto.createHash('md5').update(combined).digest('hex').substring(0, 8);
  return `venue-${hash}`;
}

/**
 * Determine venue type from name
 */
function determineVenueType(venueName) {
  const name = venueName.toLowerCase();

  if (name.includes('hotel')) return 'Hotel';
  if (name.includes('club')) return 'Club';
  if (name.includes('bar') || name.includes('pub')) return 'Bar';
  if (name.includes('restaurant') || name.includes('cafe')) return 'Restaurant';
  if (name.includes('theater') || name.includes('theatre')) return 'Theater';
  if (name.includes('center') || name.includes('centre')) return 'Conference Center';
  if (name.includes('hall') || name.includes('community')) return 'Community Center';

  return 'Other';
}

/**
 * Extract venues from Events database
 */
async function extractVenuesFromEvents() {
  console.log('📋 Extracting venues from Events database...');

  const events = await queryNotionDatabase(EVENTS_DATABASE_ID);
  const venues = new Map(); // Use Map to deduplicate

  events.forEach(event => {
    const venueName = extractTextContent(event.properties['Venue Name']);
    const address = extractTextContent(event.properties['Address']);
    const city = extractTextContent(event.properties['City']);
    const region = extractTextContent(event.properties['Region']);
    const country = extractTextContent(event.properties['Country']);
    const mapUrl = event.properties['Map URL']?.url;
    const placeId = extractTextContent(event.properties['Place ID']);
    const capacity = event.properties['Total Capacity']?.number || event.properties['Capacity']?.number;

    if (!venueName) return; // Skip if no venue name

    const venueKey = `${venueName}-${address}`.toLowerCase();

    if (!venues.has(venueKey)) {
      const venueId = generateVenueId(venueName, address);
      const venueType = determineVenueType(venueName);

      venues.set(venueKey, {
        venueId,
        venueName,
        venueType,
        address,
        city,
        region,
        country,
        mapUrl,
        placeId,
        capacity,
        sourceEventId: extractTextContent(event.properties['Event ID'])
      });
    }
  });

  console.log(`✅ Found ${venues.size} unique venues in Events database`);
  return Array.from(venues.values());
}

/**
 * Extract venues from Event Sessions database
 */
async function extractVenuesFromSessions() {
  console.log('📋 Extracting venues from Event Sessions database...');

  const sessions = await queryNotionDatabase(EVENT_SESSIONS_DATABASE_ID);
  const venues = new Map();

  sessions.forEach(session => {
    const venueName = extractTextContent(session.properties['Venue Name']);
    const address = extractTextContent(session.properties['Venue Address']);
    const capacity = session.properties['Venue Capacity']?.number;

    if (!venueName && !address) return; // Skip if no venue info

    const venueKey = `${venueName}-${address}`.toLowerCase();

    if (!venues.has(venueKey)) {
      const venueId = generateVenueId(venueName || 'unknown', address || 'unknown');
      const venueType = determineVenueType(venueName || '');

      venues.set(venueKey, {
        venueId,
        venueName,
        venueType,
        address,
        capacity,
        sourceSessionId: extractTextContent(session.properties['Event Date ID'])
      });
    }
  });

  console.log(`✅ Found ${venues.size} venues in Event Sessions database`);
  return Array.from(venues.values());
}

/**
 * Merge and deduplicate venues from both sources
 */
function mergeVenues(eventVenues, sessionVenues) {
  console.log('🔄 Merging and deduplicating venues...');

  const mergedVenues = new Map();

  // Add venues from Events database (more complete data)
  eventVenues.forEach(venue => {
    const key = `${venue.venueName}-${venue.address}`.toLowerCase();
    mergedVenues.set(key, venue);
  });

  // Merge with venues from Sessions database
  sessionVenues.forEach(venue => {
    const key = `${venue.venueName}-${venue.address}`.toLowerCase();

    if (mergedVenues.has(key)) {
      // Merge additional info
      const existing = mergedVenues.get(key);
      if (!existing.capacity && venue.capacity) {
        existing.capacity = venue.capacity;
      }
    } else {
      // Add new venue
      mergedVenues.set(key, venue);
    }
  });

  const finalVenues = Array.from(mergedVenues.values());
  console.log(`✅ Final deduplicated venues: ${finalVenues.length}`);

  return finalVenues;
}

/**
 * Create venue page in Notion
 */
async function createVenuePage(venue) {
  const properties = {
    "Venue ID": {
      "title": [
        {
          "text": {
            "content": venue.venueId
          }
        }
      ]
    },
    "Venue Name": {
      "rich_text": [
        {
          "text": {
            "content": venue.venueName || ''
          }
        }
      ]
    },
    "Venue Type": {
      "select": {
        "name": venue.venueType
      }
    },
    "Status": {
      "select": {
        "name": "Active"
      }
    },
    "Street Address": {
      "rich_text": [
        {
          "text": {
            "content": venue.address || ''
          }
        }
      ]
    },
    "City": {
      "rich_text": [
        {
          "text": {
            "content": venue.city || ''
          }
        }
      ]
    },
    "State/Region": {
      "rich_text": [
        {
          "text": {
            "content": venue.region || ''
          }
        }
      ]
    },
    "Country": {
      "rich_text": [
        {
          "text": {
            "content": venue.country || 'Australia'
          }
        }
      ]
    },
    "Total Capacity": {
      "number": venue.capacity || null
    }
  };

  // Add Google Maps URL if available
  if (venue.mapUrl) {
    properties["Google Maps URL"] = {
      "url": venue.mapUrl
    };
  }

  // Add Place ID if available
  if (venue.placeId && venue.placeId !== 'ChIJMandurah12345' && venue.placeId !== 'ChIJKinselas12345') {
    properties["Place ID"] = {
      "rich_text": [
        {
          "text": {
            "content": venue.placeId
          }
        }
      ]
    };
  }

  return await createNotionPage(VENUES_DATABASE_ID, properties);
}

/**
 * Main execution function
 */
async function createVenuesDatabase() {
  try {
    console.log('🏛️ Creating Venues Database and Populating Data');
    console.log('===============================================\n');

    // Verify API credentials
    if (!NOTION_TOKEN) {
      throw new Error('NOTION_TOKEN environment variable not set');
    }

    // Extract venues from both databases
    const eventVenues = await extractVenuesFromEvents();
    const sessionVenues = await extractVenuesFromSessions();

    // Merge and deduplicate
    const finalVenues = mergeVenues(eventVenues, sessionVenues);

    // Create venue pages
    console.log('\n🏗️ Creating venue pages in Notion...');
    let successCount = 0;
    let errorCount = 0;

    for (const venue of finalVenues) {
      try {
        await createVenuePage(venue);
        successCount++;
        console.log(`✅ Created venue: ${venue.venueName} (ID: ${venue.venueId})`);
      } catch (error) {
        console.error(`❌ Failed to create venue ${venue.venueName}:`, error.message);
        errorCount++;
      }
    }

    // Final summary
    console.log('\n🎉 VENUES DATABASE CREATION COMPLETED!');
    console.log('====================================');
    console.log(`✅ Successfully created: ${successCount} venues`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} venues`);
    }

    console.log('\n📊 Venue Statistics:');
    const venueTypes = {};
    finalVenues.forEach(venue => {
      venueTypes[venue.venueType] = (venueTypes[venue.venueType] || 0) + 1;
    });

    Object.entries(venueTypes).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

    console.log('\n📝 Next Steps:');
    console.log('1. Review created venues in Notion');
    console.log('2. Add manager contact information');
    console.log('3. Add facility details (stage, sound system, etc.)');
    console.log('4. Establish relations with Events and Sessions databases');

    return {
      successCount,
      errorCount,
      venueTypes,
      totalVenues: finalVenues.length
    };

  } catch (error) {
    console.error('💥 Venues database creation failed:', error.message);
    process.exit(1);
  }
}

// Export function
export { createVenuesDatabase };

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  createVenuesDatabase();
}