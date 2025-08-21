#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseState() {
    console.log('Checking Supabase database state...\n');

    // Define all tables we expect
    const expectedTables = [
        // Core tables
        'profiles', 'events', 'applications', 'user_roles',
        // Task system
        'tasks', 'task_comments', 'task_reminders', 'task_templates', 'task_template_items',
        // Flight system  
        'flight_bookings', 'flight_status_updates', 'flight_notifications', 'flight_api_config',
        'n8n_flight_workflow_logs', 'flight_search_cache',
        // Tour system
        'tours', 'tour_stops', 'tour_participants', 'tour_itinerary', 'tour_logistics',
        'tour_collaborations', 'tour_expenses', 'tour_revenue',
        // Storage
        'push_subscriptions'
    ];

    const tableStatus = {};
    const missingTables = [];
    const existingTables = [];

    // Check each table
    for (const table of expectedTables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                if (error.message.includes('does not exist')) {
                    tableStatus[table] = '❌ Missing';
                    missingTables.push(table);
                } else {
                    tableStatus[table] = `⚠️  Error: ${error.message}`;
                }
            } else {
                tableStatus[table] = '✅ Exists';
                existingTables.push(table);
            }
        } catch (e) {
            tableStatus[table] = `⚠️  Error: ${e.message}`;
        }
    }

    // Print results
    console.log('=== TABLE STATUS ===');
    Object.entries(tableStatus).forEach(([table, status]) => {
        console.log(`${table.padEnd(30)} ${status}`);
    });

    console.log('\n=== SUMMARY ===');
    console.log(`Total tables checked: ${expectedTables.length}`);
    console.log(`Existing tables: ${existingTables.length}`);
    console.log(`Missing tables: ${missingTables.length}`);

    if (missingTables.length > 0) {
        console.log('\n=== MISSING TABLES ===');
        missingTables.forEach(table => console.log(`- ${table}`));
    }

    // Check for triggers that might exist without tables
    console.log('\n=== CHECKING FOR ORPHANED TRIGGERS ===');
    const triggerTables = ['tasks', 'tours', 'tour_stops', 'flight_bookings'];
    
    for (const table of triggerTables) {
        if (missingTables.includes(table)) {
            console.log(`⚠️  Table '${table}' is missing but might have orphaned triggers`);
        }
    }

    // Check storage buckets
    console.log('\n=== CHECKING STORAGE BUCKETS ===');
    const expectedBuckets = ['profile-images', 'comedian-media', 'event-media'];
    
    // Note: listBuckets() requires service role key, so we test bucket access directly
    for (const bucketName of expectedBuckets) {
        try {
            // Try to list files in the bucket to check if it exists
            const { data, error } = await supabase.storage
                .from(bucketName)
                .list('', { limit: 1 });

            if (error) {
                // Check various error messages that indicate missing bucket
                const errorMsg = error.message.toLowerCase();
                if (errorMsg.includes('not found') || 
                    errorMsg.includes('does not exist') ||
                    errorMsg.includes('bucket not found')) {
                    console.log(`❌ ${bucketName} - Missing`);
                } else {
                    // If we get a different error, the bucket likely exists
                    // Common errors: "No files found" or permission errors
                    console.log(`✅ ${bucketName} - Exists (${data ? 'with files' : 'empty or restricted'})`);
                }
            } else {
                // No error means bucket exists and we can access it
                const fileCount = data ? data.length : 0;
                console.log(`✅ ${bucketName} - Exists${fileCount > 0 ? ` (${fileCount}+ files)` : ''}`);
            }
        } catch (e) {
            console.log(`❌ ${bucketName} - Error: ${e.message}`);
        }
    }

    return { existingTables, missingTables, tableStatus };
}

// Run the check
checkSupabaseState()
    .then(result => {
        console.log('\n✅ Check complete');
        if (result.missingTables.length > 0) {
            console.log('\n⚠️  You need to create the missing tables!');
            console.log('Run the SQL script: /root/agents/FIX_ALL_MISSING_TABLES.sql');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('❌ Check failed:', error);
        process.exit(1);
    });