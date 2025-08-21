#!/usr/bin/env node

/**
 * Check ticket_sales data structure and content
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

async function checkTicketSalesData() {
  console.log('🔍 Checking ticket_sales data...\n');

  try {
    // Get all ticket sales data
    const { data: ticketSales, error } = await supabase
      .from('ticket_sales')
      .select('*');

    if (error) {
      console.error('❌ Error fetching ticket sales:', error);
      return;
    }

    if (!ticketSales || ticketSales.length === 0) {
      console.log('ℹ️  No ticket sales data found');
      return;
    }

    console.log(`📊 Found ${ticketSales.length} ticket sales records\n`);

    // Show the structure of the first record
    console.log('📋 Sample record structure:');
    const sampleRecord = ticketSales[0];
    Object.entries(sampleRecord).forEach(([key, value]) => {
      const type = typeof value;
      const preview = value ? String(value).substring(0, 50) : 'null';
      console.log(`  ${key}: ${type} = "${preview}"`);
    });

    console.log('\n📊 All records:');
    ticketSales.forEach((record, index) => {
      console.log(`\n${index + 1}. Record ID: ${record.id}`);
      console.log(`   Customer: ${record.customer_name} (${record.customer_email})`);
      console.log(`   Event ID: ${record.event_id}`);
      console.log(`   Quantity: ${record.ticket_quantity}`);
      console.log(`   Amount: $${record.ticket_price}`);
      console.log(`   Date: ${record.created_at}`);
    });

    // Check for customer data we can extract
    const uniqueCustomers = new Set(ticketSales.map(sale => sale.customer_email).filter(Boolean));
    console.log(`\n👥 Unique customers: ${uniqueCustomers.size}`);
    console.log(`📧 Customer emails: ${Array.from(uniqueCustomers).join(', ')}`);

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

// Run the check
checkTicketSalesData().catch(console.error);