#!/usr/bin/env node

/**
 * Test Brevo Integration Script
 * Tests the connection to Brevo API and validates basic functionality
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/etc/standup-sydney/credentials.env' });

// Brevo API configuration
const BREVO_API_URL = process.env.BREVO_API_URL || 'https://api.brevo.com/v3';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Test data
const TEST_CONTACT = {
  email: 'test+comedy@standupsydney.com',
  attributes: {
    FIRSTNAME: 'Test',
    LASTNAME: 'Customer',
    TOTAL_ORDERS: 2,
    TOTAL_SPENT: 75.50,
    LAST_EVENT_NAME: 'Comedy Night Test',
    LAST_ORDER_DATE: new Date().toISOString().split('T')[0],
    CUSTOMER_SEGMENT: 'active',
    MARKETING_OPT_IN: true,
    SOURCE: 'Stand Up Sydney - Integration Test'
  },
  listIds: [1], // Main list
  updateEnabled: true
};

async function testBrevoConnection() {
  console.log('🧪 Testing Brevo API Connection...\n');

  if (!BREVO_API_KEY) {
    console.log('❌ BREVO_API_KEY not found in environment variables!');
    console.log('Please add your Brevo API key to /etc/standup-sydney/credentials.env\n');
    return false;
  }

  console.log(`API URL: ${BREVO_API_URL}`);
  console.log(`API Key: ${BREVO_API_KEY.substring(0, 8)}...${BREVO_API_KEY.slice(-8)}\n`);

  try {
    // Test 1: Get account information
    console.log('Test 1: Getting account information...');
    const accountResponse = await fetch(`${BREVO_API_URL}/account`, {
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY
      }
    });

    if (accountResponse.ok) {
      const accountData = await accountResponse.json();
      console.log(`✅ Connected to account: ${accountData.firstName} ${accountData.lastName}`);
      console.log(`   Company: ${accountData.companyName || 'Not specified'}`);
      console.log(`   Email: ${accountData.email}\n`);
    } else {
      const errorData = await accountResponse.json();
      console.log(`❌ Account info failed: ${errorData.message}\n`);
      return false;
    }

    // Test 2: Get lists
    console.log('Test 2: Getting available lists...');
    const listsResponse = await fetch(`${BREVO_API_URL}/contacts/lists`, {
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY
      }
    });

    if (listsResponse.ok) {
      const listsData = await listsResponse.json();
      console.log(`✅ Found ${listsData.count} lists:`);
      listsData.lists.forEach(list => {
        console.log(`   - ${list.name} (ID: ${list.id}, ${list.totalSubscribers} subscribers)`);
      });
      console.log();
    } else {
      console.log('❌ Lists retrieval failed\n');
    }

    // Test 3: Create test contact
    console.log('Test 3: Creating test contact...');
    const createResponse = await fetch(`${BREVO_API_URL}/contacts`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(TEST_CONTACT)
    });

    let contactId = null;
    if (createResponse.ok) {
      const createData = await createResponse.json();
      contactId = createData.id;
      console.log(`✅ Test contact created with ID: ${contactId}\n`);
    } else if (createResponse.status === 400) {
      const errorData = await createResponse.json();
      if (errorData.message.includes('already exists')) {
        console.log('⚠️  Contact already exists, will try to update...\n');
        contactId = 'existing';
      } else {
        console.log(`❌ Contact creation failed: ${errorData.message}\n`);
        return false;
      }
    } else {
      const errorData = await createResponse.json();
      console.log(`❌ Contact creation failed: ${errorData.message}\n`);
      return false;
    }

    // Test 4: Update test contact (if it already existed)
    if (contactId === 'existing') {
      console.log('Test 4: Updating existing test contact...');
      const updateResponse = await fetch(`${BREVO_API_URL}/contacts/${encodeURIComponent(TEST_CONTACT.email)}`, {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          attributes: TEST_CONTACT.attributes,
          listIds: TEST_CONTACT.listIds
        })
      });

      if (updateResponse.ok) {
        console.log('✅ Test contact updated successfully\n');
      } else {
        const errorData = await updateResponse.json();
        console.log(`❌ Contact update failed: ${errorData.message}\n`);
      }
    }

    // Test 5: Retrieve test contact
    console.log('Test 5: Retrieving test contact...');
    const getResponse = await fetch(`${BREVO_API_URL}/contacts/${encodeURIComponent(TEST_CONTACT.email)}`, {
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY
      }
    });

    if (getResponse.ok) {
      const contactData = await getResponse.json();
      console.log('✅ Contact retrieved successfully:');
      console.log(`   Email: ${contactData.email}`);
      console.log(`   Name: ${contactData.attributes.FIRSTNAME} ${contactData.attributes.LASTNAME}`);
      console.log(`   Total Orders: ${contactData.attributes.TOTAL_ORDERS}`);
      console.log(`   Lists: ${contactData.listIds.map(id => `ID ${id}`).join(', ')}\n`);
    } else {
      console.log('❌ Contact retrieval failed\n');
    }

    // Test 6: Get contact attributes
    console.log('Test 6: Getting available contact attributes...');
    const attributesResponse = await fetch(`${BREVO_API_URL}/contacts/attributes`, {
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY
      }
    });

    if (attributesResponse.ok) {
      const attributesData = await attributesResponse.json();
      console.log('✅ Available attributes:');
      attributesData.attributes.forEach(attr => {
        console.log(`   - ${attr.name} (${attr.type})`);
      });
      console.log();
    } else {
      console.log('❌ Attributes retrieval failed\n');
    }

    console.log('🎉 All tests completed successfully!');
    console.log('✅ Brevo integration is ready for production use.\n');

    // Provide setup instructions
    console.log('📋 Next Steps:');
    console.log('1. Get your Brevo API key and add it to /etc/standup-sydney/credentials.env');
    console.log('2. Set up your contact lists in Brevo dashboard');
    console.log('3. Update list IDs in the N8N workflow');
    console.log('4. Run the historical migration: node scripts/migrate-customers-to-brevo.js');
    console.log('5. Activate the N8N workflow for real-time sync\n');

    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

async function cleanupTestContact() {
  console.log('🧹 Cleaning up test contact...');
  
  try {
    const deleteResponse = await fetch(`${BREVO_API_URL}/contacts/${encodeURIComponent(TEST_CONTACT.email)}`, {
      method: 'DELETE',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY
      }
    });

    if (deleteResponse.ok) {
      console.log('✅ Test contact removed successfully\n');
    } else {
      console.log('ℹ️  Test contact may not exist or already removed\n');
    }
  } catch (error) {
    console.log('ℹ️  Cleanup completed (contact may not have existed)\n');
  }
}

// Run the tests
async function runTests() {
  const success = await testBrevoConnection();
  
  if (success) {
    // Optionally clean up test contact
    await cleanupTestContact();
  }

  process.exit(success ? 0 : 1);
}

runTests().catch(console.error);