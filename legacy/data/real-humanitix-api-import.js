/**
 * Real Humanitix API Import Script
 * Fetches actual data from Humanitix API and imports to Notion
 * NO FABRICATED DATA - Only real API responses
 */

import https from 'https';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/root/agents/.env' });

const HUMANITIX_API_KEY = process.env.HUMANITIX_API_KEY;
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const EVENTS_DATABASE_ID = "2794745b-8cbe-8112-9ce0-dc2229da701c";

if (!HUMANITIX_API_KEY) {
  console.error('❌ HUMANITIX_API_KEY not found in environment');
  process.exit(1);
}

const headers = {
  'x-api-key': HUMANITIX_API_KEY,
  'Accept': 'application/json',
  'User-Agent': 'Stand-Up-Sydney/1.0'
};

/**
 * Make HTTP request to Humanitix API
 */
function makeHumanitixRequest(url) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Fetching: ${url}`);

    const request = https.get(url, { headers }, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        console.log(`✅ Response received (${response.statusCode})`);
        try {
          if (response.statusCode === 200) {
            const result = JSON.parse(data);
            resolve(result);
          } else {
            console.error(`❌ API Error ${response.statusCode}:`, data);
            reject(new Error(`API returned ${response.statusCode}: ${data}`));
          }
        } catch (error) {
          console.error('❌ JSON Parse Error:', error.message);
          reject(error);
        }
      });
    });

    request.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      reject(error);
    });

    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Fetch all events from Humanitix API
 */
async function fetchAllEvents() {
  try {
    console.log('📋 Fetching all events from Humanitix API...\n');

    const response = await makeHumanitixRequest('https://api.humanitix.com/v1/events?page=1&pageSize=50');

    if (!response || !response.events) {
      throw new Error('No events found in API response');
    }

    console.log(`✅ Found ${response.events.length} events\n`);
    return response.events;

  } catch (error) {
    console.error('❌ Failed to fetch events:', error.message);
    throw error;
  }
}

/**
 * Fetch detailed event data for a specific event
 */
async function fetchEventDetails(eventId) {
  try {
    console.log(`📋 Fetching details for event: ${eventId}`);

    const response = await makeHumanitixRequest(`https://api.humanitix.com/v1/events/${eventId}`);

    if (!response) {
      throw new Error(`No data found for event ${eventId}`);
    }

    console.log(`✅ Got detailed data for: ${response.name || 'Unknown Event'}`);
    return response;

  } catch (error) {
    console.error(`❌ Failed to fetch details for event ${eventId}:`, error.message);
    return null; // Return null instead of throwing to continue processing other events
  }
}

/**
 * Map real Humanitix API data to Notion properties
 * Only maps fields that actually exist in the API response
 */
function mapRealApiDataToNotionProperties(eventData) {
  const properties = {};

  // Only add properties that have real data from the API
  if (eventData._id) {
    properties["Event ID"] = {
      "title": [{"text": {"content": eventData._id}}]
    };
  }

  if (eventData.name) {
    properties["Name"] = {
      "rich_text": [{"text": {"content": eventData.name}}]
    };
  }

  if (eventData.description) {
    properties["Description"] = {
      "rich_text": [{"text": {"content": eventData.description}}]
    };
  }

  if (eventData.currency) {
    properties["Currency"] = {
      "select": {"name": eventData.currency}
    };
  }

  if (eventData.url) {
    properties["Website URL"] = {
      "url": eventData.url
    };
  }

  if (eventData.slug) {
    properties["Slug"] = {
      "rich_text": [{"text": {"content": eventData.slug}}]
    };
  }

  // Only add these if they exist in the API response
  if (eventData.userId) {
    properties["User ID"] = {
      "rich_text": [{"text": {"content": eventData.userId}}]
    };
  }

  if (eventData.organiserId) {
    properties["Organiser ID"] = {
      "rich_text": [{"text": {"content": eventData.organiserId}}]
    };
  }

  // Classification data (if exists)
  if (eventData.classification?.type) {
    properties["Classification Type"] = {
      "select": {"name": eventData.classification.type}
    };
  }

  if (eventData.classification?.category) {
    properties["Classification Category"] = {
      "select": {"name": eventData.classification.category}
    };
  }

  if (eventData.classification?.subcategory) {
    properties["Classification Subcategory"] = {
      "select": {"name": eventData.classification.subcategory}
    };
  }

  // Artists (if exists)
  if (eventData.artists && Array.isArray(eventData.artists) && eventData.artists.length > 0) {
    const artistNames = eventData.artists.map(artist => artist.name || 'Unknown Artist').join(", ");
    properties["Artists"] = {
      "rich_text": [{"text": {"content": artistNames}}]
    };
  }

  // Status fields (if exist)
  if (typeof eventData.public === 'boolean') {
    properties["Public"] = {
      "checkbox": eventData.public
    };
  }

  if (typeof eventData.published === 'boolean') {
    properties["Published"] = {
      "checkbox": eventData.published
    };

    // Set status based on published state
    properties["Status"] = {
      "select": {"name": eventData.published ? "Active" : "Draft"}
    };
  }

  if (typeof eventData.suspendSales === 'boolean') {
    properties["Suspend Sales"] = {
      "checkbox": eventData.suspendSales
    };
  }

  if (typeof eventData.markedAsSoldOut === 'boolean') {
    properties["Marked As Sold Out"] = {
      "checkbox": eventData.markedAsSoldOut
    };
  }

  // Date fields (if exist)
  if (eventData.startDate) {
    properties["Start Date"] = {
      "date": {"start": eventData.startDate}
    };
  }

  if (eventData.endDate) {
    properties["End Date"] = {
      "date": {"start": eventData.endDate}
    };
  }

  if (eventData.timezone) {
    properties["Timezone"] = {
      "rich_text": [{"text": {"content": eventData.timezone}}]
    };
  }

  if (eventData.publishedAt) {
    properties["Published At"] = {
      "date": {"start": eventData.publishedAt}
    };
  }

  if (eventData.createdAt) {
    properties["Created Date"] = {
      "date": {"start": eventData.createdAt}
    };
  }

  if (eventData.updatedAt) {
    properties["Updated At"] = {
      "date": {"start": eventData.updatedAt}
    };
  }

  // Capacity and pricing (if exist)
  if (typeof eventData.totalCapacity === 'number') {
    properties["Capacity"] = {
      "number": eventData.totalCapacity
    };
    properties["Total Capacity"] = {
      "number": eventData.totalCapacity
    };
  }

  if (eventData.pricing?.min !== undefined) {
    properties["Min Price"] = {
      "number": eventData.pricing.min
    };
  }

  if (eventData.pricing?.max !== undefined) {
    properties["Max Price"] = {
      "number": eventData.pricing.max
    };
  }

  // Image URLs (if exist)
  if (eventData.bannerImage?.url) {
    properties["Banner Image URL"] = {
      "url": eventData.bannerImage.url
    };
  }

  if (eventData.featureImage?.url) {
    properties["Feature Image URL"] = {
      "url": eventData.featureImage.url
    };
  }

  if (eventData.socialImage?.url) {
    properties["Social Image URL"] = {
      "url": eventData.socialImage.url
    };
  }

  // Location data (if exists)
  if (eventData.eventLocation?.type) {
    properties["Event Type"] = {
      "select": {"name": eventData.eventLocation.type === "address" ? "In Person" : "Online"}
    };
    properties["Location Type"] = {
      "select": {"name": eventData.eventLocation.type}
    };
  }

  if (eventData.eventLocation?.address?.venueName) {
    properties["Venue Name"] = {
      "rich_text": [{"text": {"content": eventData.eventLocation.address.venueName}}]
    };
  }

  if (eventData.eventLocation?.address?.city) {
    properties["City"] = {
      "rich_text": [{"text": {"content": eventData.eventLocation.address.city}}]
    };
  }

  // Build full address if components exist
  if (eventData.eventLocation?.address) {
    const address = eventData.eventLocation.address;
    const addressParts = [
      address.street,
      address.city,
      address.state,
      address.postalCode
    ].filter(part => part);

    if (addressParts.length > 0) {
      properties["Address"] = {
        "rich_text": [{"text": {"content": addressParts.join(", ")}}]
      };
    }
  }

  if (eventData.eventLocation?.address?.country) {
    properties["Country"] = {
      "rich_text": [{"text": {"content": eventData.eventLocation.address.country}}]
    };
  }

  if (eventData.eventLocation?.address?.state) {
    properties["Region"] = {
      "rich_text": [{"text": {"content": eventData.eventLocation.address.state}}]
    };
  }

  if (eventData.eventLocation?.address?.placeId) {
    properties["Place ID"] = {
      "rich_text": [{"text": {"content": eventData.eventLocation.address.placeId}}]
    };
  }

  if (eventData.eventLocation?.latLng) {
    const coords = `${eventData.eventLocation.latLng.lat}, ${eventData.eventLocation.latLng.lng}`;
    properties["Lat Lng"] = {
      "rich_text": [{"text": {"content": coords}}]
    };
  }

  if (eventData.eventLocation?.mapLink) {
    properties["Map URL"] = {
      "url": eventData.eventLocation.mapLink
    };
  }

  if (eventData.location?.code) {
    properties["Location Code"] = {
      "rich_text": [{"text": {"content": eventData.location.code}}]
    };
  }

  if (eventData.eventLocation?.instructions) {
    properties["Instructions"] = {
      "rich_text": [{"text": {"content": eventData.eventLocation.instructions}}]
    };
  }

  // Additional fields (if exist)
  if (eventData.accessibility) {
    const accessibilityText = eventData.accessibility.notes || JSON.stringify(eventData.accessibility);
    properties["Accessibility"] = {
      "rich_text": [{"text": {"content": accessibilityText}}]
    };
  }

  if (eventData.affiliateCode?.code) {
    properties["Affiliate Code"] = {
      "rich_text": [{"text": {"content": eventData.affiliateCode.code}}]
    };
  }

  if (eventData.keywords && Array.isArray(eventData.keywords) && eventData.keywords.length > 0) {
    properties["Keywords"] = {
      "rich_text": [{"text": {"content": eventData.keywords.join(", ")}}]
    };
  }

  if (eventData.tagIds && Array.isArray(eventData.tagIds) && eventData.tagIds.length > 0) {
    properties["Tag IDs"] = {
      "rich_text": [{"text": {"content": eventData.tagIds.join(", ")}}]
    };
  }

  if (eventData.additionalQuestions && Array.isArray(eventData.additionalQuestions) && eventData.additionalQuestions.length > 0) {
    const questions = eventData.additionalQuestions.map(q =>
      `${q.question} (${q.required ? 'Required' : 'Optional'})`
    ).join("; ");
    properties["Additional Questions"] = {
      "rich_text": [{"text": {"content": questions}}]
    };
  }

  if (eventData.ticketTypes && Array.isArray(eventData.ticketTypes) && eventData.ticketTypes.length > 0) {
    const tickets = eventData.ticketTypes.map(tt =>
      `${tt.name}: $${tt.price} (${tt.quantity} available)`
    ).join("; ");
    properties["Ticket Types"] = {
      "rich_text": [{"text": {"content": tickets}}]
    };
  }

  if (eventData.packagedTickets && Array.isArray(eventData.packagedTickets)) {
    properties["Packaged Tickets"] = {
      "rich_text": [{"text": {"content": JSON.stringify(eventData.packagedTickets)}}]
    };
  }

  if (eventData.refundPolicy) {
    properties["Custom Refund Policy"] = {
      "rich_text": [{"text": {"content": eventData.refundPolicy}}]
    };
  }

  if (eventData.dates && Array.isArray(eventData.dates) && eventData.dates.length > 0) {
    const dateIds = eventData.dates.map(d => d._id).filter(id => id);
    if (dateIds.length > 0) {
      properties["Event Date IDs"] = {
        "rich_text": [{"text": {"content": JSON.stringify(dateIds)}}]
      };
    }
  }

  return properties;
}

/**
 * Main function to process all events
 */
async function processAllEvents() {
  try {
    console.log('🚀 Starting Real Humanitix API Import');
    console.log('=====================================\n');

    // Fetch all events
    const events = await fetchAllEvents();

    const processedEvents = [];

    // Process each event
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      console.log(`\n📋 Processing event ${i + 1}/${events.length}: ${event.name || event._id}`);

      // Get detailed event data
      const detailedEvent = await fetchEventDetails(event._id);

      if (detailedEvent) {
        // Map to Notion properties using only real API data
        const properties = mapRealApiDataToNotionProperties(detailedEvent);

        processedEvents.push({
          eventId: event._id,
          eventName: event.name || 'Unknown Event',
          properties,
          fieldsCount: Object.keys(properties).length,
          rawApiData: detailedEvent // Keep for reference
        });

        console.log(`✅ Mapped ${Object.keys(properties).length} properties from real API data`);
      } else {
        console.log(`⚠️ Skipping event ${event._id} - could not fetch details`);
      }
    }

    console.log('\n📊 REAL API IMPORT SUMMARY');
    console.log('============================');
    console.log(`✅ Successfully processed: ${processedEvents.length} events`);
    console.log(`📋 Total properties mapped: ${processedEvents.reduce((sum, e) => sum + e.fieldsCount, 0)}`);
    console.log(`📊 Average fields per event: ${Math.round(processedEvents.reduce((sum, e) => sum + e.fieldsCount, 0) / processedEvents.length)}`);

    console.log('\n📝 Events processed:');
    processedEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.eventName} (${event.fieldsCount} fields)`);
    });

    return processedEvents;

  } catch (error) {
    console.error('❌ Real API import failed:', error.message);
    throw error;
  }
}

/**
 * Save processed events data to file for review
 */
async function saveProcessedEvents(events) {
  const outputFile = '/root/agents/data/real-humanitix-api-data.json';
  const fs = await import('fs/promises');

  const data = {
    importDate: new Date().toISOString(),
    totalEvents: events.length,
    events: events
  };

  await fs.writeFile(outputFile, JSON.stringify(data, null, 2));
  console.log(`\n💾 Saved processed data to: ${outputFile}`);

  return outputFile;
}

// Export functions
export {
  fetchAllEvents,
  fetchEventDetails,
  mapRealApiDataToNotionProperties,
  processAllEvents,
  saveProcessedEvents
};

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  processAllEvents()
    .then(events => saveProcessedEvents(events))
    .then(() => {
      console.log('\n🎉 Real Humanitix API import completed successfully!');
      console.log('Next: Review the data and update Notion with real values only.');
    })
    .catch(error => {
      console.error('\n💥 Import failed:', error.message);
      process.exit(1);
    });
}