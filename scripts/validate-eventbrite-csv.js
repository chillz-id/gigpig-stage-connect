#!/usr/bin/env node

/**
 * Validate Eventbrite CSV Data
 *
 * This script validates the Eventbrite CSV exports before importing them into the database.
 * It checks data quality, identifies duplicates, validates formats, and cross-validates
 * financial data between Orders and Sales CSVs.
 *
 * Usage:
 *   node scripts/validate-eventbrite-csv.js
 *
 * Output:
 *   - Validation report with errors, warnings, and statistics
 *   - Exit code 0 if no critical errors, 1 if critical errors found
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

// Configuration
const ORDERS_CSV_PATH = '/root/agents/docs/testing/Cross-Event_(953_Events)_Orders_276710097137_20251120_110156_412.csv';
const SALES_CSV_PATH = '/root/agents/docs/testing/Cross-Event_(953_Events)_Sales_276710097137_20251120_110409_220.csv';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI2Njg2MSwiZXhwIjoyMDY1ODQyODYxfQ.RS6RG0nbmxEqtO99dnpGnd7WV7C_uI0l_XJugKqOzPE';

// Validation results
const results = {
  orders: {
    total: 0,
    valid: 0,
    errors: [],
    warnings: [],
    duplicates: [],
    missingFields: {
      orderId: 0,
      eventId: 0,
      eventLocation: 0,
      buyerEmail: 0,
      netSales: 0
    },
    invalidDates: [],
    invalidAmounts: [],
    existingOrders: 0,
    newOrders: 0,
    ordersWithVenue: 0
  },
  sales: {
    total: 0,
    valid: 0,
    errors: [],
    warnings: []
  },
  crossValidation: {
    financialDiscrepancies: []
  }
};

// Utility functions
const parseCSV = (filePath) => {
  console.log(`📖 Reading ${path.basename(filePath)}...`);
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
};

const isValidDate = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
};

const isValidAmount = (amountStr) => {
  if (!amountStr) return true; // Optional fields
  const cleaned = String(amountStr).replace(/[$,]/g, '');
  const num = parseFloat(cleaned);
  return !isNaN(num);
};

const parseAmount = (amountStr) => {
  if (!amountStr) return 0;
  const cleaned = String(amountStr).replace(/[$,]/g, '');
  return parseFloat(cleaned) || 0;
};

// Validate Orders CSV
const validateOrders = (orders, existingOrderIds) => {
  console.log('\n📋 Validating Orders CSV...');

  const seenOrderIds = new Set();
  results.orders.total = orders.length;

  orders.forEach((order, index) => {
    const rowNum = index + 2; // +2 for header and 1-based indexing
    let hasError = false;

    // Required field validation
    if (!order['Order ID']) {
      results.orders.missingFields.orderId++;
      results.orders.errors.push(`Row ${rowNum}: Missing Order ID`);
      hasError = true;
    } else {
      // Check for duplicates within CSV
      if (seenOrderIds.has(order['Order ID'])) {
        results.orders.duplicates.push({
          orderId: order['Order ID'],
          row: rowNum
        });
        results.orders.errors.push(`Row ${rowNum}: Duplicate Order ID ${order['Order ID']}`);
        hasError = true;
      }
      seenOrderIds.add(order['Order ID']);

      // Check if order exists in database
      if (existingOrderIds.has(order['Order ID'])) {
        results.orders.existingOrders++;
      } else {
        results.orders.newOrders++;
      }
    }

    if (!order['Event ID']) {
      results.orders.missingFields.eventId++;
      results.orders.warnings.push(`Row ${rowNum}: Missing Event ID`);
    }

    // Count orders with venue data
    if (order['Event location'] && order['Event location'].trim()) {
      results.orders.ordersWithVenue++;
    } else {
      results.orders.missingFields.eventLocation++;
      results.orders.warnings.push(`Row ${rowNum}: Missing Event location (venue)`);
    }

    if (!order['Buyer email']) {
      results.orders.missingFields.buyerEmail++;
      results.orders.warnings.push(`Row ${rowNum}: Missing Buyer email`);
    }

    // Date validation
    if (order['Order date'] && !isValidDate(order['Order date'])) {
      results.orders.invalidDates.push({
        orderId: order['Order ID'],
        date: order['Order date'],
        row: rowNum
      });
      results.orders.errors.push(`Row ${rowNum}: Invalid Order date format: ${order['Order date']}`);
      hasError = true;
    }

    if (order['Event start date'] && !isValidDate(order['Event start date'])) {
      results.orders.invalidDates.push({
        orderId: order['Order ID'],
        date: order['Event start date'],
        row: rowNum
      });
      results.orders.warnings.push(`Row ${rowNum}: Invalid Event start date format: ${order['Event start date']}`);
    }

    // Amount validation
    const amountFields = [
      'Gross sales',
      'Net sales',
      'Eventbrite service fee',
      'Eventbrite payment processing fee',
      'Ticket revenue'
    ];

    amountFields.forEach(field => {
      if (order[field] && !isValidAmount(order[field])) {
        results.orders.invalidAmounts.push({
          orderId: order['Order ID'],
          field,
          value: order[field],
          row: rowNum
        });
        results.orders.errors.push(`Row ${rowNum}: Invalid ${field} format: ${order[field]}`);
        hasError = true;
      }
    });

    // Net sales check (critical field)
    if (!order['Net sales']) {
      results.orders.missingFields.netSales++;
      results.orders.warnings.push(`Row ${rowNum}: Missing Net sales`);
    }

    if (!hasError) {
      results.orders.valid++;
    }
  });

  console.log(`✅ Validated ${results.orders.total} orders`);
  console.log(`   Valid: ${results.orders.valid}`);
  console.log(`   Existing in DB: ${results.orders.existingOrders}`);
  console.log(`   New orders: ${results.orders.newOrders}`);
  console.log(`   Orders with venue: ${results.orders.ordersWithVenue}`);
  console.log(`   Duplicates: ${results.orders.duplicates.length}`);
  console.log(`   Errors: ${results.orders.errors.length}`);
  console.log(`   Warnings: ${results.orders.warnings.length}`);
};

// Validate Sales CSV
const validateSales = (sales) => {
  console.log('\n📊 Validating Sales CSV...');

  results.sales.total = sales.length;

  sales.forEach((sale, index) => {
    const rowNum = index + 2;
    let hasError = false;

    if (!sale['Event name']) {
      results.sales.warnings.push(`Row ${rowNum}: Missing Event name`);
    }

    // Validate financial fields
    const amountFields = [
      'Gross sales',
      'Net sales',
      'Tickets sold'
    ];

    amountFields.forEach(field => {
      if (sale[field] && !isValidAmount(sale[field])) {
        results.sales.errors.push(`Row ${rowNum}: Invalid ${field} format: ${sale[field]}`);
        hasError = true;
      }
    });

    if (!hasError) {
      results.sales.valid++;
    }
  });

  console.log(`✅ Validated ${results.sales.total} event sales records`);
  console.log(`   Valid: ${results.sales.valid}`);
  console.log(`   Errors: ${results.sales.errors.length}`);
  console.log(`   Warnings: ${results.sales.warnings.length}`);
};

// Cross-validate Orders and Sales
const crossValidate = (orders, sales) => {
  console.log('\n🔍 Cross-validating Orders and Sales data...');

  // Build event summaries from orders
  const eventOrderTotals = new Map();

  orders.forEach(order => {
    const eventId = order['Event ID'];
    if (!eventId) return;

    if (!eventOrderTotals.has(eventId)) {
      eventOrderTotals.set(eventId, {
        eventId,
        eventName: order['Event name'],
        orderCount: 0,
        totalGross: 0,
        totalNet: 0
      });
    }

    const summary = eventOrderTotals.get(eventId);
    summary.orderCount++;
    summary.totalGross += parseAmount(order['Gross sales']);
    summary.totalNet += parseAmount(order['Net sales']);
  });

  // Compare with Sales CSV
  sales.forEach(sale => {
    const eventName = sale['Event name'];
    if (!eventName) return;

    // Find matching event by name (Sales CSV doesn't have Event ID)
    const matchingEvent = Array.from(eventOrderTotals.values()).find(
      e => e.eventName === eventName
    );

    if (!matchingEvent) {
      // This is OK - Sales CSV is aggregated by event name, might have multiple date instances
      return;
    }

    // Compare totals (allow 5% variance for rounding and aggregation differences)
    const salesGross = parseAmount(sale['Gross sales']);
    const salesNet = parseAmount(sale['Net sales']);
    const ordersGross = matchingEvent.totalGross;
    const ordersNet = matchingEvent.totalNet;

    const grossDiff = Math.abs(salesGross - ordersGross);
    const grossVariance = salesGross > 0 ? (grossDiff / salesGross) * 100 : 0;

    const netDiff = Math.abs(salesNet - ordersNet);
    const netVariance = salesNet > 0 ? (netDiff / salesNet) * 100 : 0;

    if (grossVariance > 5) {
      results.crossValidation.financialDiscrepancies.push({
        eventName,
        type: 'Gross Sales',
        salesValue: salesGross,
        ordersValue: ordersGross,
        difference: grossDiff,
        variance: grossVariance.toFixed(2) + '%'
      });
    }

    if (netVariance > 5) {
      results.crossValidation.financialDiscrepancies.push({
        eventName,
        type: 'Net Sales',
        salesValue: salesNet,
        ordersValue: ordersNet,
        difference: netDiff,
        variance: netVariance.toFixed(2) + '%'
      });
    }
  });

  console.log(`✅ Cross-validated ${eventOrderTotals.size} events`);
  console.log(`   Financial discrepancies (>5% variance): ${results.crossValidation.financialDiscrepancies.length}`);
};

// Generate report
const generateReport = () => {
  console.log('\n\n═══════════════════════════════════════════');
  console.log('📊 VALIDATION REPORT');
  console.log('═══════════════════════════════════════════\n');

  // Orders summary
  console.log('ORDERS CSV:');
  console.log(`  Total rows: ${results.orders.total}`);
  console.log(`  Valid rows: ${results.orders.valid}`);
  console.log(`  Existing orders: ${results.orders.existingOrders}`);
  console.log(`  New orders: ${results.orders.newOrders}`);
  console.log(`  Orders with venue: ${results.orders.ordersWithVenue} (${((results.orders.ordersWithVenue / results.orders.total) * 100).toFixed(1)}%)`);
  console.log(`  Duplicates: ${results.orders.duplicates.length}`);
  console.log(`  Errors: ${results.orders.errors.length}`);
  console.log(`  Warnings: ${results.orders.warnings.length}\n`);

  // Sales summary
  console.log('SALES CSV:');
  console.log(`  Total rows: ${results.sales.total}`);
  console.log(`  Valid rows: ${results.sales.valid}`);
  console.log(`  Errors: ${results.sales.errors.length}`);
  console.log(`  Warnings: ${results.sales.warnings.length}\n`);

  // Cross-validation summary
  console.log('CROSS-VALIDATION:');
  console.log(`  Financial discrepancies (>5%): ${results.crossValidation.financialDiscrepancies.length}\n`);

  // Critical errors
  const criticalErrors = results.orders.errors.length + results.sales.errors.length;
  if (criticalErrors > 0) {
    console.log('❌ CRITICAL ERRORS:\n');

    if (results.orders.errors.length > 0) {
      console.log('Orders CSV errors (showing first 10):');
      results.orders.errors.slice(0, 10).forEach(err => console.log(`  - ${err}`));
      if (results.orders.errors.length > 10) {
        console.log(`  ... and ${results.orders.errors.length - 10} more`);
      }
      console.log('');
    }

    if (results.sales.errors.length > 0) {
      console.log('Sales CSV errors (showing first 10):');
      results.sales.errors.slice(0, 10).forEach(err => console.log(`  - ${err}`));
      if (results.sales.errors.length > 10) {
        console.log(`  ... and ${results.sales.errors.length - 10} more`);
      }
      console.log('');
    }
  }

  // Financial discrepancies (only show if significant)
  if (results.crossValidation.financialDiscrepancies.length > 0) {
    console.log('💰 FINANCIAL DISCREPANCIES >5% (showing first 5):\n');
    results.crossValidation.financialDiscrepancies.slice(0, 5).forEach(disc => {
      console.log(`  Event: ${disc.eventName}`);
      console.log(`  Type: ${disc.type}`);
      console.log(`  Sales CSV: $${disc.salesValue.toFixed(2)}`);
      console.log(`  Orders total: $${disc.ordersValue.toFixed(2)}`);
      console.log(`  Difference: $${disc.difference.toFixed(2)} (${disc.variance})\n`);
    });
    if (results.crossValidation.financialDiscrepancies.length > 5) {
      console.log(`  ... and ${results.crossValidation.financialDiscrepancies.length - 5} more\n`);
    }
    console.log('Note: Discrepancies may be due to Sales CSV aggregating multiple event instances\n');
  }

  console.log('═══════════════════════════════════════════\n');

  // Conclusion
  if (criticalErrors === 0) {
    console.log('✅ VALIDATION PASSED');
    console.log('   No critical errors found. Safe to proceed with import.\n');
    if (results.orders.warnings.length > 0) {
      console.log(`   Note: ${results.orders.warnings.length} warnings found (mostly optional fields).`);
    }
    console.log(`\n📍 Expected venue coverage after import: ${((results.orders.ordersWithVenue / results.orders.total) * 100).toFixed(1)}%\n`);
    return 0;
  } else {
    console.log('❌ VALIDATION FAILED');
    console.log(`   ${criticalErrors} critical errors found. Fix errors before importing.\n`);
    return 1;
  }
};

// Main validation function
async function validate() {
  console.log('🚀 Starting CSV validation...\n');

  // Check files exist
  if (!fs.existsSync(ORDERS_CSV_PATH)) {
    console.error(`❌ Orders CSV not found: ${ORDERS_CSV_PATH}`);
    process.exit(1);
  }

  if (!fs.existsSync(SALES_CSV_PATH)) {
    console.error(`❌ Sales CSV not found: ${SALES_CSV_PATH}`);
    process.exit(1);
  }

  // Parse CSVs
  const orders = parseCSV(ORDERS_CSV_PATH);
  const sales = parseCSV(SALES_CSV_PATH);

  console.log(`✅ Loaded ${orders.length} orders`);
  console.log(`✅ Loaded ${sales.length} sales records`);

  // Get existing order IDs from database
  console.log('\n🔍 Fetching existing orders from database...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: existingOrders, error } = await supabase
    .from('orders_eventbrite')
    .select('source_id');

  if (error) {
    console.error('❌ Failed to fetch existing orders:', error.message);
    process.exit(1);
  }

  const existingOrderIds = new Set(existingOrders.map(o => o.source_id));
  console.log(`✅ Found ${existingOrderIds.size} existing orders in database`);

  // Run validations
  validateOrders(orders, existingOrderIds);
  validateSales(sales);
  crossValidate(orders, sales);

  // Generate report
  const exitCode = generateReport();

  process.exit(exitCode);
}

// Run validation
validate().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
