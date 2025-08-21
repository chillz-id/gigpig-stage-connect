#!/usr/bin/env node

/**
 * Humanitix Event & Ticket Type Analysis
 * Extracts and analyzes all event data and ticket configurations
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { promisify } from 'util';

// Configuration
const HUMANITIX_API_KEY = process.env.HUMANITIX_API_KEY || '9f23a99810087538c62feb645c45d195ab966d38533cd6456a4c7092f6ae679fd4515936e5b9869c261dc83721626a46c7328dd22bf6acd567646897ecf4c8c7b4f8b24a1b0dbab2fd952a8c25dd7a3b3f5542f0121c63e6616322eb128741bfbd9322b94c5a46acbe3cc9add71ec2';
const BASE_URL = 'https://api.humanitix.com/v1';

const headers = {
    'x-api-key': HUMANITIX_API_KEY,
    'Accept': 'application/json',
    'User-Agent': 'Stand-Up-Sydney-Analysis/1.0'
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
 * Get all events from Humanitix
 */
async function getAllEvents() {
    console.log('📊 Fetching all events from Humanitix...');
    
    try {
        const response = await makeRequest(`${BASE_URL}/events?page=1`);
        console.log(`✅ Found ${response.total} events`);
        return response.events || [];
    } catch (error) {
        console.error('❌ Error fetching events:', error.message);
        throw error;
    }
}

/**
 * Get ticket types for a specific event (from event data)
 */
function getEventTicketTypes(event) {
    return event.ticketTypes || [];
}

/**
 * Get orders for a specific event
 */
async function getEventOrders(eventId) {
    try {
        const response = await makeRequest(`${BASE_URL}/events/${eventId}/orders?page=1`);
        return response.orders || [];
    } catch (error) {
        console.error(`❌ Error fetching orders for event ${eventId}:`, error.message);
        return [];
    }
}

/**
 * Analyze event data
 */
function analyzeEvent(event) {
    return {
        id: event._id,
        name: event.name,
        status: event.published ? 'published' : 'draft',
        startDate: event.startDate,
        endDate: event.endDate,
        timezone: event.timezone,
        venue: {
            name: event.eventLocation?.venueName || 'Unknown',
            address: event.eventLocation?.address || 'Unknown',
            city: event.eventLocation?.city || 'Unknown',
            state: event.eventLocation?.region || 'Unknown',
            country: event.eventLocation?.country || 'Unknown',
            capacity: event.totalCapacity || null
        },
        description: event.description,
        category: event.classification?.category || 'Unknown',
        subcategory: event.classification?.subcategory || 'Unknown',
        tags: event.keywords || [],
        banner: event.bannerImage?.url || null,
        creator: {
            organizer: event.organiserId || 'Unknown',
            user: event.userId || 'Unknown'
        },
        ticketSalesOpen: event.ticketSalesOpen,
        ticketSalesClose: event.ticketSalesClose,
        maxTicketsPerOrder: event.maxTicketsPerOrder,
        currency: event.currency || 'AUD',
        public: event.public || false,
        suspendSales: event.suspendSales || false,
        markedAsSoldOut: event.markedAsSoldOut || false,
        pricing: event.pricing || {},
        affiliateCodes: event.affiliateCodes || [],
        created: event.createdAt,
        updated: event.updatedAt,
        publishedAt: event.publishedAt,
        url: event.url
    };
}

/**
 * Analyze ticket type data
 */
function analyzeTicketType(ticket, eventId) {
    return {
        id: ticket._id,
        eventId: eventId,
        name: ticket.name,
        description: ticket.description,
        price: ticket.price,
        currency: 'AUD', // Default from event
        capacity: ticket.quantity,
        sold: ticket.sold || 0,
        available: ticket.quantity - (ticket.sold || 0),
        salesStart: ticket.salesStart,
        salesEnd: ticket.salesEnd,
        minQuantity: ticket.minQuantity || 1,
        maxQuantity: ticket.maxQuantity || 10,
        type: ticket.price > 0 ? 'paid' : 'free',
        isDonation: ticket.isDonation || false,
        disabled: ticket.disabled || false,
        deleted: ticket.deleted || false,
        created: ticket.createdAt,
        updated: ticket.updatedAt
    };
}

/**
 * Analyze pricing patterns
 */
function analyzePricingPatterns(allTickets) {
    const patterns = {
        priceRanges: {},
        commonTypes: {},
        averagePrice: 0,
        freeTickets: 0,
        paidTickets: 0,
        discountStrategies: {}
    };
    
    let totalPrice = 0;
    let paidTicketCount = 0;
    
    allTickets.forEach(ticket => {
        // Price ranges
        const priceRange = getPriceRange(ticket.price);
        patterns.priceRanges[priceRange] = (patterns.priceRanges[priceRange] || 0) + 1;
        
        // Common types
        const typeCategory = categorizeByTicketType(ticket);
        patterns.commonTypes[typeCategory] = (patterns.commonTypes[typeCategory] || 0) + 1;
        
        // Price statistics
        if (ticket.price > 0) {
            totalPrice += ticket.price;
            paidTicketCount++;
            patterns.paidTickets++;
        } else {
            patterns.freeTickets++;
        }
        
        // Discount strategies
        if (ticket.discounts && ticket.discounts.length > 0) {
            ticket.discounts.forEach(discount => {
                const discountType = discount.type || 'unknown';
                patterns.discountStrategies[discountType] = (patterns.discountStrategies[discountType] || 0) + 1;
            });
        }
    });
    
    patterns.averagePrice = paidTicketCount > 0 ? totalPrice / paidTicketCount : 0;
    
    return patterns;
}

/**
 * Get price range category
 */
function getPriceRange(price) {
    if (price === 0) return 'Free';
    if (price <= 20) return '$1-$20';
    if (price <= 50) return '$21-$50';
    if (price <= 100) return '$51-$100';
    if (price <= 200) return '$101-$200';
    return '$200+';
}

/**
 * Categorize ticket type based on name
 */
function categorizeTicketType(typeName) {
    if (typeName.includes('early') || typeName.includes('earlybird')) return 'Early Bird';
    if (typeName.includes('vip') || typeName.includes('premium')) return 'VIP/Premium';
    if (typeName.includes('general') || typeName.includes('standard')) return 'General Admission';
    if (typeName.includes('student') || typeName.includes('concession')) return 'Student/Concession';
    if (typeName.includes('group') || typeName.includes('table')) return 'Group/Table';
    if (typeName.includes('combo') || typeName.includes('package')) return 'Package Deal';
    if (typeName.includes('door') || typeName.includes('walk')) return 'Door Sales';
    return 'Other';
}

/**
 * Categorize by ticket type property
 */
function categorizeByTicketType(ticket) {
    if (ticket.type === 'package') return 'Package Deal';
    return categorizeTicketType(ticket.name.toLowerCase());
}

/**
 * Analyze venue patterns
 */
function analyzeVenuePatterns(events) {
    const patterns = {
        venues: {},
        cities: {},
        states: {},
        capacities: [],
        averageCapacity: 0
    };
    
    events.forEach(event => {
        const venue = event.venue;
        
        // Venue frequency
        if (venue.name && venue.name !== 'Unknown') {
            patterns.venues[venue.name] = (patterns.venues[venue.name] || 0) + 1;
        }
        
        // City distribution
        if (venue.city && venue.city !== 'Unknown') {
            patterns.cities[venue.city] = (patterns.cities[venue.city] || 0) + 1;
        }
        
        // State distribution
        if (venue.state && venue.state !== 'Unknown') {
            patterns.states[venue.state] = (patterns.states[venue.state] || 0) + 1;
        }
        
        // Capacity analysis
        if (venue.capacity && venue.capacity > 0) {
            patterns.capacities.push(venue.capacity);
        }
    });
    
    // Calculate average capacity
    if (patterns.capacities.length > 0) {
        patterns.averageCapacity = patterns.capacities.reduce((a, b) => a + b, 0) / patterns.capacities.length;
    }
    
    return patterns;
}

/**
 * Generate comprehensive analysis report
 */
function generateAnalysisReport(events, allTickets, allOrders) {
    const report = {
        generatedAt: new Date().toISOString(),
        summary: {
            totalEvents: events.length,
            totalTicketTypes: allTickets.length,
            totalOrders: allOrders.length,
            publishedEvents: events.filter(e => e.status === 'published').length,
            draftEvents: events.filter(e => e.status === 'draft').length,
            publicEvents: events.filter(e => e.public === true).length,
            soldOutEvents: events.filter(e => e.markedAsSoldOut === true).length,
            suspendedEvents: events.filter(e => e.suspendSales === true).length
        },
        events: events,
        ticketTypes: allTickets,
        pricingAnalysis: analyzePricingPatterns(allTickets),
        venueAnalysis: analyzeVenuePatterns(events),
        eventTicketMapping: {},
        salesPerformance: {}
    };
    
    // Create event-ticket mapping
    events.forEach(event => {
        const eventTickets = allTickets.filter(ticket => ticket.eventId === event.id);
        report.eventTicketMapping[event.id] = {
            eventName: event.name,
            ticketCount: eventTickets.length,
            tickets: eventTickets.map(t => ({
                name: t.name,
                price: t.price,
                capacity: t.capacity,
                sold: t.sold
            }))
        };
        
        // Sales performance
        const totalCapacity = eventTickets.reduce((sum, t) => sum + (t.capacity || 0), 0);
        const totalSold = eventTickets.reduce((sum, t) => sum + (t.sold || 0), 0);
        const revenue = eventTickets.reduce((sum, t) => sum + (t.price * (t.sold || 0)), 0);
        
        report.salesPerformance[event.id] = {
            eventName: event.name,
            totalCapacity,
            totalSold,
            revenue,
            sellThrough: totalCapacity > 0 ? (totalSold / totalCapacity * 100).toFixed(2) : 0
        };
    });
    
    return report;
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(analysis) {
    const md = `# Humanitix Events & Ticket Type Analysis

Generated: ${new Date(analysis.generatedAt).toLocaleString()}

## Summary

- **Total Events**: ${analysis.summary.totalEvents}
- **Total Ticket Types**: ${analysis.summary.totalTicketTypes}
- **Total Orders**: ${analysis.summary.totalOrders}
- **Published Events**: ${analysis.summary.publishedEvents}
- **Draft Events**: ${analysis.summary.draftEvents}
- **Public Events**: ${analysis.summary.publicEvents}
- **Sold Out Events**: ${analysis.summary.soldOutEvents}
- **Suspended Events**: ${analysis.summary.suspendedEvents}

## Events Overview

${analysis.events.map(event => `
### ${event.name}
- **ID**: ${event.id}
- **Status**: ${event.status}
- **Date**: ${event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}
- **Venue**: ${event.venue.name}, ${event.venue.city}, ${event.venue.state}
- **Capacity**: ${event.venue.capacity || 'Unknown'}
- **Creator**: ${event.creator.name}
`).join('')}

## Ticket Type Analysis

### Common Ticket Types
${Object.entries(analysis.pricingAnalysis.commonTypes)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `- **${type}**: ${count} events`)
    .join('\n')}

### Price Distribution
${Object.entries(analysis.pricingAnalysis.priceRanges)
    .sort((a, b) => b[1] - a[1])
    .map(([range, count]) => `- **${range}**: ${count} ticket types`)
    .join('\n')}

### Pricing Statistics
- **Average Price**: $${analysis.pricingAnalysis.averagePrice.toFixed(2)}
- **Free Tickets**: ${analysis.pricingAnalysis.freeTickets}
- **Paid Tickets**: ${analysis.pricingAnalysis.paidTickets}

## Venue Analysis

### Most Popular Venues
${Object.entries(analysis.venueAnalysis.venues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([venue, count]) => `- **${venue}**: ${count} events`)
    .join('\n')}

### City Distribution
${Object.entries(analysis.venueAnalysis.cities)
    .sort((a, b) => b[1] - a[1])
    .map(([city, count]) => `- **${city}**: ${count} events`)
    .join('\n')}

### State Distribution
${Object.entries(analysis.venueAnalysis.states)
    .sort((a, b) => b[1] - a[1])
    .map(([state, count]) => `- **${state}**: ${count} events`)
    .join('\n')}

## Event-Ticket Mapping

${Object.entries(analysis.eventTicketMapping).map(([eventId, mapping]) => `
### ${mapping.eventName}
- **Event ID**: ${eventId}
- **Ticket Types**: ${mapping.ticketCount}

${mapping.tickets.map(ticket => `
  - **${ticket.name}**: $${ticket.price} (${ticket.sold || 0}/${ticket.capacity || 'unlimited'} sold)
`).join('')}
`).join('')}

## Sales Performance

${Object.entries(analysis.salesPerformance)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([eventId, perf]) => `
### ${perf.eventName}
- **Total Revenue**: $${perf.revenue.toFixed(2)}
- **Tickets Sold**: ${perf.totalSold}/${perf.totalCapacity}
- **Sell Through**: ${perf.sellThrough}%
`).join('')}

## Raw Data

### All Events
\`\`\`json
${JSON.stringify(analysis.events, null, 2)}
\`\`\`

### All Ticket Types
\`\`\`json
${JSON.stringify(analysis.ticketTypes, null, 2)}
\`\`\`

---

*This analysis was generated automatically by the Humanitix Event Analysis script*
`;

    return md;
}

/**
 * Main analysis function
 */
async function runAnalysis() {
    console.log('🚀 Starting Humanitix Event & Ticket Type Analysis...\n');
    
    try {
        // Get all events
        const rawEvents = await getAllEvents();
        const events = rawEvents.map(analyzeEvent);
        
        console.log(`📊 Processing ${events.length} events...\n`);
        
        // Get tickets and orders for each event
        const allTickets = [];
        const allOrders = [];
        
        for (const [index, event] of events.entries()) {
            console.log(`🎫 Processing event ${index + 1}/${events.length}: ${event.name}`);
            
            // Get tickets from event data
            const rawTickets = getEventTicketTypes(rawEvents[index]);
            const tickets = rawTickets.map(ticket => analyzeTicketType(ticket, event.id));
            allTickets.push(...tickets);
            
            // Also check for packaged tickets
            const packagedTickets = rawEvents[index].packagedTickets || [];
            packagedTickets.forEach(pkg => {
                const packageTicket = {
                    id: pkg._id,
                    eventId: event.id,
                    name: pkg.name,
                    price: pkg.price,
                    currency: 'AUD',
                    capacity: pkg.quantity,
                    sold: pkg.sold || 0,
                    available: pkg.quantity - (pkg.sold || 0),
                    type: 'package',
                    isPackage: true,
                    packageContents: pkg.tickets || [],
                    disabled: pkg.disabled || false,
                    deleted: pkg.deleted || false
                };
                allTickets.push(packageTicket);
            });
            
            // Get orders
            const orders = await getEventOrders(event.id);
            allOrders.push(...orders);
            
            const packageCount = packagedTickets.length;
            console.log(`   - Found ${tickets.length} ticket types, ${packageCount} packages, and ${orders.length} orders`);
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log(`\n✅ Analysis complete!`);
        console.log(`   - ${events.length} events analyzed`);
        console.log(`   - ${allTickets.length} ticket types processed`);
        console.log(`   - ${allOrders.length} orders found`);
        
        // Generate analysis
        const analysis = generateAnalysisReport(events, allTickets, allOrders);
        
        // Generate markdown report
        const markdownReport = generateMarkdownReport(analysis);
        
        // Save results
        const outputDir = '/root/agents/docs';
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const reportPath = path.join(outputDir, 'humanitix-events-analysis.md');
        const jsonPath = path.join(outputDir, 'humanitix-events-data.json');
        
        fs.writeFileSync(reportPath, markdownReport);
        fs.writeFileSync(jsonPath, JSON.stringify(analysis, null, 2));
        
        console.log(`\n📄 Reports saved:`);
        console.log(`   - Markdown: ${reportPath}`);
        console.log(`   - JSON: ${jsonPath}`);
        
        // Display summary
        console.log(`\n📊 Quick Summary:`);
        console.log(`   - Total Events: ${analysis.summary.totalEvents}`);
        console.log(`   - Total Ticket Types: ${analysis.summary.totalTicketTypes}`);
        console.log(`   - Average Ticket Price: $${analysis.pricingAnalysis.averagePrice.toFixed(2)}`);
        console.log(`   - Most Popular Venue: ${Object.entries(analysis.venueAnalysis.venues)[0]?.[0] || 'Unknown'}`);
        
    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        process.exit(1);
    }
}

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
    runAnalysis();
}

export { runAnalysis };