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
        console.log(`Making request to: ${url}`);
        console.log(`Headers:`, headers);
        
        const request = https.get(url, { headers }, (response) => {
            let data = '';
            
            console.log(`Status Code: ${response.statusCode}`);
            console.log(`Headers:`, response.headers);
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                console.log(`Raw response: ${data}`);
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (error) {
                    console.error('JSON Parse Error:', error.message);
                    resolve({ raw: data });
                }
            });
        });
        
        request.on('error', (error) => {
            console.error('Request Error:', error.message);
            reject(error);
        });
        
        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function testAPI() {
    try {
        console.log('Testing Humanitix API...\n');
        
        // Test events endpoint
        const eventsResponse = await makeRequest('https://api.humanitix.com/v1/events?page=1');
        console.log('\nEvents Response:', JSON.stringify(eventsResponse, null, 2));
        
        // If we have events, test tickets endpoint
        if (eventsResponse.events && eventsResponse.events.length > 0) {
            const firstEventId = eventsResponse.events[0]._id;
            console.log(`\nTesting tickets endpoint with event ID: ${firstEventId}`);
            
            const ticketsResponse = await makeRequest(`https://api.humanitix.com/v1/events/${firstEventId}/tickets`);
            console.log('\nTickets Response:', JSON.stringify(ticketsResponse, null, 2));
        }
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testAPI();