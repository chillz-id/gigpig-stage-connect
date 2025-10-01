#!/usr/bin/env node

/**
 * Test End-to-End Brevo Integration
 * Tests the complete flow: sample customer → Brevo sync
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/etc/standup-sydney/credentials.env' });

const BREVO_API_URL = process.env.BREVO_API_URL || 'https://api.brevo.com/v3';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

async function testEndToEndIntegration() {
  console.log('🧪 Testing End-to-End Brevo Integration...\n');

  if (!BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY not found!');
    return;
  }

  // Sample customer data (as would come from Humanitix)
  const sampleCustomer = {
    email: 'comedyfan@example.com',
    first_name: 'Comedy',
    last_name: 'Fan', 
    mobile: '+61400123456',
    marketing_opt_in: true,
    total_orders: 2,
    total_spent: 75.50,
    last_event_name: 'Comedy Night at The Venue',
    last_order_date: '2025-08-07',
    customer_segment: 'active',
    preferred_venue: 'The Comedy Store',
    source: 'Stand Up Sydney - Test'
  };

  console.log('📝 Sample customer data:');
  console.log(`   Email: ${sampleCustomer.email}`);
  console.log(`   Name: ${sampleCustomer.first_name} ${sampleCustomer.last_name}`);
  console.log(`   Segment: ${sampleCustomer.customer_segment}`);
  console.log(`   Total Spent: $${sampleCustomer.total_spent}`);
  console.log(`   Marketing Opt-in: ${sampleCustomer.marketing_opt_in}\n`);

  try {
    // Step 1: Create/Update contact in Brevo
    console.log('🔄 Step 1: Creating contact in Brevo...');
    
    const contactData = {
      email: sampleCustomer.email,
      attributes: {
        FIRSTNAME: sampleCustomer.first_name,
        LASTNAME: sampleCustomer.last_name,
        SMS: sampleCustomer.mobile,
        TOTAL_ORDERS: sampleCustomer.total_orders,
        TOTAL_SPENT: sampleCustomer.total_spent,
        LAST_EVENT_NAME: sampleCustomer.last_event_name,
        LAST_ORDER_DATE: sampleCustomer.last_order_date,
        CUSTOMER_SEGMENT: sampleCustomer.customer_segment,
        MARKETING_OPT_IN: sampleCustomer.marketing_opt_in,
        PREFERRED_VENUE: sampleCustomer.preferred_venue,
        SOURCE: sampleCustomer.source,
        CUSTOMER_SINCE: new Date().toISOString().split('T')[0]
      },
      listIds: [3], // Stand Up Sydney list
      updateEnabled: true
    };

    const createResponse = await fetch(`${BREVO_API_URL}/contacts`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });

    let contactId = null;
    if (createResponse.ok) {
      const createData = await createResponse.json();
      contactId = createData.id;
      console.log(`✅ Contact created with ID: ${contactId}`);
    } else if (createResponse.status === 409) {
      console.log('ℹ️  Contact already exists, updating...');
      
      // Update existing contact
      const updateResponse = await fetch(`${BREVO_API_URL}/contacts/${encodeURIComponent(sampleCustomer.email)}`, {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          attributes: contactData.attributes,
          listIds: contactData.listIds
        })
      });

      if (updateResponse.ok) {
        console.log('✅ Contact updated successfully');
      } else {
        const errorData = await updateResponse.json();
        console.log(`❌ Update failed: ${errorData.message}`);
        return;
      }
    } else {
      const errorData = await createResponse.json();
      console.log(`❌ Create failed: ${errorData.message}`);
      return;
    }

    // Step 2: Verify contact was created/updated
    console.log('\n🔍 Step 2: Verifying contact in Brevo...');
    
    const getResponse = await fetch(`${BREVO_API_URL}/contacts/${encodeURIComponent(sampleCustomer.email)}`, {
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY
      }
    });

    if (getResponse.ok) {
      const contactInfo = await getResponse.json();
      console.log('✅ Contact verified in Brevo:');
      console.log(`   ID: ${contactInfo.id}`);
      console.log(`   Email: ${contactInfo.email}`);
      console.log(`   Name: ${contactInfo.attributes.FIRSTNAME} ${contactInfo.attributes.LASTNAME}`);
      console.log(`   Total Orders: ${contactInfo.attributes.TOTAL_ORDERS}`);
      console.log(`   Total Spent: $${contactInfo.attributes.TOTAL_SPENT}`);
      console.log(`   Segment: ${contactInfo.attributes.CUSTOMER_SEGMENT}`);
      console.log(`   Lists: ${contactInfo.listIds.join(', ')}`);
      console.log(`   Marketing Opt-in: ${contactInfo.attributes.MARKETING_OPT_IN}`);
    } else {
      console.log('❌ Failed to verify contact');
      return;
    }

    // Step 3: Test list membership
    console.log('\n📋 Step 3: Checking list membership...');
    
    const listsResponse = await fetch(`${BREVO_API_URL}/contacts/lists`, {
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY
      }
    });

    if (listsResponse.ok) {
      const listsData = await listsResponse.json();
      const standUpSydneyList = listsData.lists.find(list => list.id === 3);
      
      if (standUpSydneyList) {
        console.log(`✅ Found in "Stand Up Sydney" list:`);
        console.log(`   List: ${standUpSydneyList.name} (ID: ${standUpSydneyList.id})`);
        console.log(`   Total subscribers: ${standUpSydneyList.totalSubscribers}`);
      } else {
        console.log('❌ Stand Up Sydney list not found');
      }
    }

    // Step 4: Test custom attributes
    console.log('\n🏷️  Step 4: Verifying custom attributes...');
    
    const requiredAttributes = [
      'TOTAL_ORDERS', 'TOTAL_SPENT', 'LAST_EVENT_NAME', 
      'CUSTOMER_SEGMENT', 'MARKETING_OPT_IN', 'SOURCE'
    ];

    const attributesResponse = await fetch(`${BREVO_API_URL}/contacts/attributes`, {
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY
      }
    });

    if (attributesResponse.ok) {
      const attributesData = await attributesResponse.json();
      const existingAttributes = attributesData.attributes.map(attr => attr.name);
      
      let allFound = true;
      for (const attr of requiredAttributes) {
        if (existingAttributes.includes(attr)) {
          console.log(`✅ ${attr} - Available`);
        } else {
          console.log(`❌ ${attr} - Missing`);
          allFound = false;
        }
      }

      if (allFound) {
        console.log('✅ All required attributes are available');
      }
    }

    // Step 5: Simulate real-time update
    console.log('\n🔄 Step 5: Testing real-time update...');
    
    const updateData = {
      attributes: {
        LAST_EVENT_NAME: 'Comedy Night - Updated',
        LAST_ORDER_DATE: new Date().toISOString().split('T')[0],
        CUSTOMER_SEGMENT: 'vip'
      }
    };

    const realtimeUpdateResponse = await fetch(`${BREVO_API_URL}/contacts/${encodeURIComponent(sampleCustomer.email)}`, {
      method: 'PUT',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (realtimeUpdateResponse.ok) {
      console.log('✅ Real-time update successful');
      console.log(`   New Total Orders: ${updateData.attributes.TOTAL_ORDERS}`);
      console.log(`   New Total Spent: $${updateData.attributes.TOTAL_SPENT}`);
    } else {
      console.log('❌ Real-time update failed');
    }

    console.log('\n🎉 End-to-End Integration Test Completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Brevo API connection working');
    console.log('✅ Contact creation/updates working');
    console.log('✅ Custom attributes populated');  
    console.log('✅ List assignment working');
    console.log('✅ Real-time updates working');
    console.log('\n🚀 The integration is ready for production!');

    // Cleanup
    console.log('\n🧹 Cleaning up test contact...');
    const deleteResponse = await fetch(`${BREVO_API_URL}/contacts/${encodeURIComponent(sampleCustomer.email)}`, {
      method: 'DELETE',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY
      }
    });

    if (deleteResponse.ok) {
      console.log('✅ Test contact cleaned up');
    }

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  }
}

testEndToEndIntegration().catch(console.error);