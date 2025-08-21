#!/usr/bin/env node

/**
 * Setup Required Brevo Custom Attributes
 * Creates missing attributes needed for the Humanitix integration
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/etc/standup-sydney/credentials.env' });

const BREVO_API_URL = process.env.BREVO_API_URL || 'https://api.brevo.com/v3';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Required attributes for our integration
const REQUIRED_ATTRIBUTES = [
  {
    name: 'TOTAL_ORDERS',
    type: 'float',
    category: 'normal'
  },
  {
    name: 'TOTAL_SPENT', 
    type: 'float',
    category: 'normal'
  },
  {
    name: 'LAST_EVENT_NAME',
    type: 'text',
    category: 'normal'
  },
  {
    name: 'LAST_ORDER_DATE',
    type: 'date',
    category: 'normal'
  },
  {
    name: 'CUSTOMER_SEGMENT',
    type: 'text',
    category: 'normal'
  },
  {
    name: 'MARKETING_OPT_IN',
    type: 'boolean', 
    category: 'normal'
  },
  {
    name: 'PREFERRED_VENUE',
    type: 'text',
    category: 'normal'
  },
  {
    name: 'SOURCE',
    type: 'text',
    category: 'normal'
  },
  {
    name: 'CUSTOMER_SINCE',
    type: 'date',
    category: 'normal'
  }
];

async function getExistingAttributes() {
  try {
    const response = await fetch(`${BREVO_API_URL}/contacts/attributes`, {
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.attributes.map(attr => attr.name);
    } else {
      console.error('Failed to get existing attributes');
      return [];
    }
  } catch (error) {
    console.error('Error getting attributes:', error.message);
    return [];
  }
}

async function createAttribute(attribute) {
  try {
    const response = await fetch(`${BREVO_API_URL}/contacts/attributes/${attribute.category}/${attribute.name}`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        type: attribute.type
      })
    });

    if (response.status === 201) {
      return { success: true };
    } else if (response.status === 409) {
      return { success: true, exists: true };
    } else {
      const error = await response.json();
      return { success: false, error: error.message };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function setupAttributes() {
  console.log('🔧 Setting up required Brevo custom attributes...\n');

  if (!BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY not found!');
    return;
  }

  // Get existing attributes
  console.log('📋 Checking existing attributes...');
  const existingAttributes = await getExistingAttributes();
  console.log(`Found ${existingAttributes.length} existing attributes\n`);

  let createdCount = 0;
  let alreadyExistCount = 0;
  let errorCount = 0;

  // Create missing attributes
  for (const attr of REQUIRED_ATTRIBUTES) {
    process.stdout.write(`Creating ${attr.name}... `);
    
    if (existingAttributes.includes(attr.name)) {
      console.log('✅ Already exists');
      alreadyExistCount++;
      continue;
    }

    const result = await createAttribute(attr);
    
    if (result.success) {
      if (result.exists) {
        console.log('✅ Already exists');
        alreadyExistCount++;
      } else {
        console.log('✅ Created');
        createdCount++;
      }
    } else {
      console.log(`❌ Failed: ${result.error}`);
      errorCount++;
    }

    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Summary
  console.log('\n=== Setup Summary ===');
  console.log(`✅ Attributes created: ${createdCount}`);
  console.log(`ℹ️  Already existed: ${alreadyExistCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 All required attributes are now available!');
  }

  // Show mapping for N8N workflow
  console.log('\n📋 Attribute Mapping for N8N:');
  console.log('Use these attribute names in your workflow:');
  REQUIRED_ATTRIBUTES.forEach(attr => {
    console.log(`  ${attr.name}: ${attr.type}`);
  });
}

setupAttributes().catch(console.error);