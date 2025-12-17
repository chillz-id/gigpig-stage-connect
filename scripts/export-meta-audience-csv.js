#!/usr/bin/env node
/**
 * Export Meta Audience Customers to CSV
 *
 * Per Meta's "Customer list formatting guidelines for custom audiences":
 * https://www.facebook.com/business/help/2082575038703844
 *
 * For manual UI upload - exports RAW data (Meta hashes on their end)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pdikjpfulhhpqpxzpgtu.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function exportToCSV() {
  console.log('Fetching customer data...');

  let allData = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('meta_audience_customers')
      .select('email, phone, first_name, last_name, city, state, postcode, country, date_of_birth, gender, customer_value')
      .order('match_keys_count', { ascending: false })
      .order('customer_value', { ascending: false, nullsFirst: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error:', error);
      process.exit(1);
    }

    allData = allData.concat(data);
    console.log(`Page ${page + 1}: ${data.length} records (total: ${allData.length})`);

    if (data.length < pageSize) break;
    page++;
  }

  console.log(`\nTotal: ${allData.length} customers`);

  // Meta column headers - EXACTLY as specified in their documentation
  // Only including columns we have data for
  const headers = [
    'email',    // Main identifier (required)
    'phone',    // Main identifier
    'fn',       // First name
    'ln',       // Last name
    'ct',       // City
    'st',       // State/Region
    'zip',      // Postcode
    'country',  // ISO 2-letter code
    'dob',      // Date of birth (YYYYMMDD format - Meta accepts this)
    'doby',     // Year of birth (4-digit)
    'age',      // Age (numeric)
    'gen',      // Gender (M/F)
    'value'     // Customer value (numeric, no currency symbol)
  ];

  // Calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob || dob.length !== 8) return '';
    const year = parseInt(dob.substring(0, 4));
    const month = parseInt(dob.substring(4, 6));
    const day = parseInt(dob.substring(6, 8));
    const today = new Date();
    let age = today.getFullYear() - year;
    if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
      age--;
    }
    return (age > 0 && age < 120) ? age.toString() : '';
  };

  const rows = allData.map(row => {
    const dob = row.date_of_birth || '';
    const doby = dob.length === 8 ? dob.substring(0, 4) : '';

    return [
      row.email || '',
      row.phone || '',
      row.first_name || '',
      row.last_name || '',
      row.city || '',
      row.state || '',
      row.postcode || '',
      (row.country || '').toUpperCase(),  // Meta wants uppercase ISO code
      dob,                                  // YYYYMMDD format
      doby,                                 // Just the year
      calculateAge(dob),                    // Calculated age
      (row.gender || '').toUpperCase(),     // M or F
      row.customer_value ? parseFloat(row.customer_value).toFixed(2) : ''
    ];
  });

  // Build CSV - escape any commas in values
  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  const outputPath = path.join(process.cwd(), 'meta-audience-export.csv');
  fs.writeFileSync(outputPath, csvContent);

  console.log(`\nExported to: ${outputPath}`);
  console.log(`Columns: ${headers.join(', ')}`);
}

exportToCSV().catch(console.error);
