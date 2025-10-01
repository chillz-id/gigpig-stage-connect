#!/usr/bin/env node

import https from 'https';
import dotenv from 'dotenv';
dotenv.config({ path: '/root/agents/.env' });


const HUMANITIX_API_KEY = process.env.HUMANITIX_API_KEY || 'process.env.HUMANITIX_API_KEY';

const headers = {
    'x-api-key': HUMANITIX_API_KEY,
    'Accept': 'application/json',
    'User-Agent': 'Stand-Up-Sydney-Test/1.0'
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

async function getSampleOrder() {
    try {
        // Get events first
        const eventsResponse = await makeRequest('https://api.humanitix.com/v1/events?page=1');
        console.log(`Found ${eventsResponse.total} events`);
        
        // Try to get orders from Jenny Tian event (most likely to have orders)
        const jennyEvent = eventsResponse.events.find(e => e.name.includes('Jenny Tian'));
        if (jennyEvent) {
            console.log(`\nTrying to get orders from: ${jennyEvent.name}`);
            const ordersResponse = await makeRequest(`https://api.humanitix.com/v1/events/${jennyEvent._id}/orders?page=1`);
            console.log('Orders response:', JSON.stringify(ordersResponse, null, 2));
        }
        
        // Try one more event
        const firstEvent = eventsResponse.events[0];
        console.log(`\nTrying to get orders from: ${firstEvent.name}`);
        const ordersResponse = await makeRequest(`https://api.humanitix.com/v1/events/${firstEvent._id}/orders?page=1`);
        console.log('Orders response:', JSON.stringify(ordersResponse, null, 2));
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

getSampleOrder();