#!/usr/bin/env node

// Test different Humanitix API endpoints and parameters
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
}

loadEnv();

async function testHumanitixAPI() {
  // Get the API key from environment
  const apiKey = process.env.HUMANITIX_API_KEY || process.env.VITE_HUMANITIX_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No Humanitix API key found in environment variables');
    console.log('Please set HUMANITIX_API_KEY or VITE_HUMANITIX_API_KEY');
    process.exit(1);
  }

  console.log('🔍 Testing Humanitix API with key:', apiKey.substring(0, 10) + '...');

  const baseURL = 'https://api.humanitix.com/v1';
  const headers = {
    'X-API-Key': apiKey,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  const endpoints = [
    {
      name: 'Events (default)',
      path: '/events',
      params: {}
    },
    {
      name: 'Events (with page)',
      path: '/events',
      params: { page: 1 }
    },
    {
      name: 'Events (published only)',
      path: '/events',
      params: { status: 'published' }
    },
    {
      name: 'Events (all statuses)',
      path: '/events',
      params: { status: 'all' }
    },
    {
      name: 'Events (with limit)',
      path: '/events',
      params: { limit: 10, page: 1 }
    },
    {
      name: 'Events (date range - last 6 months)',
      path: '/events',
      params: { 
        startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      }
    },
    {
      name: 'Account info',
      path: '/account',
      params: {}
    },
    {
      name: 'Organizations',
      path: '/organizations',
      params: {}
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint.name}`);
    console.log(`   URL: ${baseURL}${endpoint.path}`);
    console.log('   Params:', JSON.stringify(endpoint.params, null, 2));

    try {
      const url = new URL(baseURL + endpoint.path);
      Object.keys(endpoint.params).forEach(key => 
        url.searchParams.append(key, endpoint.params[key])
      );

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: headers
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.log('   Response (text):', responseText.substring(0, 200));
        continue;
      }

      if (response.ok) {
        console.log('   ✅ Success!');
        
        // Handle different response structures
        if (Array.isArray(data)) {
          console.log(`   Found ${data.length} items`);
          if (data.length > 0) {
            console.log('   First item:', JSON.stringify(data[0], null, 2).substring(0, 200) + '...');
          }
        } else if (data.data && Array.isArray(data.data)) {
          console.log(`   Found ${data.data.length} items in data array`);
          if (data.data.length > 0) {
            console.log('   First item:', JSON.stringify(data.data[0], null, 2).substring(0, 200) + '...');
          }
        } else if (data.events && Array.isArray(data.events)) {
          console.log(`   Found ${data.events.length} events`);
          if (data.events.length > 0) {
            console.log('   First event:', JSON.stringify(data.events[0], null, 2).substring(0, 200) + '...');
          }
        } else {
          console.log('   Response structure:', Object.keys(data));
          console.log('   Data preview:', JSON.stringify(data, null, 2).substring(0, 300) + '...');
        }
      } else {
        console.log('   ❌ Error response:');
        console.log('   ', JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
  }

  console.log('\n\n🔧 Debugging suggestions:');
  console.log('1. Check if the API key is valid and has the correct permissions');
  console.log('2. Try accessing the Humanitix dashboard to verify events exist');
  console.log('3. Check if events might be under a specific organization');
  console.log('4. Review API documentation for required headers or parameters');
}

// Run the test
testHumanitixAPI().catch(console.error);