#!/usr/bin/env node

/**
 * Create Enhanced Brevo Attributes
 * Adds Date of Birth, Address, Company attributes to Brevo
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/etc/standup-sydney/credentials.env' });

const BREVO_API_URL = process.env.BREVO_API_URL || 'https://api.brevo.com/v3';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Enhanced attributes to create
const ENHANCED_ATTRIBUTES = [
  {
    name: 'DATE_OF_BIRTH',
    type: 'date',
    category: 'normal'
  },
  {
    name: 'ADDRESS',
    type: 'text',
    category: 'normal'
  },
  {
    name: 'COMPANY',
    type: 'text',
    category: 'normal'
  }
];

async function createBrevoEnhancedAttributes() {
  console.log('🌟 Creating enhanced Brevo attributes...\n');

  if (!BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY not found in environment variables!');
    return;
  }

  try {
    for (const attr of ENHANCED_ATTRIBUTES) {
      console.log(`🔄 Creating ${attr.name} (${attr.type})...`);
      
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
        console.log(`  ✅ ${attr.name} created successfully`);
      } else if (response.status === 409) {
        console.log(`  ℹ️  ${attr.name} already exists`);
      } else {
        const error = await response.json();
        console.log(`  ❌ ${attr.name} failed: ${error.message}`);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n✅ Enhanced attributes setup complete!');
    
    console.log('\n📋 Available customer attributes in Brevo:');
    console.log('   📧 Basic Info: FIRSTNAME, LASTNAME, SMS');
    console.log('   🎂 Personal: DATE_OF_BIRTH');
    console.log('   🏠 Contact: ADDRESS');
    console.log('   🏢 Business: COMPANY');
    console.log('   💰 Purchase: ORDER_COUNT, LIFETIME_VALUE');
    console.log('   🎭 Events: LAST_EVENT_NAME, LAST_ORDER_DATE');
    console.log('   🎯 Marketing: CUSTOMER_SEGMENT, MARKETING_OPT_IN');
    console.log('   📍 Tracking: PREFERRED_VENUE, SOURCE, CUSTOMER_SINCE');

    console.log('\n🎉 Your Brevo CRM is now ready for enhanced customer profiling!');

  } catch (error) {
    console.error('❌ Failed to create enhanced attributes:', error.message);
  }
}

createBrevoEnhancedAttributes().catch(console.error);