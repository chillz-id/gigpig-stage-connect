-- Stand Up Sydney Performance Optimization Indexes
-- This file contains the critical performance indexes for the Stand Up Sydney database
-- Execute these statements in the Supabase SQL Editor for optimal performance

-- =====================================
-- CRITICAL PERFORMANCE INDEXES - PRIORITY 1
-- =====================================

-- USER AUTHENTICATION & PROFILE SYSTEM
-- Profile email lookups for authentication and user search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email ON profiles(email);
-- Profile verification status for filtering verified users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified);

-- EVENT MANAGEMENT SYSTEM  
-- Promoter's event dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_promoter_id ON events(promoter_id);
-- Date-based event filtering (upcoming, past events)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_event_date ON events(event_date);
-- Event status filtering (open, closed, completed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_status ON events(status);

-- APPLICATION MANAGEMENT SYSTEM
-- Comedian's application history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_comedian_id ON applications(comedian_id);
-- Event's application list
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_event_id ON applications(event_id);
-- Application status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_status ON applications(status);

-- COMMUNICATION SYSTEM
-- User notification queries (most frequent query pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
-- Unread notification filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
-- Notification ordering by creation time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- FINANCIAL SYSTEM
-- Promoter billing queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_promoter_id ON invoices(promoter_id);
-- Comedian payment queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_comedian_id ON invoices(comedian_id);
-- Invoice status filtering (draft, sent, paid)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_status ON invoices(status);

-- =====================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =====================================

-- Event discovery: open events by date range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_status_date ON events(status, event_date);
-- Comedian application status tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_comedian_status ON applications(comedian_id, status);
-- User notification management (unread count, recent notifications)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read_at);

-- =====================================
-- PARTIAL INDEXES FOR EFFICIENCY
-- =====================================

-- Only index unread notifications (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread 
    ON notifications(user_id, created_at) 
    WHERE read_at IS NULL;

-- Only index open events (most frequent status query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_open 
    ON events(event_date) 
    WHERE status = 'open';

-- Only index pending applications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_pending 
    ON applications(event_id, applied_at) 
    WHERE status = 'pending';

-- =====================================
-- PERFORMANCE MONITORING VIEWS
-- =====================================

-- Create view for index usage monitoring
CREATE OR REPLACE VIEW performance_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Create view for table access patterns
CREATE OR REPLACE VIEW performance_table_usage AS
SELECT 
    schemaname,
    tablename,
    seq_scan as sequential_scans,
    seq_tup_read as sequential_tuples_read,
    idx_scan as index_scans,
    idx_tup_fetch as index_tuples_fetched,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan + idx_scan DESC;

-- Grant permissions for monitoring views
GRANT SELECT ON performance_index_usage TO authenticated;
GRANT SELECT ON performance_table_usage TO authenticated;

-- =====================================
-- VALIDATION FUNCTION
-- =====================================

-- Function to validate index creation
CREATE OR REPLACE FUNCTION validate_performance_indexes()
RETURNS TABLE(index_name text, table_name text, status text)
LANGUAGE plpgsql
AS $$
DECLARE
    expected_indexes text[] := ARRAY[
        'idx_profiles_email',
        'idx_events_promoter_id', 
        'idx_events_event_date',
        'idx_applications_comedian_id',
        'idx_notifications_user_id',
        'idx_invoices_promoter_id'
    ];
    idx_name text;
    idx_exists boolean;
BEGIN
    FOREACH idx_name IN ARRAY expected_indexes
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = idx_name AND schemaname = 'public'
        ) INTO idx_exists;
        
        RETURN QUERY SELECT 
            idx_name,
            COALESCE(
                (SELECT tablename FROM pg_indexes 
                 WHERE indexname = idx_name AND schemaname = 'public' LIMIT 1),
                'unknown'
            ),
            CASE WHEN idx_exists THEN 'EXISTS' ELSE 'MISSING' END;
    END LOOP;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_performance_indexes() TO authenticated;

-- =====================================
-- COMPLETION VERIFICATION
-- =====================================

-- Run validation to check created indexes
SELECT * FROM validate_performance_indexes();

-- Show index usage statistics
SELECT 
    'Created ' || COUNT(*) || ' performance indexes for Stand Up Sydney' as summary
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';