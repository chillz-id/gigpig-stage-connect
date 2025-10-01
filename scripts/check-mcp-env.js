#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ No .env file found next to this script.');
  process.exit(1);
}

const parsed = dotenv.parse(fs.readFileSync(envPath));
const required = [
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY',
  'GITHUB_PERSONAL_ACCESS_TOKEN',
  'NOTION_TOKEN',
  'SLACK_BOT_TOKEN',
  'SLACK_APP_TOKEN',
  'METRICOOL_USER_TOKEN',
  'METRICOOL_USER_ID',
  'N8N_API_KEY',
  'N8N_API_URL',
  'LINEAR_API_KEY',
  'BRAVE_API_KEY',
  'APIFY_TOKEN',
  'XERO_CLIENT_ID',
  'XERO_CLIENT_SECRET',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'PERPLEXITY_API_KEY',
  'GOOGLE_API_KEY',
  'WIX_API_KEY',
  'WIX_APP_ID',
  'WIX_SITE_ID'
];

const report = required.map((key) => ({
  key,
  present: Boolean(parsed[key] && parsed[key].trim().length > 0),
}));

const missing = report.filter(({ present }) => !present);
report.forEach(({ key, present }) => {
  console.log(`${present ? '✅' : '⚠️'} ${key}`);
});

if (missing.length > 0) {
  console.log('\nSome MCP integrations are missing secrets. Populate them before launching servers.');
  process.exit(1);
}

console.log('\nAll required MCP secrets are present.');
