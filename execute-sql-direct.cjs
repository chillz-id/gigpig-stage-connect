#!/usr/bin/env node

/**
 * Direct SQL Execution using PostgREST
 * Attempts to execute DDL via different endpoints
 */

const https = require('https');
const http = require('http');
require('dotenv').config();

async function executeSQLDirect() {
  const sql = `ALTER TABLE events ADD COLUMN IF NOT EXISTS doors_time TIME;`;
  
  console.log('🔧 Attempting direct SQL execution...');
  console.log('SQL:', sql);
  
  // Try different approaches
  
  // Approach 1: PostgREST admin endpoint (if available)
  try {
    const url = new URL('/admin/sql', process.env.SUPABASE_URL);
    
    const postData = JSON.stringify({
      query: sql
    });
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
      }
    };
    
    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
    
    console.log('Admin endpoint response:', response.status, response.data);
    
  } catch (error) {
    console.log('Admin endpoint failed:', error.message);
  }
  
  // Approach 2: Try EdgeFunction approach
  try {
    const url = new URL('/functions/v1/execute-sql', process.env.SUPABASE_URL);
    
    console.log('Trying edge function endpoint...');
    // This would require an edge function to be deployed
    
  } catch (error) {
    console.log('Edge function approach not available');
  }
  
  console.log('\n📋 CONCLUSION:');
  console.log('DDL operations require manual execution via Supabase SQL Editor.');
  console.log('The column needs to be added manually using:');
  console.log('\n```sql');
  console.log('ALTER TABLE events ADD COLUMN doors_time TIME;');
  console.log('COMMENT ON COLUMN events.doors_time IS \'Optional time when doors open\';');
  console.log('CREATE INDEX idx_events_doors_time ON events(doors_time) WHERE doors_time IS NOT NULL;');
  console.log('```');
}

executeSQLDirect().catch(console.error);