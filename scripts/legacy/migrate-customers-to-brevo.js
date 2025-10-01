#!/usr/bin/env node

/**
 * Historical Customer Data Migration to Brevo
 * Migrates existing customers from ticket_sales to customers table
 * and prepares them for Brevo CRM synchronization
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '/etc/standup-sydney/credentials.env' });

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Brevo API configuration
const BREVO_API_URL = process.env.BREVO_API_URL || 'https://api.brevo.com/v3';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Batch processing configuration
const BATCH_SIZE = 50;
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds

// List IDs for Brevo (based on your existing lists)
const BREVO_LISTS = {
  STAND_UP_SYDNEY: 3,  // Your main "Stand Up Sydney" list
  VIP_CUSTOMERS: null, // Create if needed
  ACTIVE_CUSTOMERS: null, // Create if needed  
  INACTIVE_CUSTOMERS: null // Create if needed
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createBrevoContact(customer) {
  const contactData = {
    email: customer.email,
    attributes: {
      FIRSTNAME: customer.first_name || '',
      LASTNAME: customer.last_name || '',
      SMS: customer.mobile || '',
      DATE_OF_BIRTH: customer.date_of_birth ? new Date(customer.date_of_birth).toISOString().split('T')[0] : '',
      ADDRESS: customer.address || '',
      COMPANY: customer.company || '',
      ORDER_COUNT: customer.total_orders || 0,
      LIFETIME_VALUE: parseFloat(customer.total_spent || 0),
      LAST_EVENT_NAME: customer.last_event_name || '',
      LAST_ORDER_DATE: customer.last_order_date ? new Date(customer.last_order_date).toISOString().split('T')[0] : '',
      CUSTOMER_SEGMENT: customer.customer_segment || 'new',
      MARKETING_OPT_IN: customer.marketing_opt_in !== false, // Always true unless explicitly false
      PREFERRED_VENUE: customer.preferred_venue || '',
      SOURCE: 'Stand Up Sydney - Historical Import',
      CUSTOMER_SINCE: customer.created_at ? new Date(customer.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    },
    listIds: [BREVO_LISTS.STAND_UP_SYDNEY],
    updateEnabled: true
  };

  // Add to additional lists based on segment (if you create them later)
  switch (customer.customer_segment) {
    case 'vip':
      if (BREVO_LISTS.VIP_CUSTOMERS) contactData.listIds.push(BREVO_LISTS.VIP_CUSTOMERS);
      if (BREVO_LISTS.ACTIVE_CUSTOMERS) contactData.listIds.push(BREVO_LISTS.ACTIVE_CUSTOMERS);
      break;
    case 'active':
      if (BREVO_LISTS.ACTIVE_CUSTOMERS) contactData.listIds.push(BREVO_LISTS.ACTIVE_CUSTOMERS);
      break;
    case 'inactive':
      if (BREVO_LISTS.INACTIVE_CUSTOMERS) contactData.listIds.push(BREVO_LISTS.INACTIVE_CUSTOMERS);
      break;
  }

  try {
    const response = await fetch(`${BREVO_API_URL}/contacts`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true, contactId: result.id };
    } else {
      // Handle specific errors
      if (response.status === 409) {
        // Contact already exists - try to update
        return await updateBrevoContact(customer.email, contactData);
      }
      return { success: false, error: result.message || 'Unknown error' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateBrevoContact(email, contactData) {
  try {
    const response = await fetch(`${BREVO_API_URL}/contacts/${encodeURIComponent(email)}`, {
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

    if (response.ok) {
      return { success: true, updated: true };
    } else {
      const result = await response.json();
      return { success: false, error: result.message || 'Update failed' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateCustomerSyncStatus(customerId, status, brevoContactId = null, error = null) {
  const updateData = {
    brevo_sync_status: status,
    brevo_last_sync: new Date().toISOString()
  };

  if (brevoContactId) {
    updateData.brevo_contact_id = brevoContactId;
  }

  if (error) {
    updateData.brevo_sync_error = error;
  }

  const { error: updateError } = await supabase
    .from('customers')
    .update(updateData)
    .eq('id', customerId);

  if (updateError) {
    console.error(`Failed to update customer ${customerId}:`, updateError);
  }
}

async function logSyncOperation(summary) {
  const { error } = await supabase
    .from('brevo_sync_logs')
    .insert({
      sync_type: 'historical_import',
      request_data: { type: 'batch_import', batch_size: BATCH_SIZE },
      response_data: summary,
      status: summary.failed > 0 ? 'partial' : 'success',
      error_message: summary.errors.length > 0 ? JSON.stringify(summary.errors.slice(0, 10)) : null
    });

  if (error) {
    console.error('Failed to log sync operation:', error);
  }
}

async function migrateCustomers() {
  console.log('Starting customer migration to Brevo...\n');

  if (!BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY not found in environment variables!');
    console.log('Please add your Brevo API key to /etc/standup-sydney/credentials.env');
    process.exit(1);
  }

  // Get total count of customers to sync
  const { count: totalCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .or('brevo_sync_status.is.null,brevo_sync_status.in.(pending,failed)');

  console.log(`Found ${totalCount} customers to sync\n`);

  let processedCount = 0;
  let successCount = 0;
  let failureCount = 0;
  const errors = [];

  // Process customers in batches
  while (processedCount < totalCount) {
    // Fetch batch of customers
    const { data: customers, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .or('brevo_sync_status.is.null,brevo_sync_status.in.(pending,failed)')
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE)
      .range(processedCount, processedCount + BATCH_SIZE - 1);

    if (fetchError) {
      console.error('Error fetching customers:', fetchError);
      break;
    }

    if (!customers || customers.length === 0) {
      break;
    }

    console.log(`Processing batch ${Math.floor(processedCount / BATCH_SIZE) + 1} (${customers.length} customers)...`);

    // Process each customer in the batch
    for (const customer of customers) {
      const result = await createBrevoContact(customer);

      if (result.success) {
        await updateCustomerSyncStatus(customer.id, 'synced', result.contactId);
        successCount++;
        console.log(`✅ Synced: ${customer.email}`);
      } else {
        await updateCustomerSyncStatus(customer.id, 'failed', null, result.error);
        failureCount++;
        errors.push({
          email: customer.email,
          error: result.error
        });
        console.log(`❌ Failed: ${customer.email} - ${result.error}`);
      }

      processedCount++;

      // Small delay between API calls to respect rate limits
      await delay(100);
    }

    // Delay between batches
    if (processedCount < totalCount) {
      console.log(`Waiting ${DELAY_BETWEEN_BATCHES / 1000} seconds before next batch...\n`);
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }

  // Generate summary
  const summary = {
    timestamp: new Date().toISOString(),
    total_processed: processedCount,
    successful: successCount,
    failed: failureCount,
    success_rate: processedCount > 0 ? ((successCount / processedCount) * 100).toFixed(2) + '%' : '0%',
    errors: errors
  };

  // Log the operation
  await logSyncOperation(summary);

  // Save detailed report
  const reportPath = path.join(process.cwd(), `brevo-migration-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));

  // Print summary
  console.log('\n=== Migration Summary ===');
  console.log(`Total Processed: ${summary.total_processed}`);
  console.log(`Successful: ${summary.successful}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Success Rate: ${summary.success_rate}`);
  console.log(`\nDetailed report saved to: ${reportPath}`);

  if (errors.length > 0) {
    console.log('\n=== Sample Errors (first 5) ===');
    errors.slice(0, 5).forEach(err => {
      console.log(`- ${err.email}: ${err.error}`);
    });
  }
}

// Run the migration
migrateCustomers().catch(console.error);