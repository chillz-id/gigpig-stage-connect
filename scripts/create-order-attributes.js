#!/usr/bin/env node

/**
 * Create Order Tracking Attributes
 * Creates regular (non-transactional) attributes for order tracking
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/etc/standup-sydney/credentials.env' });

const BREVO_API_URL = process.env.BREVO_API_URL || 'https://api.brevo.com/v3';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Regular attributes for order tracking
const ORDER_ATTRIBUTES = [
  {
    name: 'ORDER_COUNT',
    type: 'float',
    category: 'normal'
  },
  {
    name: 'LIFETIME_VALUE',
    type: 'float', 
    category: 'normal'
  }
];

async function createOrderAttributes() {
  console.log('🛍️  Creating order tracking attributes...\n');

  try {
    for (const attr of ORDER_ATTRIBUTES) {
      console.log(`Creating ${attr.name}...`);
      
      const response = await fetch(`${BREVO_API_URL}/contacts/attributes/${attr.category}/${attr.name}`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          type: attr.type
        })
      });

      if (response.status === 201) {
        console.log(`✅ ${attr.name} created`);
      } else if (response.status === 409) {
        console.log(`ℹ️  ${attr.name} already exists`);
      } else {
        const error = await response.json();
        console.log(`❌ ${attr.name} failed: ${error.message}`);
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n✅ Order tracking attributes ready!');
    console.log('\n📋 Available for use:');
    console.log('   - ORDER_COUNT: Number of orders placed');
    console.log('   - LIFETIME_VALUE: Total amount spent');

  } catch (error) {
    console.error('❌ Failed to create attributes:', error.message);
  }
}

createOrderAttributes().catch(console.error);