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

async function fixSchemaIssues() {
  console.log('🔧 Fixing schema issues...\n');

  try {
    // 1. Add missing years_experience column to profiles
    console.log('1. Adding years_experience column to profiles...');
    try {
      await executeSQLViaManagementAPI(`
        ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0;
      `);
      console.log('✓ Added years_experience column');
    } catch (error) {
      console.log('Column might already exist or error:', error.message);
    }

    // 2. Create notification_preferences table
    console.log('\n2. Creating notification_preferences table...');
    try {
      await executeSQLViaManagementAPI(`
        CREATE TABLE IF NOT EXISTS public.notification_preferences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          email_notifications BOOLEAN DEFAULT true,
          push_notifications BOOLEAN DEFAULT true,
          sms_notifications BOOLEAN DEFAULT false,
          notification_types JSONB DEFAULT '{"bookings": true, "messages": true, "updates": true}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id)
        );

        -- Enable RLS
        ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view own preferences" ON public.notification_preferences
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can update own preferences" ON public.notification_preferences
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own preferences" ON public.notification_preferences
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      `);
      console.log('✓ Created notification_preferences table');
    } catch (error) {
      console.log('Table might already exist or error:', error.message);
    }

    // 3. Fix notifications table if needed
    console.log('\n3. Checking notifications table...');
    try {
      await executeSQLViaManagementAPI(`
        -- Ensure notifications table exists with correct structure
        CREATE TABLE IF NOT EXISTS public.notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT DEFAULT 'info',
          read BOOLEAN DEFAULT false,
          data JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
          ON public.notifications(user_id, read);

        -- Enable RLS
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view own notifications" ON public.notifications
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can update own notifications" ON public.notifications
          FOR UPDATE USING (auth.uid() = user_id);
      `);
      console.log('✓ Fixed notifications table');
    } catch (error) {
      console.log('Notifications table error:', error.message);
    }

    // 4. Create customization_settings table
    console.log('\n4. Creating customization_settings table...');
    try {
      await executeSQLViaManagementAPI(`
        CREATE TABLE IF NOT EXISTS public.customization_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          settings JSONB NOT NULL,
          is_active BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.customization_settings ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Public read for active settings" ON public.customization_settings
          FOR SELECT USING (is_active = true);

        CREATE POLICY "Admins can manage settings" ON public.customization_settings
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM public.user_roles 
              WHERE user_id = auth.uid() AND role = 'admin'
            )
          );
      `);
      console.log('✓ Created customization_settings table');
    } catch (error) {
      console.log('Customization settings table error:', error.message);
    }

    // 5. Create xero_integrations table
    console.log('\n5. Creating xero_integrations table...');
    try {
      await executeSQLViaManagementAPI(`
        CREATE TABLE IF NOT EXISTS public.xero_integrations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          tenant_id TEXT,
          access_token TEXT,
          refresh_token TEXT,
          expires_at TIMESTAMPTZ,
          organization_name TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id)
        );

        -- Enable RLS
        ALTER TABLE public.xero_integrations ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view own integration" ON public.xero_integrations
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can manage own integration" ON public.xero_integrations
          FOR ALL USING (auth.uid() = user_id);
      `);
      console.log('✓ Created xero_integrations table');
    } catch (error) {
      console.log('Xero integrations table error:', error.message);
    }

    console.log('\n✅ Schema fixes completed!');
    console.log('\nThis should resolve:');
    console.log('- Profile not loading (years_experience column)');
    console.log('- Missing notification tables');
    console.log('- Customization settings errors');
    console.log('- Xero integration errors');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixSchemaIssues();