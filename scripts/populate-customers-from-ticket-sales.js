#!/usr/bin/env node

/**
 * Populate Customers from Historical Ticket Sales
 * Creates customer records from existing ticket_sales data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/etc/standup-sydney/credentials.env' });

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateCustomerSegment(totalOrders, totalSpent) {
  if (totalSpent > 200 || totalOrders > 5) return 'vip';
  if (totalSpent > 50 || totalOrders > 2) return 'active';
  if (totalOrders === 0) return 'new';
  return 'inactive';
}

async function populateCustomersFromTicketSales() {
  console.log('📊 Populating customers table from ticket sales data...\n');

  try {
    // First, get all ticket sales with customer data
    console.log('🔍 Fetching ticket sales data...');
    const { data: ticketSales, error: fetchError } = await supabase
      .from('ticket_sales')
      .select('*')
      .not('customer_email', 'is', null)
      .order('purchase_date', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching ticket sales:', fetchError);
      return;
    }

    if (!ticketSales || ticketSales.length === 0) {
      console.log('ℹ️  No ticket sales data found');
      return;
    }

    console.log(`📋 Found ${ticketSales.length} ticket sales records\n`);

    // Group by customer email to aggregate data
    const customerMap = new Map();

    ticketSales.forEach(sale => {
      const email = sale.customer_email.toLowerCase().trim();
      
      // Parse customer name (assuming "First Last" format)
      const nameParts = (sale.customer_name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          email: email,
          first_name: firstName,
          last_name: lastName,
          mobile: '', // Not available in current ticket_sales structure
          marketing_opt_in: false, // Default to false, will be updated when webhook captures it
          source: sale.platform || 'ticket_sales',
          total_orders: 0,
          total_spent: 0,
          last_order_date: null,
          last_event_id: null,
          last_event_name: '',
          preferred_venue: '',
          created_at: sale.purchase_date
        });
      }

      const customer = customerMap.get(email);
      
      // Update aggregated data
      customer.total_orders += sale.ticket_quantity || 1;
      customer.total_spent += parseFloat(sale.total_amount || 0);
      
      // Update last order info
      if (!customer.last_order_date || new Date(sale.purchase_date) > new Date(customer.last_order_date)) {
        customer.last_order_date = sale.purchase_date;
        customer.last_event_id = sale.event_id;
        customer.last_event_name = ''; // We'll need to join with events table if needed
      }

      // Keep earliest purchase date as created_at
      if (new Date(sale.purchase_date) < new Date(customer.created_at)) {
        customer.created_at = sale.purchase_date;
      }
    });

    // Convert map to array and add segments
    const customers = Array.from(customerMap.values()).map(customer => ({
      ...customer,
      customer_segment: calculateCustomerSegment(customer.total_orders, customer.total_spent)
    }));

    console.log(`👥 Aggregated into ${customers.length} unique customers\n`);

    // Insert customers in batches
    const BATCH_SIZE = 50;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < customers.length; i += BATCH_SIZE) {
      const batch = customers.slice(i, i + BATCH_SIZE);
      
      console.log(`📦 Inserting batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} customers)...`);

      const { data, error } = await supabase
        .from('customers')
        .upsert(batch, { 
          onConflict: 'email',
          ignoreDuplicates: false 
        })
        .select('id, email');

      if (error) {
        console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error);
        errors += batch.length;
      } else {
        inserted += data.length;
        console.log(`✅ Inserted ${data.length} customers`);
      }

      // Small delay between batches
      await delay(500);
    }

    // Summary
    console.log('\n=== Population Summary ===');
    console.log(`Total Ticket Sales: ${ticketSales.length}`);
    console.log(`Unique Customers: ${customers.length}`);
    console.log(`Successfully Inserted: ${inserted}`);
    console.log(`Errors: ${errors}`);

    // Segment breakdown
    const segmentCounts = customers.reduce((acc, customer) => {
      acc[customer.customer_segment] = (acc[customer.customer_segment] || 0) + 1;
      return acc;
    }, {});

    console.log('\n=== Customer Segments ===');
    Object.entries(segmentCounts).forEach(([segment, count]) => {
      console.log(`${segment.toUpperCase()}: ${count} customers`);
    });

    if (inserted > 0) {
      console.log(`\n🎉 Successfully populated customers table!`);
      console.log(`\n📧 Next step: Run Brevo migration to sync these ${inserted} customers:`);
      console.log(`   node scripts/migrate-customers-to-brevo.js`);
    }

  } catch (error) {
    console.error('❌ Population failed:', error.message);
  }
}

// Run the population
populateCustomersFromTicketSales().catch(console.error);