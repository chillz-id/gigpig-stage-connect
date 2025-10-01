#!/usr/bin/env node

/**
 * Sync Test Events to Notion Database
 */

import https from 'https';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '/root/agents/.env' });

const NOTION_TOKEN = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;

console.log('🔑 Using Notion token:', NOTION_TOKEN?.substring(0, 15) + '...');

/**
 * Make Notion API request
 */
async function makeNotionRequest(url, method, data) {
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
                        reject(new Error(`Notion API error (${res.statusCode}): ${result.message || responseData}`));
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
 * Create simple Notion database without parent
 */
function createDatabaseSchema() {
    return {
        parent: {
            type: "page_id",
            page_id: "13aa6090-bb64-8190-84cc-d84024cb3dd5" // Try with different page ID
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
            // Essential fields only for testing
            Name: { title: {} },
            EventID: { rich_text: {} },
            Venue: { rich_text: {} },
            City: { rich_text: {} },
            Capacity: { number: {} },
            StartDate: { date: {} },
            EndDate: { date: {} },
            Timezone: { rich_text: {} },
            DateSessions: { rich_text: {} },
            TicketTypes: { rich_text: {} },
            PriceRange: { rich_text: {} },
            Published: { checkbox: {} },
            URL: { url: {} },
            Description: { rich_text: {} },
            Keywords: { rich_text: {} }
        }
    };
}

/**
 * Transform event to simple Notion format
 */
function transformToNotion(event) {
    const dates = JSON.parse(event.dates);
    const ticketTypes = JSON.parse(event.ticket_types);

    return {
        properties: {
            Name: {
                title: [{ text: { content: event.name } }]
            },
            EventID: {
                rich_text: [{ text: { content: event.event_id } }]
            },
            Venue: {
                rich_text: [{ text: { content: event.event_location_venue_name || 'N/A' } }]
            },
            City: {
                rich_text: [{ text: { content: event.event_location_city || 'N/A' } }]
            },
            Capacity: {
                number: event.total_capacity
            },
            StartDate: {
                date: { start: event.start_date }
            },
            EndDate: {
                date: { start: event.end_date }
            },
            Timezone: {
                rich_text: [{ text: { content: event.timezone } }]
            },
            DateSessions: {
                rich_text: [{ text: { content: `${dates.length} sessions: ${event.dates.substring(0, 500)}...` } }]
            },
            TicketTypes: {
                rich_text: [{ text: { content: `${ticketTypes.length} types: ${event.ticket_types.substring(0, 500)}...` } }]
            },
            PriceRange: {
                rich_text: [{ text: { content: `$${event.pricing_minimum_price} - $${event.pricing_maximum_price}` } }]
            },
            Published: {
                checkbox: event.published
            },
            URL: {
                url: event.url
            },
            Description: {
                rich_text: [{ text: { content: event.description.substring(0, 2000) } }]
            },
            Keywords: {
                rich_text: [{ text: { content: event.keywords } }]
            }
        }
    };
}

/**
 * Main execution
 */
async function main() {
    try {
        console.log('🚀 Starting Notion sync...\n');

        // Load test data
        const testData = JSON.parse(fs.readFileSync('humanitix-test-extraction.json', 'utf8'));
        console.log(`📊 Loaded ${testData.events.length} test events`);

        // Use existing Events database
        const eventsDbId = '1374745b-8cbe-80fb-aed3-f54d6a543232';
        console.log('\n📋 Using existing Events database...');

        try {
            // Get the database schema first
            const database = await makeNotionRequest(
                `https://api.notion.com/v1/databases/${eventsDbId}`,
                'GET'
            );
            console.log(`✅ Connected to database: ${database.title?.[0]?.plain_text || 'Events'}`);
            console.log(`📋 Database URL: ${database.url}`);

            // Check existing properties
            console.log('\n🔍 Existing properties:');
            Object.keys(database.properties).forEach(prop => {
                console.log(`   • ${prop} (${database.properties[prop].type})`);
            });

            // Sync events with existing schema
            console.log('\n📤 Syncing test events...');
            for (const [index, event] of testData.events.entries()) {

                // Map all available fields to existing schema
                const notionData = {
                    properties: {
                        // Map to existing fields
                        Name: { title: [{ text: { content: event.name } }] },
                        "Humanitix Event ID": { rich_text: [{ text: { content: event.event_id } }] },
                        "Humanitix URL": { url: event.url },
                        Venue: { rich_text: [{ text: { content: event.event_location_venue_name || 'N/A' } }] },
                        Address: { rich_text: [{ text: { content: event.event_location_address || 'N/A' } }] },
                        "Date & Time": { date: { start: event.start_date } },
                        Capacity: { number: event.total_capacity },
                        "Event Description": { rich_text: [{ text: { content: event.description.substring(0, 2000) } }] },
                        Notes: {
                            rich_text: [{
                                text: {
                                    content: `Extracted from Humanitix API:\n` +
                                    `• ${JSON.parse(event.dates).length} date sessions\n` +
                                    `• ${JSON.parse(event.ticket_types).length} ticket types\n` +
                                    `• Price: $${event.pricing_minimum_price}-$${event.pricing_maximum_price}\n` +
                                    `• City: ${event.event_location_city}\n` +
                                    `• Published: ${event.published}\n` +
                                    `• Timezone: ${event.timezone}\n` +
                                    `• Keywords: ${JSON.parse(event.keywords).join(', ')}`
                                }
                            }]
                        }
                    }
                };

                // Remove undefined properties
                Object.keys(notionData.properties).forEach(key => {
                    if (notionData.properties[key] === undefined) {
                        delete notionData.properties[key];
                    }
                });

                try {
                    const page = await makeNotionRequest(
                        `https://api.notion.com/v1/pages`,
                        'POST',
                        {
                            parent: { database_id: eventsDbId },
                            ...notionData
                        }
                    );
                    console.log(`✅ Synced: ${event.name}`);
                    console.log(`   • Page ID: ${page.id}`);
                    console.log(`   • Dates: ${JSON.parse(event.dates).length} sessions`);
                } catch (error) {
                    console.error(`❌ Failed to sync ${event.name}: ${error.message}`);
                }
            }

            console.log('\n🎯 Success! View the database here:');
            console.log(database.url);

        } catch (dbError) {
            console.error('❌ Database access failed:', dbError.message);

            // Alternative: Try to list existing databases to test connection
            console.log('\n🔍 Testing Notion connection by listing pages...');
            try {
                const search = await makeNotionRequest(
                    'https://api.notion.com/v1/search',
                    'POST',
                    {
                        filter: {
                            value: "database",
                            property: "object"
                        },
                        page_size: 10
                    }
                );
                console.log(`✅ Found ${search.results.length} databases in workspace`);

                if (search.results.length > 0) {
                    console.log('\n📋 Available databases:');
                    search.results.forEach((db, i) => {
                        console.log(`   ${i + 1}. ${db.title?.[0]?.plain_text || 'Untitled'} (${db.id})`);
                    });
                }
            } catch (searchError) {
                console.error('❌ Connection test failed:', searchError.message);
            }
        }

    } catch (error) {
        console.error('❌ Sync failed:', error.message);
    }
}

main();