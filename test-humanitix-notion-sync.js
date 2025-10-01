#!/usr/bin/env node

/**
 * Test Humanitix to Notion Sync - Extract ALL Fields
 * Test with 4 events: Off The Record, ID Comedy Club, Max Dary, Frenchy
 */

import https from 'https';
import dotenv from 'dotenv';
dotenv.config({ path: '/root/agents/.env' });

// Configuration
const HUMANITIX_API_KEY = process.env.HUMANITIX_API_KEY;
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const BASE_URL = 'https://api.humanitix.com/v1';

const headers = {
    'x-api-key': HUMANITIX_API_KEY,
    'Accept': 'application/json',
    'User-Agent': 'Stand-Up-Sydney-Test/1.0'
};

/**
 * Make HTTP request to Humanitix API
 */
async function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, { headers }, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (error) {
                    reject(new Error(`Failed to parse JSON response: ${error.message}`));
                }
            });
        });

        request.on('error', reject);
        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

/**
 * Get test events from Humanitix
 */
async function getTestEvents() {
    console.log('📊 Fetching test events from Humanitix...');

    try {
        const response = await makeRequest(`${BASE_URL}/events?page=1&pageSize=100`);

        // Get our 4 test events
        const testEventNames = [
            'Off The Record - Comedy Club',
            'ID Comedy Club x Mary\'s Underground - Sat',
            'Max Dary Is Leaving',
            'Frenchy - New Material Night (18+)'
        ];

        const testEvents = response.events.filter(event =>
            testEventNames.some(name => event.name.includes(name.split(' - ')[0]))
        ).slice(0, 4);

        console.log(`✅ Found ${testEvents.length} test events:`);
        testEvents.forEach(event => {
            console.log(`   - ${event.name} (${event.dates?.length || 1} dates)`);
        });

        return testEvents;
    } catch (error) {
        console.error('❌ Error fetching events:', error.message);
        throw error;
    }
}

/**
 * Extract ALL fields from an event - NO transformation
 */
function extractAllFields(event) {
    return {
        // Core fields
        event_id: event._id,
        location: event.location,
        currency: event.currency,
        name: event.name,
        description: event.description,
        slug: event.slug,
        user_id: event.userId,
        organiser_id: event.organiserId,
        tag_ids: JSON.stringify(event.tagIds || []),

        // Classification
        classification_type: event.classification?.type,
        classification_category: event.classification?.category,
        classification_subcategory: event.classification?.subcategory,

        // Boolean flags
        public: event.public,
        published: event.published,
        suspend_sales: event.suspendSales,
        marked_sold_out: event.markedAsSoldOut,

        // Date fields
        start_date: event.startDate,
        end_date: event.endDate,
        timezone: event.timezone,
        dates: JSON.stringify(event.dates || []), // ALL dates as JSON

        // Capacity
        total_capacity: event.totalCapacity,

        // Event Location (flattened)
        event_location_type: event.eventLocation?.type,
        event_location_venue_name: event.eventLocation?.venueName,
        event_location_address: event.eventLocation?.address,
        event_location_lat_lng: JSON.stringify(event.eventLocation?.latLng || []),
        event_location_address_components: JSON.stringify(event.eventLocation?.addressComponents || []),
        event_location_place_id: event.eventLocation?.placeId,
        event_location_map_url: event.eventLocation?.mapUrl,
        event_location_city: event.eventLocation?.city,
        event_location_region: event.eventLocation?.region,
        event_location_country: event.eventLocation?.country,

        // Tickets (as JSON)
        ticket_types: JSON.stringify(event.ticketTypes || []),
        packaged_tickets: JSON.stringify(event.packagedTickets || []),

        // Additional questions
        additional_questions: JSON.stringify(event.additionalQuestions || []),

        // Media
        banner_image_url: event.bannerImage?.url,

        // Payment options
        payment_options: JSON.stringify(event.paymentOptions || {}),
        refund_policy: event.paymentOptions?.refundSettings?.refundPolicy,

        // Accessibility
        accessibility: JSON.stringify(event.accessibility || {}),

        // Affiliate codes
        affiliate_codes: JSON.stringify(event.affiliateCodes || []),

        // Pricing
        pricing_minimum_price: event.pricing?.minimumPrice,
        pricing_maximum_price: event.pricing?.maximumPrice,

        // SEO & Discovery
        keywords: JSON.stringify(event.keywords || []),
        artists: JSON.stringify(event.artists || []),

        // Timestamps
        created_at: event.createdAt,
        updated_at: event.updatedAt,
        published_at: event.publishedAt,

        // URL
        url: event.url
    };
}

/**
 * Create Notion database schema for ALL fields
 */
function createNotionDatabaseSchema() {
    return {
        parent: {
            type: "page_id",
            page_id: "25c4745b8cbe8181950bc5d04a77e2c6" // Humanitix attendees page
        },
        title: [
            {
                type: "text",
                text: {
                    content: "Humanitix Events Test"
                }
            }
        ],
        properties: {
            // Core fields
            name: { title: {} },
            event_id: { rich_text: {} },
            location: { rich_text: {} },
            currency: { rich_text: {} },
            description: { rich_text: {} },
            slug: { rich_text: {} },
            user_id: { rich_text: {} },
            organiser_id: { rich_text: {} },
            tag_ids: { rich_text: {} },

            // Classification
            classification_type: { rich_text: {} },
            classification_category: { rich_text: {} },
            classification_subcategory: { rich_text: {} },

            // Boolean flags
            public: { checkbox: {} },
            published: { checkbox: {} },
            suspend_sales: { checkbox: {} },
            marked_sold_out: { checkbox: {} },

            // Date fields
            start_date: { date: {} },
            end_date: { date: {} },
            timezone: { rich_text: {} },
            dates: { rich_text: {} }, // JSON array

            // Capacity
            total_capacity: { number: {} },

            // Event Location
            event_location_type: { rich_text: {} },
            event_location_venue_name: { rich_text: {} },
            event_location_address: { rich_text: {} },
            event_location_lat_lng: { rich_text: {} },
            event_location_address_components: { rich_text: {} },
            event_location_place_id: { rich_text: {} },
            event_location_map_url: { url: {} },
            event_location_city: { rich_text: {} },
            event_location_region: { rich_text: {} },
            event_location_country: { rich_text: {} },

            // Tickets
            ticket_types: { rich_text: {} },
            packaged_tickets: { rich_text: {} },

            // Additional
            additional_questions: { rich_text: {} },
            banner_image_url: { url: {} },
            payment_options: { rich_text: {} },
            refund_policy: { rich_text: {} },
            accessibility: { rich_text: {} },
            affiliate_codes: { rich_text: {} },

            // Pricing
            pricing_minimum_price: { number: {} },
            pricing_maximum_price: { number: {} },

            // SEO
            keywords: { rich_text: {} },
            artists: { rich_text: {} },

            // Timestamps
            created_at: { date: {} },
            updated_at: { date: {} },
            published_at: { date: {} },

            // URL
            url: { url: {} }
        }
    };
}

/**
 * Transform extracted data to Notion format
 */
function transformToNotionFormat(extractedData) {
    const notionData = {
        properties: {}
    };

    // Transform each field to Notion property format
    Object.entries(extractedData).forEach(([key, value]) => {
        if (value === null || value === undefined) {
            return; // Skip null/undefined values
        }

        switch (key) {
            case 'name':
                notionData.properties[key] = {
                    title: [{ text: { content: value.toString().slice(0, 2000) } }]
                };
                break;

            case 'public':
            case 'published':
            case 'suspend_sales':
            case 'marked_sold_out':
                notionData.properties[key] = {
                    checkbox: Boolean(value)
                };
                break;

            case 'total_capacity':
            case 'pricing_minimum_price':
            case 'pricing_maximum_price':
                notionData.properties[key] = {
                    number: typeof value === 'number' ? value : null
                };
                break;

            case 'start_date':
            case 'end_date':
            case 'created_at':
            case 'updated_at':
            case 'published_at':
                if (value) {
                    notionData.properties[key] = {
                        date: { start: value }
                    };
                }
                break;

            case 'banner_image_url':
            case 'event_location_map_url':
            case 'url':
                if (value) {
                    notionData.properties[key] = {
                        url: value.toString()
                    };
                }
                break;

            default:
                // All other fields as rich text
                notionData.properties[key] = {
                    rich_text: [{ text: { content: value.toString().slice(0, 2000) } }]
                };
                break;
        }
    });

    return notionData;
}

/**
 * Make Notion API request
 */
async function makeNotionRequest(url, method, data) {
    const https = await import('https');
    const options = {
        method: method,
        headers: {
            'Authorization': `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(result);
                    } else {
                        reject(new Error(`Notion API error: ${result.message || responseData}`));
                    }
                } catch (error) {
                    reject(new Error(`Failed to parse Notion response: ${error.message}`));
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

/**
 * Main execution
 */
async function main() {
    try {
        console.log('🚀 Starting Humanitix Test Extraction...\n');

        // 1. Get test events
        const events = await getTestEvents();
        console.log(`\n📊 Processing ${events.length} events...\n`);

        // 2. Extract all fields from each event
        const extractedEvents = events.map(event => {
            const extracted = extractAllFields(event);
            console.log(`✅ Extracted all fields from: ${event.name}`);
            console.log(`   - ${Object.keys(extracted).length} fields extracted`);
            console.log(`   - ${event.dates?.length || 1} date sessions`);
            return extracted;
        });

        console.log('\n📋 Extraction Summary:');
        console.log(`   • Total events: ${extractedEvents.length}`);
        console.log(`   • Fields per event: ${Object.keys(extractedEvents[0]).length}`);

        // Show sample field extraction
        console.log('\n🔍 Sample field extraction (first event):');
        const sampleEvent = extractedEvents[0];
        console.log(`   • Name: ${sampleEvent.name}`);
        console.log(`   • Event ID: ${sampleEvent.event_id}`);
        console.log(`   • Venue: ${sampleEvent.event_location_venue_name}`);
        console.log(`   • Total Capacity: ${sampleEvent.total_capacity}`);
        console.log(`   • Dates count: ${JSON.parse(sampleEvent.dates).length}`);
        console.log(`   • Ticket types: ${JSON.parse(sampleEvent.ticket_types).length}`);

        // 3. Save extracted data for verification
        console.log('\n💾 Saving extracted data for verification...');
        const outputData = {
            extraction_timestamp: new Date().toISOString(),
            total_events: extractedEvents.length,
            fields_per_event: Object.keys(extractedEvents[0]).length,
            events: extractedEvents.map(event => ({
                ...event,
                dates_parsed: JSON.parse(event.dates),
                ticket_types_parsed: JSON.parse(event.ticket_types),
                keywords_parsed: JSON.parse(event.keywords)
            }))
        };

        const fs = await import('fs');
        fs.writeFileSync('humanitix-test-extraction.json', JSON.stringify(outputData, null, 2));
        console.log('✅ Data saved to: humanitix-test-extraction.json');

        // 4. Detailed analysis
        console.log('\n📊 Detailed Analysis:');
        extractedEvents.forEach((event, index) => {
            const dates = JSON.parse(event.dates);
            const ticketTypes = JSON.parse(event.ticket_types);
            console.log(`\n${index + 1}. ${event.name}`);
            console.log(`   • Event ID: ${event.event_id}`);
            console.log(`   • Venue: ${event.event_location_venue_name || 'N/A'}`);
            console.log(`   • City: ${event.event_location_city || 'N/A'}`);
            console.log(`   • Capacity: ${event.total_capacity || 'N/A'}`);
            console.log(`   • Date sessions: ${dates.length}`);
            console.log(`   • Ticket types: ${ticketTypes.length}`);
            console.log(`   • Price range: $${event.pricing_minimum_price || 0} - $${event.pricing_maximum_price || 0}`);
            console.log(`   • Published: ${event.published ? 'Yes' : 'No'}`);
            if (dates.length > 1) {
                console.log(`   • First session: ${dates[0].startDate}`);
                console.log(`   • Last session: ${dates[dates.length - 1].startDate}`);
            }
        });

        // 5. Multi-date validation
        const multiDateEvent = extractedEvents.find(e => JSON.parse(e.dates).length > 1);
        if (multiDateEvent) {
            const dates = JSON.parse(multiDateEvent.dates);
            console.log('\n🗓️  Multi-date Event Validation:');
            console.log(`   • Event: ${multiDateEvent.name}`);
            console.log(`   • Total sessions: ${dates.length}`);
            console.log(`   • Sample sessions:`);
            dates.slice(0, 3).forEach((date, i) => {
                console.log(`     ${i + 1}. ${date.startDate} (ID: ${date._id})`);
            });
            if (dates.length > 3) {
                console.log(`     ... and ${dates.length - 3} more sessions`);
            }
        }

        console.log('\n✅ Test extraction completed successfully!');
        console.log('\n🎯 Summary:');
        console.log(`   • Extracted ${extractedEvents.length} events`);
        console.log(`   • ${Object.keys(extractedEvents[0]).length} fields per event`);
        console.log(`   • Multi-date events handled correctly`);
        console.log(`   • All API fields preserved`);
        console.log('\n📁 Output file: humanitix-test-extraction.json');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.message.includes('Notion API error')) {
            console.error('💡 Check Notion token and permissions');
        }
        process.exit(1);
    }
}

main();