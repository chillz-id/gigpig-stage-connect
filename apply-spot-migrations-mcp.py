#!/usr/bin/env python3
"""Apply spot confirmation migrations using MCP Supabase tools"""

import os
import sys
import subprocess
import json

def run_mcp_command(tool_name, params):
    """Run an MCP command and return the result"""
    try:
        cmd = [
            'python3', '-c', f"""
import sys
sys.path.append('/root/.claude-multi-agent')
from mcp_client import MCPClient

client = MCPClient()
result = client.call_tool('{tool_name}', {params})
print(json.dumps(result, indent=2))
"""
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error running MCP command: {result.stderr}")
            return None
        
        return json.loads(result.stdout)
    except Exception as e:
        print(f"Error: {e}")
        return None

def apply_migrations():
    """Apply the spot confirmation migrations"""
    print("🚀 Starting spot confirmation migrations using MCP...")
    
    # Check if event_spots table exists and has confirmation fields
    print("📋 Checking current event_spots table structure...")
    
    result = run_mcp_command('mcp__supabase__query', {
        'sql': """
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'event_spots' AND table_schema = 'public'
        ORDER BY ordinal_position;
        """
    })
    
    if result:
        print("Current event_spots columns:")
        for row in result.get('data', []):
            print(f"  - {row['column_name']}: {row['data_type']}")
    
    # Apply the first migration to add confirmation fields
    print("\n📝 Adding confirmation fields to event_spots table...")
    
    migration_sql = """
    ALTER TABLE public.event_spots 
    ADD COLUMN IF NOT EXISTS confirmation_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS confirmation_deadline TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;
    
    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_spots_confirmation_status_check') THEN
            ALTER TABLE public.event_spots 
            ADD CONSTRAINT event_spots_confirmation_status_check 
            CHECK (confirmation_status IN ('pending', 'confirmed', 'declined', 'expired'));
        END IF;
    END $$;
    """
    
    result = run_mcp_command('mcp__supabase__execute', {
        'sql': migration_sql
    })
    
    if result:
        print("✅ Confirmation fields added successfully")
    else:
        print("❌ Failed to add confirmation fields")
        return False
    
    # Add indexes for performance
    print("\n📝 Adding indexes for performance...")
    
    index_sql = """
    CREATE INDEX IF NOT EXISTS idx_event_spots_confirmation_status ON public.event_spots(confirmation_status);
    CREATE INDEX IF NOT EXISTS idx_event_spots_confirmation_deadline ON public.event_spots(confirmation_deadline) WHERE confirmation_deadline IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_event_spots_confirmed_at ON public.event_spots(confirmed_at);
    CREATE INDEX IF NOT EXISTS idx_event_spots_comedian_id ON public.event_spots(comedian_id) WHERE comedian_id IS NOT NULL;
    """
    
    result = run_mcp_command('mcp__supabase__execute', {
        'sql': index_sql
    })
    
    if result:
        print("✅ Indexes added successfully")
    else:
        print("❌ Failed to add indexes")
    
    # Create the confirmation functions
    print("\n📝 Creating spot confirmation functions...")
    
    function_sql = """
    -- Create function to confirm spot
    CREATE OR REPLACE FUNCTION confirm_spot(_spot_id UUID, _user_id UUID)
    RETURNS BOOLEAN AS $$
    DECLARE
        spot_record RECORD;
    BEGIN
        -- Get spot details
        SELECT * INTO spot_record
        FROM public.event_spots 
        WHERE id = _spot_id AND comedian_id = _user_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Spot not found or not assigned to user';
        END IF;
        
        -- Check if spot is still pending
        IF spot_record.confirmation_status != 'pending' THEN
            RAISE EXCEPTION 'Spot is no longer pending confirmation';
        END IF;
        
        -- Check if confirmation deadline has passed
        IF spot_record.confirmation_deadline IS NOT NULL AND spot_record.confirmation_deadline < now() THEN
            RAISE EXCEPTION 'Confirmation deadline has passed';
        END IF;
        
        -- Update spot to confirmed
        UPDATE public.event_spots 
        SET confirmation_status = 'confirmed',
            confirmed_at = now(),
            is_filled = true
        WHERE id = _spot_id;
        
        RETURN TRUE;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Create function to decline spot
    CREATE OR REPLACE FUNCTION decline_spot(_spot_id UUID, _user_id UUID)
    RETURNS BOOLEAN AS $$
    DECLARE
        spot_record RECORD;
    BEGIN
        -- Get spot details
        SELECT * INTO spot_record
        FROM public.event_spots 
        WHERE id = _spot_id AND comedian_id = _user_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Spot not found or not assigned to user';
        END IF;
        
        -- Check if spot is still pending
        IF spot_record.confirmation_status != 'pending' THEN
            RAISE EXCEPTION 'Spot is no longer pending confirmation';
        END IF;
        
        -- Update spot to declined and clear assignment
        UPDATE public.event_spots 
        SET confirmation_status = 'declined',
            declined_at = now(),
            comedian_id = NULL,
            is_filled = false
        WHERE id = _spot_id;
        
        RETURN TRUE;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Create function to check for expired confirmations
    CREATE OR REPLACE FUNCTION check_expired_spot_confirmations()
    RETURNS INTEGER AS $$
    DECLARE
        updated_count INTEGER;
    BEGIN
        -- Update spots that have passed their confirmation deadline
        UPDATE public.event_spots 
        SET confirmation_status = 'expired'
        WHERE confirmation_status = 'pending' 
        AND confirmation_deadline IS NOT NULL 
        AND confirmation_deadline < now();
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RETURN updated_count;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    """
    
    result = run_mcp_command('mcp__supabase__execute', {
        'sql': function_sql
    })
    
    if result:
        print("✅ Spot confirmation functions created successfully")
    else:
        print("❌ Failed to create spot confirmation functions")
    
    # Grant permissions
    print("\n📝 Granting permissions...")
    
    permissions_sql = """
    GRANT EXECUTE ON FUNCTION confirm_spot(UUID, UUID) TO authenticated;
    GRANT EXECUTE ON FUNCTION decline_spot(UUID, UUID) TO authenticated;
    GRANT EXECUTE ON FUNCTION check_expired_spot_confirmations() TO authenticated;
    """
    
    result = run_mcp_command('mcp__supabase__execute', {
        'sql': permissions_sql
    })
    
    if result:
        print("✅ Permissions granted successfully")
    else:
        print("❌ Failed to grant permissions")
    
    # Verify the changes
    print("\n🔍 Verifying migrations were applied...")
    
    result = run_mcp_command('mcp__supabase__query', {
        'sql': """
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'event_spots' AND table_schema = 'public'
        AND column_name IN ('confirmation_status', 'confirmation_deadline', 'confirmed_at', 'declined_at')
        ORDER BY column_name;
        """
    })
    
    if result and len(result.get('data', [])) >= 4:
        print("✅ All confirmation fields are present:")
        for row in result.get('data', []):
            print(f"  - {row['column_name']}: {row['data_type']}")
        return True
    else:
        print("❌ Some confirmation fields are missing")
        return False

if __name__ == "__main__":
    success = apply_migrations()
    if success:
        print("\n🎉 Spot confirmation migrations applied successfully!")
        sys.exit(0)
    else:
        print("\n❌ Migration process failed")
        sys.exit(1)