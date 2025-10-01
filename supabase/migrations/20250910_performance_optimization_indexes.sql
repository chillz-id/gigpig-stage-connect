-- Stand Up Sydney Performance Optimization Migration
-- Migration: Add critical performance indexes for high-traffic queries
-- Description: Implements comprehensive indexing strategy based on database analysis
-- Author: Database Administrator Agent  
-- Date: 2025-09-10
-- Analysis Summary: 18 tables analyzed, current low data volumes but preparing for scale

-- =====================================
-- CRITICAL PERFORMANCE INDEXES - PRIORITY 1
-- =====================================
-- These indexes address the most common query patterns in the application

-- USER AUTHENTICATION & PROFILE SYSTEM
-- Profile email lookups for authentication and user search
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
-- User role queries for authorization checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
-- Profile verification status for filtering verified users
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified);

-- EVENT MANAGEMENT SYSTEM  
-- Promoter's event dashboard queries
CREATE INDEX IF NOT EXISTS idx_events_promoter_id ON events(promoter_id);
-- Date-based event filtering (upcoming, past events)
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
-- Event status filtering (open, closed, completed)
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
-- Venue-based queries for scheduling conflicts
CREATE INDEX IF NOT EXISTS idx_events_venue ON events(venue);
-- Event type filtering
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);

-- APPLICATION MANAGEMENT SYSTEM
-- Comedian's application history
CREATE INDEX IF NOT EXISTS idx_applications_comedian_id ON applications(comedian_id);
-- Event's application list
CREATE INDEX IF NOT EXISTS idx_applications_event_id ON applications(event_id);
-- Application status filtering
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
-- Chronological application sorting
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at);

-- COMMUNICATION SYSTEM
-- User notification queries (most frequent query pattern)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
-- Unread notification filtering
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
-- Notification ordering by creation time
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
-- Notification type filtering
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- FINANCIAL SYSTEM
-- Promoter billing queries
CREATE INDEX IF NOT EXISTS idx_invoices_promoter_id ON invoices(promoter_id);
-- Comedian payment queries
CREATE INDEX IF NOT EXISTS idx_invoices_comedian_id ON invoices(comedian_id);
-- Invoice status filtering (draft, sent, paid)
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
-- Due date tracking for reminders
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
-- Invoice number lookups
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

-- =====================================
-- REPUTATION & RECOMMENDATION SYSTEM
-- =====================================

-- Voucher lookup for giving recommendations
CREATE INDEX IF NOT EXISTS idx_vouches_voucher_id ON vouches(voucher_id);
-- Vouchee lookup for receiving recommendations  
CREATE INDEX IF NOT EXISTS idx_vouches_vouchee_id ON vouches(vouchee_id);
-- Event-specific vouches
CREATE INDEX IF NOT EXISTS idx_vouches_event_id ON vouches(event_id);
-- Vouch creation time for recent activity
CREATE INDEX IF NOT EXISTS idx_vouches_created_at ON vouches(created_at);

-- =====================================
-- MESSAGING SYSTEM
-- =====================================

-- Sender's message history
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
-- Recipient's inbox queries
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
-- Message read status
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);
-- Message chronological ordering
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- =====================================
-- SPOT MANAGEMENT SYSTEM
-- =====================================

-- Event spot assignments
CREATE INDEX IF NOT EXISTS idx_spot_assignments_event_id ON spot_assignments(event_id);
-- Comedian spot assignments
CREATE INDEX IF NOT EXISTS idx_spot_assignments_comedian_id ON spot_assignments(comedian_id);
-- Spot confirmation lookups
CREATE INDEX IF NOT EXISTS idx_spot_confirmations_assignment_id ON spot_confirmations(assignment_id);
-- Spot confirmation deadlines
CREATE INDEX IF NOT EXISTS idx_spot_confirmations_deadline ON spot_confirmations(deadline);

-- =====================================
-- INVOICE DETAIL SYSTEM
-- =====================================

-- Invoice line items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
-- Invoice recipients
CREATE INDEX IF NOT EXISTS idx_invoice_recipients_invoice_id ON invoice_recipients(invoice_id);
-- Payment tracking
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);

-- =====================================
-- TICKET SALES & INTEGRATION SYSTEM
-- =====================================

-- Event ticket sales
CREATE INDEX IF NOT EXISTS idx_ticket_sales_event_id ON ticket_sales(event_id);
-- Platform-based sales queries
CREATE INDEX IF NOT EXISTS idx_ticket_sales_platform ON ticket_sales(platform);
-- Sales date filtering
CREATE INDEX IF NOT EXISTS idx_ticket_sales_sale_date ON ticket_sales(sale_date);

-- =====================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =====================================
-- These indexes support common multi-column query patterns

-- Event discovery: open events by date range
CREATE INDEX IF NOT EXISTS idx_events_status_date ON events(status, event_date);
-- Event discovery: open events by location and date
CREATE INDEX IF NOT EXISTS idx_events_status_venue_date ON events(status, venue, event_date);
-- Comedian application status tracking
CREATE INDEX IF NOT EXISTS idx_applications_comedian_status ON applications(comedian_id, status);
-- Event application summary
CREATE INDEX IF NOT EXISTS idx_applications_event_status ON applications(event_id, status);
-- User notification management (unread count, recent notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read_at);
-- User notification by type and status
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_read ON notifications(user_id, type, read_at);
-- Invoice management by promoter and status
CREATE INDEX IF NOT EXISTS idx_invoices_promoter_status ON invoices(promoter_id, status);
-- Profile user segmentation
CREATE INDEX IF NOT EXISTS idx_profiles_verified_experience ON profiles(is_verified, years_experience);

-- =====================================
-- AGENCY MANAGEMENT SYSTEM
-- =====================================

-- Agency lookups
CREATE INDEX IF NOT EXISTS idx_agencies_owner_id ON agencies(owner_id);
CREATE INDEX IF NOT EXISTS idx_agencies_status ON agencies(status);
CREATE INDEX IF NOT EXISTS idx_agencies_agency_type ON agencies(agency_type);

-- =====================================
-- TASK MANAGEMENT SYSTEM  
-- =====================================

-- User task queries
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
-- Task status filtering
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
-- Task due date tracking
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
-- Task creation time
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- =====================================
-- CUSTOMER & ANALYTICS SYSTEM
-- =====================================

-- Customer email lookups
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
-- Customer marketing preferences
CREATE INDEX IF NOT EXISTS idx_customers_marketing_opt_in ON customers(marketing_opt_in);
-- Customer creation date for cohort analysis
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- =====================================
-- JSONB INDEXES FOR METADATA QUERIES
-- =====================================
-- GIN indexes for JSONB columns that are frequently queried

-- Profile custom show types
CREATE INDEX IF NOT EXISTS idx_profiles_custom_show_types ON profiles USING GIN(custom_show_types);
-- Event co-promoter relationships
CREATE INDEX IF NOT EXISTS idx_events_co_promoter_ids ON events USING GIN(co_promoter_ids);
-- Notification data payloads
CREATE INDEX IF NOT EXISTS idx_notifications_data ON notifications USING GIN(data);

-- =====================================
-- PARTIAL INDEXES FOR EFFICIENCY
-- =====================================
-- Indexes that only include relevant subset of rows

-- Only index unread notifications (most common query)
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
    ON notifications(user_id, created_at) 
    WHERE read_at IS NULL;

-- Only index open events (most frequent status query)
CREATE INDEX IF NOT EXISTS idx_events_open 
    ON events(event_date, venue) 
    WHERE status = 'open';

-- Only index pending applications
CREATE INDEX IF NOT EXISTS idx_applications_pending 
    ON applications(event_id, applied_at) 
    WHERE status = 'pending';

-- Only index unpaid invoices
CREATE INDEX IF NOT EXISTS idx_invoices_unpaid 
    ON invoices(promoter_id, due_date) 
    WHERE status IN ('draft', 'sent');

-- =====================================
-- PERFORMANCE MONITORING SETUP
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
-- MIGRATION VALIDATION
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

-- Add comment for documentation
COMMENT ON FUNCTION validate_performance_indexes() IS 
'Validates that critical performance indexes have been created successfully. Run after migration to verify installation.';

-- =====================================
-- MIGRATION COMPLETION LOG
-- =====================================

-- Log successful completion
DO $$
BEGIN
    RAISE NOTICE 'Performance Optimization Migration Completed: %', NOW();
    RAISE NOTICE 'Created % indexes for Stand Up Sydney database', 
        (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%');
END $$;