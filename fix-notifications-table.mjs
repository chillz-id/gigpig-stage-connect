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

async function fixNotificationsTable() {
  console.log('🔧 Fixing notifications table...\n');

  try {
    // 1. Check if notifications table exists
    console.log('1. Checking if notifications table exists...');
    const checkTable = await executeSQLViaManagementAPI(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );
    `);
    
    const tableExists = checkTable[0]?.exists;
    console.log('Table exists:', tableExists);

    if (tableExists) {
      // 2. Rename 'read' column to 'is_read' to avoid reserved word issues
      console.log('\n2. Fixing read column (reserved word issue)...');
      try {
        await executeSQLViaManagementAPI(`
          ALTER TABLE public.notifications 
          RENAME COLUMN read TO is_read;
        `);
        console.log('✓ Renamed read column to is_read');
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log('Column might already be renamed or not exist');
          
          // Try to add is_read column if it doesn't exist
          try {
            await executeSQLViaManagementAPI(`
              ALTER TABLE public.notifications 
              ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
            `);
            console.log('✓ Added is_read column');
          } catch (e) {
            console.log('Column might already exist');
          }
        }
      }
    } else {
      // 3. Create the table with correct column names
      console.log('\n3. Creating notifications table with correct schema...');
      await executeSQLViaManagementAPI(`
        CREATE TABLE public.notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT DEFAULT 'info',
          is_read BOOLEAN DEFAULT false,
          data JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add index for performance
        CREATE INDEX idx_notifications_user_read 
          ON public.notifications(user_id, is_read);

        -- Enable RLS
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view own notifications" ON public.notifications
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can update own notifications" ON public.notifications
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Service role bypass" ON public.notifications
          FOR ALL TO service_role USING (true);
      `);
      console.log('✓ Created notifications table with correct schema');
    }

    // 4. Update any frontend code that references 'read' column
    console.log('\n4. Frontend code needs to be updated to use is_read instead of read');
    console.log('   Files to update:');
    console.log('   - Any notification-related hooks or components');

    console.log('\n✅ Notifications table fixed!');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixNotificationsTable();