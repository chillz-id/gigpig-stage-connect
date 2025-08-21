-- Add data integrity functions and tables

-- Create tables for data integrity tracking
CREATE TABLE IF NOT EXISTS data_integrity_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text, -- Can be 'all' for system-wide checks
  check_type text NOT NULL CHECK (check_type IN ('validation', 'consistency', 'orphaned', 'duplicate')),
  status text NOT NULL CHECK (status IN ('passed', 'warning', 'failed')),
  issues jsonb DEFAULT '[]'::jsonb,
  run_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create table for data operation logs
CREATE TABLE IF NOT EXISTS data_operations_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create table for data backups
CREATE TABLE IF NOT EXISTS data_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  backup_type text NOT NULL CHECK (backup_type IN ('event', 'full', 'table')),
  data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  restored_at timestamp with time zone,
  restored_by uuid REFERENCES profiles(id)
);

-- Function to execute dynamic integrity queries safely
CREATE OR REPLACE FUNCTION execute_integrity_query(query_text text)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  -- Security check: only allow SELECT statements
  IF NOT (UPPER(TRIM(query_text)) LIKE 'SELECT%') THEN
    RAISE EXCEPTION 'Only SELECT statements are allowed in integrity checks';
  END IF;
  
  -- Execute the query and return as jsonb
  EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query_text || ') t' INTO result;
  
  RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error executing integrity query: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to recalculate event totals
CREATE OR REPLACE FUNCTION recalculate_event_totals()
RETURNS jsonb AS $$
DECLARE
  updated_events jsonb;
BEGIN
  -- Update all event totals based on actual ticket sales
  WITH event_calculations AS (
    SELECT 
      e.id,
      COALESCE(SUM(ts.ticket_quantity), 0) as total_tickets,
      COALESCE(SUM(ts.total_amount), 0) as total_revenue
    FROM events e
    LEFT JOIN ticket_sales ts ON e.id = ts.event_id
    GROUP BY e.id
  )
  UPDATE events 
  SET 
    total_tickets_sold = ec.total_tickets,
    total_gross_sales = ec.total_revenue,
    updated_at = now()
  FROM event_calculations ec
  WHERE events.id = ec.id
    AND (
      COALESCE(events.total_tickets_sold, 0) != ec.total_tickets
      OR ABS(COALESCE(events.total_gross_sales, 0) - ec.total_revenue) > 0.01
    )
  RETURNING jsonb_build_object(
    'id', events.id,
    'name', events.name,
    'old_tickets', events.total_tickets_sold,
    'new_tickets', ec.total_tickets,
    'old_revenue', events.total_gross_sales,
    'new_revenue', ec.total_revenue
  ) INTO updated_events;

  RETURN COALESCE(updated_events, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate platform totals
CREATE OR REPLACE FUNCTION recalculate_platform_totals()
RETURNS jsonb AS $$
DECLARE
  updated_platforms jsonb;
BEGIN
  -- Update all platform totals based on actual ticket sales
  WITH platform_calculations AS (
    SELECT 
      tp.id,
      tp.event_id,
      tp.platform,
      COALESCE(SUM(ts.ticket_quantity), 0) as total_tickets,
      COALESCE(SUM(ts.total_amount), 0) as total_revenue
    FROM ticket_platforms tp
    LEFT JOIN ticket_sales ts ON tp.event_id = ts.event_id AND tp.platform = ts.platform
    GROUP BY tp.id, tp.event_id, tp.platform
  )
  UPDATE ticket_platforms 
  SET 
    tickets_sold = pc.total_tickets,
    gross_sales = pc.total_revenue,
    last_sync = now()
  FROM platform_calculations pc
  WHERE ticket_platforms.id = pc.id
    AND (
      COALESCE(ticket_platforms.tickets_sold, 0) != pc.total_tickets
      OR ABS(COALESCE(ticket_platforms.gross_sales, 0) - pc.total_revenue) > 0.01
    )
  RETURNING jsonb_build_object(
    'id', ticket_platforms.id,
    'platform', ticket_platforms.platform,
    'event_id', ticket_platforms.event_id,
    'old_tickets', ticket_platforms.tickets_sold,
    'new_tickets', pc.total_tickets,
    'old_revenue', ticket_platforms.gross_sales,
    'new_revenue', pc.total_revenue
  ) INTO updated_platforms;

  RETURN COALESCE(updated_platforms, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Function to detect and clean duplicate ticket sales
CREATE OR REPLACE FUNCTION detect_duplicate_sales()
RETURNS TABLE(
  duplicate_group text,
  sale_ids uuid[],
  customer_email text,
  event_id uuid,
  total_amount numeric,
  purchase_dates timestamp with time zone[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CONCAT(ts.platform_order_id, '_', ts.platform) as duplicate_group,
    array_agg(ts.id) as sale_ids,
    ts.customer_email,
    ts.event_id,
    ts.total_amount,
    array_agg(ts.purchase_date) as purchase_dates
  FROM ticket_sales ts
  WHERE ts.platform_order_id IS NOT NULL 
    AND ts.platform_order_id != ''
  GROUP BY ts.platform_order_id, ts.platform, ts.customer_email, ts.event_id, ts.total_amount
  HAVING COUNT(*) > 1;
END;
$$ LANGUAGE plpgsql;

-- Function to safely remove duplicate sales (keeps the earliest one)
CREATE OR REPLACE FUNCTION remove_duplicate_sales(dry_run boolean DEFAULT true)
RETURNS jsonb AS $$
DECLARE
  removed_sales jsonb;
  duplicate_rec record;
  oldest_sale_id uuid;
BEGIN
  removed_sales := '[]'::jsonb;
  
  FOR duplicate_rec IN 
    SELECT * FROM detect_duplicate_sales()
  LOOP
    -- Find the oldest sale in this duplicate group
    SELECT id INTO oldest_sale_id
    FROM unnest(duplicate_rec.sale_ids, duplicate_rec.purchase_dates) AS u(sale_id, purchase_date)
    ORDER BY purchase_date ASC
    LIMIT 1;
    
    -- Remove all except the oldest
    IF NOT dry_run THEN
      DELETE FROM ticket_sales 
      WHERE id = ANY(duplicate_rec.sale_ids) 
        AND id != oldest_sale_id;
    END IF;
    
    -- Add to results
    removed_sales := removed_sales || jsonb_build_object(
      'duplicate_group', duplicate_rec.duplicate_group,
      'kept_sale_id', oldest_sale_id,
      'removed_sale_ids', array_remove(duplicate_rec.sale_ids, oldest_sale_id),
      'customer_email', duplicate_rec.customer_email,
      'dry_run', dry_run
    );
  END LOOP;
  
  RETURN removed_sales;
END;
$$ LANGUAGE plpgsql;

-- Function to validate ticket sale data
CREATE OR REPLACE FUNCTION validate_ticket_sales_data()
RETURNS TABLE(
  validation_type text,
  issue_count bigint,
  affected_records uuid[]
) AS $$
BEGIN
  -- Negative amounts
  RETURN QUERY
  SELECT 
    'negative_amounts'::text,
    COUNT(*)::bigint,
    array_agg(id)
  FROM ticket_sales 
  WHERE total_amount < 0
  HAVING COUNT(*) > 0;
  
  -- Zero or negative quantities
  RETURN QUERY
  SELECT 
    'invalid_quantities'::text,
    COUNT(*)::bigint,
    array_agg(id)
  FROM ticket_sales 
  WHERE ticket_quantity <= 0
  HAVING COUNT(*) > 0;
  
  -- Missing customer information
  RETURN QUERY
  SELECT 
    'missing_customer_info'::text,
    COUNT(*)::bigint,
    array_agg(id)
  FROM ticket_sales 
  WHERE customer_name IS NULL 
     OR customer_name = '' 
     OR customer_email IS NULL 
     OR customer_email = ''
  HAVING COUNT(*) > 0;
  
  -- Invalid email formats
  RETURN QUERY
  SELECT 
    'invalid_email_format'::text,
    COUNT(*)::bigint,
    array_agg(id)
  FROM ticket_sales 
  WHERE customer_email IS NOT NULL 
    AND customer_email != ''
    AND customer_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  HAVING COUNT(*) > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to find orphaned records
CREATE OR REPLACE FUNCTION find_orphaned_records()
RETURNS TABLE(
  record_type text,
  orphan_count bigint,
  affected_records uuid[]
) AS $$
BEGIN
  -- Orphaned ticket sales
  RETURN QUERY
  SELECT 
    'ticket_sales'::text,
    COUNT(*)::bigint,
    array_agg(ts.id)
  FROM ticket_sales ts 
  LEFT JOIN events e ON ts.event_id = e.id 
  WHERE e.id IS NULL
  HAVING COUNT(*) > 0;
  
  -- Orphaned applications
  RETURN QUERY
  SELECT 
    'applications'::text,
    COUNT(*)::bigint,
    array_agg(a.id)
  FROM applications a 
  LEFT JOIN events e ON a.event_id = e.id 
  LEFT JOIN profiles p ON a.comedian_id = p.id 
  WHERE e.id IS NULL OR p.id IS NULL
  HAVING COUNT(*) > 0;
  
  -- Orphaned event spots
  RETURN QUERY
  SELECT 
    'event_spots'::text,
    COUNT(*)::bigint,
    array_agg(es.id)
  FROM event_spots es 
  LEFT JOIN events e ON es.event_id = e.id 
  WHERE e.id IS NULL
  HAVING COUNT(*) > 0;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_integrity_checks_event_id ON data_integrity_checks(event_id);
CREATE INDEX IF NOT EXISTS idx_data_integrity_checks_run_at ON data_integrity_checks(run_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_integrity_checks_status ON data_integrity_checks(status);
CREATE INDEX IF NOT EXISTS idx_data_integrity_checks_check_type ON data_integrity_checks(check_type);

CREATE INDEX IF NOT EXISTS idx_data_operations_log_operation ON data_operations_log(operation);
CREATE INDEX IF NOT EXISTS idx_data_operations_log_created_at ON data_operations_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_backups_event_id ON data_backups(event_id);
CREATE INDEX IF NOT EXISTS idx_data_backups_backup_type ON data_backups(backup_type);
CREATE INDEX IF NOT EXISTS idx_data_backups_created_at ON data_backups(created_at DESC);

-- RLS policies for data integrity tables
ALTER TABLE data_integrity_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_operations_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_backups ENABLE ROW LEVEL SECURITY;

-- Admin access to all data integrity features
CREATE POLICY "Admin access to data integrity checks" ON data_integrity_checks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin access to data operations log" ON data_operations_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin access to data backups" ON data_backups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Promoter access to their event data
CREATE POLICY "Promoter access to their event integrity checks" ON data_integrity_checks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN events e ON e.created_by = p.id
      WHERE p.id = auth.uid()
      AND p.role = 'promoter'
      AND (data_integrity_checks.event_id = e.id::text OR data_integrity_checks.event_id = 'all')
    )
  );

-- Function to run scheduled integrity checks
CREATE OR REPLACE FUNCTION run_scheduled_integrity_checks()
RETURNS void AS $$
DECLARE
  v_event record;
  v_check_result jsonb;
BEGIN
  -- Run integrity checks for all active events
  FOR v_event IN 
    SELECT id
    FROM events 
    WHERE date >= CURRENT_DATE - INTERVAL '7 days'
    AND date <= CURRENT_DATE + INTERVAL '30 days'
  LOOP
    -- Run basic validation checks
    INSERT INTO data_integrity_checks (event_id, check_type, status, issues, run_at)
    SELECT 
      v_event.id::text,
      'validation',
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM validate_ticket_sales_data() 
          WHERE validation_type IN ('negative_amounts', 'invalid_quantities')
        ) THEN 'failed'
        WHEN EXISTS (
          SELECT 1 FROM validate_ticket_sales_data()
        ) THEN 'warning'
        ELSE 'passed'
      END,
      jsonb_agg(
        jsonb_build_object(
          'type', validation_type,
          'count', issue_count,
          'affected_records', affected_records
        )
      ),
      now()
    FROM validate_ticket_sales_data()
    WHERE issue_count > 0;
  END LOOP;
  
  -- Log the scheduled run
  INSERT INTO data_operations_log (operation, metadata)
  VALUES ('scheduled_integrity_check', jsonb_build_object(
    'events_checked', (SELECT COUNT(*) FROM events 
                      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
                      AND date <= CURRENT_DATE + INTERVAL '30 days'),
    'run_at', now()
  ));
END;
$$ LANGUAGE plpgsql;