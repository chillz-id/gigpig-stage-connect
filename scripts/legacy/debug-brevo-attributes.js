#!/usr/bin/env node

/**
 * Debug Brevo Attributes
 * Check what attributes exist and their categories
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/etc/standup-sydney/credentials.env' });

const BREVO_API_URL = process.env.BREVO_API_URL || 'https://api.brevo.com/v3';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

async function debugAttributes() {
  console.log('🔍 Debugging Brevo Attributes...\n');

  try {
    // Get all attributes
    const response = await fetch(`${BREVO_API_URL}/contacts/attributes`, {
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY
      }
    });

    if (!response.ok) {
      console.error('Failed to get attributes');
      return;
    }

    const data = await response.json();
    
    console.log(`Total attributes: ${data.attributes.length}\n`);

    // Group by category
    const byCategory = {};
    for (const attr of data.attributes) {
      if (!byCategory[attr.category]) {
        byCategory[attr.category] = [];
      }
      byCategory[attr.category].push(attr);
    }

    // Show transactional attributes
    if (byCategory.transactional) {
      console.log('📊 TRANSACTIONAL Attributes:');
      byCategory.transactional.forEach(attr => {
        console.log(`   - ${attr.name} (${attr.type})`);
      });
      console.log();
    }

    // Show our custom attributes
    const ourAttributes = [
      'TOTAL_ORDERS', 'TOTAL_SPENT', 'LAST_EVENT_NAME', 
      'CUSTOMER_SEGMENT', 'MARKETING_OPT_IN', 'SOURCE'
    ];

    console.log('🎯 Our Custom Attributes:');
    for (const attr of data.attributes) {
      if (ourAttributes.includes(attr.name)) {
        console.log(`   ✅ ${attr.name} (${attr.type}, category: ${attr.category})`);
      }
    }

    // Try creating a simple contact without transactional fields
    console.log('\n🧪 Testing simple contact creation...');
    
    const simpleContact = {
      email: 'simple-test@example.com',
      attributes: {
        FIRSTNAME: 'Simple',
        LASTNAME: 'Test'
      },
      listIds: [3],
      updateEnabled: true
    };

    const testResponse = await fetch(`${BREVO_API_URL}/contacts`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(simpleContact)
    });

    if (testResponse.ok) {
      console.log('✅ Simple contact creation works');
      
      // Clean up
      await fetch(`${BREVO_API_URL}/contacts/simple-test@example.com`, {
        method: 'DELETE',
        headers: { 'api-key': BREVO_API_KEY }
      });
    } else {
      const errorData = await testResponse.json();
      console.log(`❌ Simple contact failed: ${errorData.message}`);
    }

  } catch (error) {
    console.error('Debug failed:', error.message);
  }
}

debugAttributes().catch(console.error);