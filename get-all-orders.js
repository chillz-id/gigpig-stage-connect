#!/usr/bin/env node

/**
 * Get all orders from all events for financial analysis
 */

import fs from 'fs';
import https from 'https';

const HUMANITIX_API_KEY = process.env.HUMANITIX_API_KEY || '9f23a99810087538c62feb645c45d195ab966d38533cd6456a4c7092f6ae679fd4515936e5b9869c261dc83721626a46c7328dd22bf6acd567646897ecf4c8c7b4f8b24a1b0dbab2fd952a8c25dd7a3b3f5542f0121c63e6616322eb128741bfbd9322b94c5a46acbe3cc9add71ec2';

const headers = {
    'x-api-key': HUMANITIX_API_KEY,
    'Accept': 'application/json',
    'User-Agent': 'Stand-Up-Sydney-Financial-Analysis/1.0'
};

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, { headers }, (response) => {
            let data = '';
            response.on('data', (chunk) => { data += chunk; });
            response.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    resolve({ raw: data, error: error.message });
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

async function getAllOrders() {
    try {
        // Load events data
        const eventsData = JSON.parse(fs.readFileSync('./docs/humanitix-events-data.json', 'utf8'));
        console.log(`🎯 Getting orders from ${eventsData.events.length} events...`);
        
        const allOrders = [];
        let totalOrdersFound = 0;
        
        // Process each event
        for (const [index, event] of eventsData.events.entries()) {
            console.log(`📋 Processing ${index + 1}/${eventsData.events.length}: ${event.name}`);
            
            try {
                const ordersResponse = await makeRequest(`https://api.humanitix.com/v1/events/${event.id}/orders?page=1`);
                
                if (ordersResponse.orders && ordersResponse.orders.length > 0) {
                    const eventOrders = ordersResponse.orders.map(order => ({
                        ...order,
                        eventId: event.id,
                        eventName: event.name,
                        eventDate: event.startDate,
                        venue: event.venue
                    }));
                    
                    allOrders.push(...eventOrders);
                    totalOrdersFound += eventOrders.length;
                    
                    console.log(`   ✅ Found ${eventOrders.length} orders (Total: ${ordersResponse.total})`);
                    
                    // If there are more orders, get additional pages
                    if (ordersResponse.total > 100) {
                        const totalPages = Math.ceil(ordersResponse.total / 100);
                        for (let page = 2; page <= totalPages; page++) {
                            const pageResponse = await makeRequest(`https://api.humanitix.com/v1/events/${event.id}/orders?page=${page}`);
                            if (pageResponse.orders) {
                                const pageOrders = pageResponse.orders.map(order => ({
                                    ...order,
                                    eventId: event.id,
                                    eventName: event.name,
                                    eventDate: event.startDate,
                                    venue: event.venue
                                }));
                                allOrders.push(...pageOrders);
                                totalOrdersFound += pageOrders.length;
                                console.log(`   📄 Page ${page}: ${pageOrders.length} additional orders`);
                            }
                            // Rate limiting
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    }
                } else {
                    console.log(`   ⚪ No orders found`);
                }
            } catch (error) {
                console.error(`   ❌ Error getting orders for ${event.name}:`, error.message);
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`\n🎉 Collection complete!`);
        console.log(`📊 Total orders collected: ${totalOrdersFound}`);
        console.log(`🗂️ Events processed: ${eventsData.events.length}`);
        
        // Save all orders
        const outputPath = './docs/humanitix-all-orders.json';
        const ordersData = {
            generatedAt: new Date().toISOString(),
            totalOrders: totalOrdersFound,
            totalEvents: eventsData.events.length,
            orders: allOrders
        };
        
        fs.writeFileSync(outputPath, JSON.stringify(ordersData, null, 2));
        console.log(`💾 Orders saved to: ${outputPath}`);
        
        return allOrders;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

// Run the collection
getAllOrders().catch(console.error);