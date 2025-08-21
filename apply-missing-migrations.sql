-- ============================================
-- APPLY MISSING MIGRATIONS FOR STAND UP SYDNEY
-- ============================================
-- Run this script in your Supabase SQL Editor to create the missing tables

-- First, let's check what's missing
SELECT 'tasks' as table_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') as exists
UNION ALL
SELECT 'tours', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tours')
UNION ALL  
SELECT 'flights', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flights');

-- Now run the missing migrations:
-- You need to copy and run the contents of these files in order:
-- 1. /root/agents/supabase/migrations/20250706140000_create_task_management_system.sql
-- 2. /root/agents/supabase/migrations/20250706141000_create_flight_tracking_system.sql
-- 3. /root/agents/supabase/migrations/20250706143000_create_comprehensive_touring_system.sql