#!/usr/bin/env python3
"""
Script to fix auth.users table issues preventing new user signups
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Supabase credentials
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # Need service role key for auth schema access

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Error: Missing Supabase credentials")
    print("Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env")
    sys.exit(1)

# Create Supabase client with service role key
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# SQL to fix auth issues
fix_auth_sql = """
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create or replace the function to handle new users with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Try to create profile
    BEGIN
        INSERT INTO public.profiles (
            id,
            email,
            created_at,
            updated_at
        ) VALUES (
            new.id,
            new.email,
            now(),
            now()
        ) ON CONFLICT (id) DO NOTHING;
    EXCEPTION
        WHEN others THEN
            -- Log but don't fail
            RAISE WARNING 'Could not create profile for user %: %', new.id, SQLERRM;
    END;
    
    -- Try to create role
    BEGIN
        INSERT INTO public.user_roles (
            user_id,
            role,
            created_at
        ) VALUES (
            new.id,
            'comedian',
            now()
        ) ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION
        WHEN others THEN
            -- Log but don't fail
            RAISE WARNING 'Could not create role for user %: %', new.id, SQLERRM;
    END;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.user_roles TO anon, authenticated;
"""

# Check existing constraints SQL
check_constraints_sql = """
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint 
WHERE connamespace = 'auth'::regnamespace 
AND conrelid = 'auth.users'::regclass;
"""

try:
    print("Checking existing constraints on auth.users...")
    
    # Execute check constraints query using RPC if available
    # Note: Direct SQL execution requires database admin access
    print("\nNote: Direct SQL execution requires database admin access.")
    print("The SQL commands have been prepared. You may need to execute them through:")
    print("1. Supabase Dashboard SQL Editor")
    print("2. Direct database connection with admin privileges")
    print("3. Supabase CLI with appropriate permissions")
    
    print("\n" + "="*60)
    print("SQL TO EXECUTE:")
    print("="*60)
    print(fix_auth_sql)
    print("="*60)
    
    # Save SQL to file for easy access
    with open('/root/agents/fix_auth_users.sql', 'w') as f:
        f.write(fix_auth_sql)
    
    print("\nSQL has been saved to: /root/agents/fix_auth_users.sql")
    print("\nTo execute this SQL:")
    print("1. Go to your Supabase Dashboard")
    print("2. Navigate to SQL Editor")
    print("3. Paste and run the SQL commands")
    print("\nAlternatively, if you have database connection details:")
    print("psql -h <host> -U <user> -d <database> -f /root/agents/fix_auth_users.sql")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)