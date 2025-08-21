#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n=== FULL SYSTEM AUDIT - FINDING ALL BROKEN THINGS ===\n');

const issues = [];

async function auditSystem() {
    // 1. CHECK PROFILES
    console.log('1. CHECKING PROFILES...');
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
    
    const profileCount = profiles?.[0]?.count || 0;
    console.log(`   Profiles in database: ${profileCount}`);
    if (profileCount === 0) {
        issues.push('CRITICAL: No profiles exist - entire user system broken');
    }

    // 2. CHECK USER ROLES
    console.log('\n2. CHECKING USER ROLES...');
    const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .limit(10);
    
    console.log(`   User roles found: ${roles?.length || 0}`);
    if (!roles || roles.length === 0) {
        issues.push('CRITICAL: No user roles - permissions system broken');
    }

    // 3. CHECK EVENTS
    console.log('\n3. CHECKING EVENTS...');
    const { data: events, error: eventError } = await supabase
        .from('events')
        .select('id, title, stage_manager_id, created_at, status')
        .limit(10);
    
    console.log(`   Events found: ${events?.length || 0}`);
    if (events && events.length > 0) {
        // Check if events have valid stage_manager_ids
        const invalidEvents = events.filter(e => !e.stage_manager_id);
        if (invalidEvents.length > 0) {
            issues.push(`WARNING: ${invalidEvents.length} events have no stage_manager_id`);
        }
    }

    // 4. CHECK APPLICATIONS
    console.log('\n4. CHECKING APPLICATIONS...');
    const { data: applications } = await supabase
        .from('applications')
        .select('count')
        .limit(1);
    
    const appCount = applications?.[0]?.count || 0;
    console.log(`   Applications: ${appCount}`);

    // 5. CHECK STORAGE BUCKETS
    console.log('\n5. CHECKING STORAGE...');
    const buckets = ['profile-images', 'comedian-media', 'event-media'];
    for (const bucket of buckets) {
        try {
            const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });
            if (error) {
                console.log(`   ❌ ${bucket}: ERROR - ${error.message}`);
                issues.push(`Storage bucket '${bucket}' is not accessible`);
            } else {
                console.log(`   ✅ ${bucket}: Accessible`);
            }
        } catch (e) {
            console.log(`   ❌ ${bucket}: FAILED`);
            issues.push(`Storage bucket '${bucket}' check failed`);
        }
    }

    // 6. CHECK RPC FUNCTIONS
    console.log('\n6. CHECKING RPC FUNCTIONS...');
    const rpcFunctions = ['is_co_promoter_for_event', 'get_comedian_stats', 'get_vouch_stats'];
    for (const func of rpcFunctions) {
        try {
            // Try to call with dummy data
            const { error } = await supabase.rpc(func, { 
                _user_id: '00000000-0000-0000-0000-000000000000',
                _event_id: '00000000-0000-0000-0000-000000000000'
            });
            if (error && !error.message.includes('permission')) {
                console.log(`   ❌ ${func}: ${error.message}`);
                issues.push(`RPC function '${func}' is broken`);
            } else {
                console.log(`   ✅ ${func}: Exists`);
            }
        } catch (e) {
            console.log(`   ❌ ${func}: NOT FOUND`);
            issues.push(`RPC function '${func}' is missing`);
        }
    }

    // 7. CHECK CRITICAL TABLES
    console.log('\n7. CHECKING CRITICAL TABLES...');
    const criticalTables = [
        'profiles', 'events', 'applications', 'user_roles', 
        'event_spots', 'comedian_media', 'tasks', 'tours'
    ];
    
    for (const table of criticalTables) {
        try {
            const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
            if (error) {
                console.log(`   ❌ ${table}: ${error.message}`);
                if (error.message.includes('does not exist')) {
                    issues.push(`CRITICAL: Table '${table}' does not exist`);
                }
            } else {
                console.log(`   ✅ ${table}: ${count || 0} rows`);
            }
        } catch (e) {
            console.log(`   ❌ ${table}: ERROR`);
        }
    }

    // 8. CHECK AUTH CONFIGURATION
    console.log('\n8. CHECKING AUTH...');
    try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log(`   Current session: ${session ? 'Active' : 'None'}`);
    } catch (e) {
        issues.push('Auth system may be misconfigured');
    }

    // 9. CHECK FOR ORPHANED DATA
    console.log('\n9. CHECKING FOR ORPHANED DATA...');
    
    // Check for uploaded images without profiles
    const { data: uploads } = await supabase.storage.from('profile-images').list('');
    if (uploads && uploads.length > 0 && profileCount === 0) {
        issues.push(`CRITICAL: ${uploads.length} image uploads exist but NO profiles exist`);
    }

    // SUMMARY
    console.log('\n' + '='.repeat(60));
    console.log('CRITICAL ISSUES FOUND:');
    console.log('='.repeat(60));
    
    if (issues.length === 0) {
        console.log('No critical issues found (this seems unlikely...)');
    } else {
        issues.forEach((issue, i) => {
            console.log(`${i + 1}. ${issue}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`TOTAL ISSUES: ${issues.length}`);
    console.log('='.repeat(60));
}

auditSystem().catch(console.error);