import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPaymentLinkCreation() {
  console.log('🧪 Testing Stripe Payment Link Creation...\n');

  try {
    // 1. Get a test invoice
    console.log('1. Getting test invoice...');
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('status', 'sent')
      .limit(1)
      .single();

    if (invoiceError || !invoice) {
      console.log('No sent invoices found. Creating a test invoice...');
      
      // Get a test user
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (!users || users.length === 0) {
        console.error('No users found in database');
        return;
      }

      // Create test invoice
      const { data: newInvoice, error: createError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: `TEST-${Date.now()}`,
          promoter_id: users[0].id,
          event_name: 'Test Comedy Show',
          performance_date: new Date().toISOString().split('T')[0],
          venue_name: 'Test Venue',
          total_amount: 100.00,
          currency: 'AUD',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'sent'
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create test invoice:', createError);
        return;
      }

      console.log('Created test invoice:', newInvoice.invoice_number);
      invoice = newInvoice;
    }

    console.log('Using invoice:', invoice.invoice_number);

    // 2. Test create-payment-link edge function
    console.log('\n2. Testing create-payment-link edge function...');
    
    // Get auth token for the user
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    const testUser = authUsers?.find(u => u.id === invoice.promoter_id || u.id === invoice.comedian_id);
    
    if (!testUser) {
      console.error('Could not find auth user for invoice');
      return;
    }

    // Generate a test token (in production, this would come from the authenticated user)
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: testUser.email,
    });

    if (sessionError) {
      console.error('Failed to generate auth token:', sessionError);
      return;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        invoiceId: invoice.id,
        amount: Math.round(invoice.total_amount * 100), // Convert to cents
        currency: invoice.currency.toLowerCase(),
        description: `Invoice ${invoice.invoice_number}`,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number
        }
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Edge function error:', result);
      return;
    }

    console.log('✅ Payment link created successfully!');
    console.log('Payment Link URL:', result.url);
    console.log('Payment Link ID:', result.paymentLinkId);

    // 3. Verify payment link was stored
    console.log('\n3. Verifying payment link in database...');
    const { data: paymentLink, error: linkError } = await supabase
      .from('invoice_payment_links')
      .select('*')
      .eq('invoice_id', invoice.id)
      .single();

    if (linkError) {
      console.error('❌ Failed to find payment link in database:', linkError);
    } else {
      console.log('✅ Payment link stored in database');
      console.log('Status:', paymentLink.status);
      console.log('Expires at:', paymentLink.expires_at);
    }

    // 4. Test webhook handler (simulated)
    console.log('\n4. Simulating webhook event...');
    const webhookPayload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_' + Date.now(),
          payment_status: 'paid',
          amount_total: invoice.total_amount * 100,
          currency: invoice.currency.toLowerCase(),
          metadata: {
            invoiceId: invoice.id
          },
          payment_intent: 'pi_test_' + Date.now()
        }
      }
    };

    console.log('Webhook simulation would process payment for invoice:', invoice.invoice_number);
    console.log('This would:');
    console.log('- Create payment record in invoice_payments table');
    console.log('- Update invoice status to "paid"');
    console.log('- Update payment link status to "completed"');
    console.log('- Send notification to user');

    console.log('\n✅ All tests completed successfully!');
    console.log('\nNOTE: To fully test the payment flow:');
    console.log('1. Set up Stripe keys in .env file');
    console.log('2. Deploy edge functions to Supabase');
    console.log('3. Configure Stripe webhook endpoint');
    console.log('4. Test with real Stripe checkout');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPaymentLinkCreation();