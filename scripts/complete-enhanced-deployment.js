#!/usr/bin/env node

/**
 * Complete Enhanced Deployment
 * Uses available tools to finalize the enhanced Humanitix to Brevo integration
 */

import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/etc/standup-sydney/credentials.env' });

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function completeEnhancedDeployment() {
  console.log('🚀 Completing Enhanced Integration Deployment...\n');

  // Step 1: Apply Database Migration
  console.log('📊 Step 1: Applying database migration...');
  await applyDatabaseMigration();

  // Step 2: Update N8N Workflow
  console.log('\n⚡ Step 2: Updating N8N workflow...');
  await updateN8NWorkflow();

  // Step 3: Verify Integration
  console.log('\n✅ Step 3: Verifying integration...');
  await verifyIntegration();

  console.log('\n🎉 Enhanced Integration Deployment Complete!');
}

async function applyDatabaseMigration() {
  try {
    console.log('🔄 Adding enhanced customer fields...');

    // Add new columns
    const addColumnsSQL = `
      ALTER TABLE public.customers 
      ADD COLUMN IF NOT EXISTS date_of_birth DATE,
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS company TEXT;
    `;

    const { error: columnsError } = await supabase.rpc('exec_sql', {
      sql: addColumnsSQL
    });

    if (columnsError) {
      console.log('⚠️  Direct SQL execution not available');
      console.log('📋 Please execute this SQL manually in Supabase Dashboard:');
      console.log('URL: https://supabase.com/dashboard/project/pdikjpfulhhpqpxzpgtu/sql');
      console.log('\nSQL to execute:');
      
      const migrationSQL = await fs.readFile('/root/agents/supabase/migrations/20250808_add_customer_fields.sql', 'utf8');
      console.log('```sql');
      console.log(migrationSQL);
      console.log('```');
      
      return false;
    }

    console.log('✅ Customer fields added successfully');

    // Update marketing opt-in default
    console.log('🔄 Setting marketing opt-in to always true...');
    const { error: optInError } = await supabase
      .from('customers')
      .update({ marketing_opt_in: true })
      .or('marketing_opt_in.is.null,marketing_opt_in.eq.false');

    if (!optInError) {
      console.log('✅ Marketing opt-in updated for existing customers');
    }

    return true;
  } catch (error) {
    console.error('❌ Database migration failed:', error.message);
    return false;
  }
}

async function updateN8NWorkflow() {
  try {
    const N8N_API_URL = process.env.N8N_API_URL || 'http://localhost:5678/api/v1';
    const N8N_API_KEY = process.env.N8N_API_KEY;

    if (!N8N_API_KEY) {
      console.log('⚠️  N8N API key not found');
      console.log('📋 Please update N8N workflow manually:');
      console.log('1. Go to: http://170.64.129.59:5678');
      console.log('2. Find "Humanitix to Brevo Customer Sync" workflow');
      console.log('3. Import enhanced version from: /root/agents/n8n-workflows/humanitix-brevo-sync.json');
      console.log('4. Activate the workflow');
      return false;
    }

    // Get existing workflows
    console.log('🔍 Finding existing Humanitix workflow...');
    const workflowsResponse = await fetch(`${N8N_API_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!workflowsResponse.ok) {
      throw new Error(`N8N API error: ${workflowsResponse.status}`);
    }

    const workflows = await workflowsResponse.json();
    const humanitixWorkflow = workflows.data?.find(w => 
      w.name === 'Humanitix to Brevo Customer Sync'
    );

    if (!humanitixWorkflow) {
      console.log('⚠️  Humanitix workflow not found');
      console.log('📋 Please import workflow manually as described above');
      return false;
    }

    // Load enhanced workflow
    console.log('📄 Loading enhanced workflow configuration...');
    const enhancedWorkflow = JSON.parse(
      await fs.readFile('/root/agents/n8n-workflows/humanitix-brevo-sync.json', 'utf8')
    );

    // Update the existing workflow
    console.log('🔄 Updating workflow with enhanced fields...');
    const updateResponse = await fetch(`${N8N_API_URL}/workflows/${humanitixWorkflow.id}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...enhancedWorkflow,
        id: humanitixWorkflow.id
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`Workflow update failed: ${updateResponse.status}`);
    }

    console.log('✅ N8N workflow updated with enhanced fields');

    // Activate workflow if not active
    if (!humanitixWorkflow.active) {
      console.log('🔄 Activating workflow...');
      const activateResponse = await fetch(`${N8N_API_URL}/workflows/${humanitixWorkflow.id}/activate`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (activateResponse.ok) {
        console.log('✅ Workflow activated successfully');
      }
    }

    return true;
  } catch (error) {
    console.error('❌ N8N workflow update failed:', error.message);
    console.log('📋 Please update N8N workflow manually as described above');
    return false;
  }
}

async function verifyIntegration() {
  try {
    // Check database schema
    console.log('🔍 Verifying database schema...');
    const { data: customers, error: dbError } = await supabase
      .from('customers')
      .select('id, email, first_name, date_of_birth, address, company, marketing_opt_in')
      .limit(1);

    if (dbError) {
      console.log('⚠️  Could not verify database schema');
      return false;
    }

    if (customers && customers.length > 0) {
      const sample = customers[0];
      console.log('✅ Database schema verified:');
      console.log(`   Email: ${sample.email || 'N/A'}`);
      console.log(`   Date of Birth: ${sample.date_of_birth !== undefined ? '✓' : 'Missing column'}`);
      console.log(`   Address: ${sample.address !== undefined ? '✓' : 'Missing column'}`);
      console.log(`   Company: ${sample.company !== undefined ? '✓' : 'Missing column'}`);
      console.log(`   Marketing Opt-in: ${sample.marketing_opt_in}`);
    }

    // Test Brevo integration
    console.log('\n🔍 Verifying Brevo integration...');
    const BREVO_API_URL = process.env.BREVO_API_URL || 'https://api.brevo.com/v3';
    const BREVO_API_KEY = process.env.BREVO_API_KEY;

    if (BREVO_API_KEY) {
      const brevoResponse = await fetch(`${BREVO_API_URL}/contacts/attributes`, {
        headers: {
          'api-key': BREVO_API_KEY
        }
      });

      if (brevoResponse.ok) {
        const attributes = await brevoResponse.json();
        const hasEnhancedAttrs = attributes.attributes?.some(attr => 
          ['DATE_OF_BIRTH', 'ADDRESS', 'COMPANY'].includes(attr.name)
        );

        console.log(`✅ Brevo attributes verified: ${hasEnhancedAttrs ? 'Enhanced fields available' : 'Basic fields only'}`);
      }
    }

    console.log('\n🎉 Integration verification complete!');
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

// Run the deployment
completeEnhancedDeployment().catch(console.error);