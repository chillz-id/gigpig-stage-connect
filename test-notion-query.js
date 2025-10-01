#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// Load environment variables manually
const envContent = fs.readFileSync('/root/agents/.env', 'utf8');
const envLines = envContent.split('\n');
for (const line of envLines) {
    if (line.includes('=') && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        process.env[key.trim()] = value.trim();
    }
}

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = '1374745b-8cbe-804b-87a2-ec93b3385e01';

console.log('🔍 TESTING NOTION DATABASE ACCESS');
console.log('=================================');
console.log(`📊 Database ID: ${NOTION_DATABASE_ID}`);
console.log(`🔑 Using Notion Token: ${NOTION_TOKEN.substring(0, 10)}...`);

function makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            method: method,
            headers: {
                'Authorization': `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(body);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function testQuery() {
    try {
        console.log('\n🔍 Querying first 5 entries...');

        const url = `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`;
        const body = { page_size: 5 };

        const response = await makeRequest(url, 'POST', body);

        if (response.status >= 200 && response.status < 300) {
            console.log(`✅ Success! Status: ${response.status}`);
            console.log(`📊 Found ${response.data.results.length} entries in first batch`);
            console.log(`🔄 Has more pages: ${response.data.has_more}`);

            // Show sample entries
            if (response.data.results.length > 0) {
                console.log('\n📋 SAMPLE ENTRIES:');
                for (let i = 0; i < Math.min(3, response.data.results.length); i++) {
                    const page = response.data.results[i];
                    const pageTitle = page.properties?.Name?.title?.[0]?.text?.content ||
                                     page.properties?.['Event Name']?.title?.[0]?.text?.content ||
                                     'Unknown';
                    const eventName = page.properties?.['Event Name']?.rich_text?.[0]?.text?.content || 'Unknown Event';
                    const platform = page.properties?.Platform?.select?.name ||
                                   page.properties?.['Ticketing Partner']?.select?.name || 'Unknown';

                    console.log(`   ${i + 1}. "${pageTitle}" - ${eventName} (${platform})`);
                }
            } else {
                console.log('📭 Database is empty!');
            }
        } else {
            console.error(`❌ Failed! Status: ${response.status}`);
            console.error('Response:', response.data);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testQuery();