#!/usr/bin/env node

/**
 * Test Resend Email Service
 *
 * This script tests the Resend email service by sending a test welcome email.
 *
 * Usage:
 *   node scripts/test-email-service.js <email@example.com>
 */

import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const resend = new Resend(process.env.VITE_RESEND_API_KEY);

async function testEmailService(toEmail) {
  console.log('\n📧 Testing Resend Email Service\n');
  console.log('Configuration:');
  console.log(`  API Key: ${process.env.VITE_RESEND_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`  From Email: ${process.env.VITE_RESEND_FROM_EMAIL || 'noreply@gigpigs.app'}`);
  console.log(`  To Email: ${toEmail}\n`);

  if (!process.env.VITE_RESEND_API_KEY) {
    console.error('❌ Error: VITE_RESEND_API_KEY not set in environment');
    process.exit(1);
  }

  try {
    console.log('Sending test welcome email...\n');

    const fromEmail = process.env.VITE_RESEND_FROM_EMAIL || 'noreply@gigpigs.app';

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: '🎤 Test Email - Stand Up Sydney',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
              .success { background: #10b981; color: white; padding: 12px; border-radius: 6px; margin: 20px 0; text-align: center; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎤 Test Email Success!</h1>
              </div>
              <div class="content">
                <div class="success">
                  ✅ Resend Email Service is Working!
                </div>

                <p>This is a test email from the Stand Up Sydney email service.</p>

                <p><strong>Configuration Details:</strong></p>
                <ul>
                  <li><strong>Service:</strong> Resend</li>
                  <li><strong>From:</strong> ${fromEmail}</li>
                  <li><strong>To:</strong> ${toEmail}</li>
                  <li><strong>Timestamp:</strong> ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}</li>
                </ul>

                <p>If you're seeing this email, the integration is working correctly! 🎉</p>

                <p><strong>Next Steps:</strong></p>
                <ol>
                  <li>Verify domain in Resend dashboard</li>
                  <li>Add environment variables to Vercel</li>
                  <li>Test signup flow on production</li>
                </ol>

                <p>Break a leg! 🎭</p>
              </div>
              <div class="footer">
                <p>Stand Up Sydney | Email Service Test</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Email Send Error:');
      console.error(JSON.stringify(error, null, 2));
      process.exit(1);
    }

    console.log('✅ Email sent successfully!\n');
    console.log('Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n📊 Next Steps:');
    console.log('  1. Check your inbox at:', toEmail);
    console.log('  2. View email in Resend dashboard: https://resend.com/emails');
    console.log('  3. Verify domain if not already done: https://resend.com/domains');
    console.log('\n');

  } catch (error) {
    console.error('❌ Unexpected Error:');
    console.error(error);
    process.exit(1);
  }
}

// Parse command line arguments
const toEmail = process.argv[2];

if (!toEmail) {
  console.error('\n❌ Error: Email address required\n');
  console.log('Usage: node scripts/test-email-service.js <email@example.com>');
  console.log('Example: node scripts/test-email-service.js test@example.com\n');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(toEmail)) {
  console.error('\n❌ Error: Invalid email format\n');
  process.exit(1);
}

testEmailService(toEmail);
