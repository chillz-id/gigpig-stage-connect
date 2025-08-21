import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'pdikjpfulhhpqpxzpgtu';

async function executeSQLViaManagementAPI(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to execute SQL: ${error}`);
  }

  return await response.json();
}

async function verifyUserProfile() {
  console.log('🔍 Verifying user profile...\n');

  try {
    const result = await executeSQLViaManagementAPI(`
      SELECT 
        id,
        email,
        first_name,
        last_name,
        name,
        avatar_url,
        created_at
      FROM public.profiles
      WHERE email = 'chillz@standupsydney.com';
    `);
    
    if (result && result.length > 0) {
      console.log('Profile found:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Email:', result[0].email);
      console.log('First Name:', result[0].first_name);
      console.log('Last Name:', result[0].last_name);
      console.log('Full Name:', result[0].name);
      console.log('Avatar URL:', result[0].avatar_url);
      console.log('Created:', new Date(result[0].created_at).toLocaleString());
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('No profile found for chillz@standupsydney.com');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

verifyUserProfile();