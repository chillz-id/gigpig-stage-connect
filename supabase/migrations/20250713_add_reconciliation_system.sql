-- Add reconciliation system tables and functions

-- Add reconciliation fields to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS reconciliation_status text DEFAULT 'healthy' CHECK (reconciliation_status IN ('healthy', 'warning', 'critical'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS last_reconciliation timestamp with time zone;

-- Add reconciliation fields to ticket_sales table
ALTER TABLE ticket_sales ADD COLUMN IF NOT EXISTS reconciliation_import boolean DEFAULT false;
ALTER TABLE ticket_sales ADD COLUMN IF NOT EXISTS reconciliation_corrected boolean DEFAULT false;
ALTER TABLE ticket_sales ADD COLUMN IF NOT EXISTS reconciliation_corrected_at timestamp with time zone;
ALTER TABLE ticket_sales ADD COLUMN IF NOT EXISTS manual_entry boolean DEFAULT false;
ALTER TABLE ticket_sales ADD COLUMN IF NOT EXISTS manual_adjustment boolean DEFAULT false;

-- Create reconciliation reports table
CREATE TABLE IF NOT EXISTS reconciliation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  platform text NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  status text NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  total_local_sales integer DEFAULT 0,
  total_platform_sales integer DEFAULT 0,
  total_local_revenue decimal(10, 2) DEFAULT 0,
  total_platform_revenue decimal(10, 2) DEFAULT 0,
  discrepancies_found integer DEFAULT 0,
  discrepancies_resolved integer DEFAULT 0,
  sync_health text CHECK (sync_health IN ('healthy', 'warning', 'critical')),
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create reconciliation discrepancies table
CREATE TABLE IF NOT EXISTS reconciliation_discrepancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES reconciliation_reports(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  platform text NOT NULL,
  type text NOT NULL CHECK (type IN ('missing_sale', 'amount_mismatch', 'duplicate_sale', 'data_inconsistency')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  local_data jsonb,
  platform_data jsonb,
  difference jsonb,
  detected_at timestamp with time zone NOT NULL,
  resolved_at timestamp with time zone,
  resolution text CHECK (resolution IN ('auto_corrected', 'manual_review', 'ignored', 'platform_updated')),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create reconciliation audit log table
CREATE TABLE IF NOT EXISTS reconciliation_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  action text NOT NULL,
  description text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_event_id ON reconciliation_reports(event_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_platform ON reconciliation_reports(platform);
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_start_time ON reconciliation_reports(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_status ON reconciliation_reports(status);

CREATE INDEX IF NOT EXISTS idx_reconciliation_discrepancies_report_id ON reconciliation_discrepancies(report_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_discrepancies_event_id ON reconciliation_discrepancies(event_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_discrepancies_resolved_at ON reconciliation_discrepancies(resolved_at);
CREATE INDEX IF NOT EXISTS idx_reconciliation_discrepancies_type ON reconciliation_discrepancies(type);
CREATE INDEX IF NOT EXISTS idx_reconciliation_discrepancies_severity ON reconciliation_discrepancies(severity);

CREATE INDEX IF NOT EXISTS idx_reconciliation_audit_log_event_id ON reconciliation_audit_log(event_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_audit_log_created_at ON reconciliation_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_sales_platform_order ON ticket_sales(platform, platform_order_id);
CREATE INDEX IF NOT EXISTS idx_ticket_sales_reconciliation ON ticket_sales(reconciliation_import, reconciliation_corrected);

-- RLS policies for reconciliation tables
ALTER TABLE reconciliation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_discrepancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin and promoter access to reconciliation data
CREATE POLICY "Admin and promoter access to reconciliation reports" ON reconciliation_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'promoter')
    )
  );

CREATE POLICY "Admin and promoter access to reconciliation discrepancies" ON reconciliation_discrepancies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'promoter')
    )
  );

CREATE POLICY "Admin and promoter access to reconciliation audit log" ON reconciliation_audit_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'promoter')
    )
  );

-- Function to calculate reconciliation health
CREATE OR REPLACE FUNCTION calculate_reconciliation_health(
  p_discrepancy_count integer,
  p_total_sales integer,
  p_revenue_diff numeric
)
RETURNS text AS $$
DECLARE
  v_discrepancy_rate numeric;
BEGIN
  IF p_total_sales = 0 THEN
    RETURN 'healthy';
  END IF;
  
  v_discrepancy_rate := p_discrepancy_count::numeric / p_total_sales::numeric;
  
  -- Critical if more than 10% discrepancy rate or significant revenue difference
  IF v_discrepancy_rate > 0.1 OR p_revenue_diff > 100 THEN
    RETURN 'critical';
  -- Warning if more than 5% discrepancy rate or moderate revenue difference
  ELSIF v_discrepancy_rate > 0.05 OR p_revenue_diff > 50 THEN
    RETURN 'warning';
  ELSE
    RETURN 'healthy';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create reconciliation report for daily scheduled runs
CREATE OR REPLACE FUNCTION schedule_daily_reconciliation()
RETURNS void AS $$
DECLARE
  v_event record;
  v_platform record;
BEGIN
  -- For each active event with ticket platforms
  FOR v_event IN 
    SELECT DISTINCT e.id
    FROM events e
    JOIN ticket_platforms tp ON tp.event_id = e.id
    WHERE e.date >= CURRENT_DATE - INTERVAL '7 days'
    AND e.date <= CURRENT_DATE + INTERVAL '30 days'
  LOOP
    -- Check if reconciliation was run today
    IF NOT EXISTS (
      SELECT 1 FROM reconciliation_reports
      WHERE event_id = v_event.id
      AND start_time >= CURRENT_DATE
    ) THEN
      -- Log the scheduled reconciliation
      INSERT INTO reconciliation_audit_log (event_id, action, description)
      VALUES (v_event.id, 'scheduled_reconciliation', 'Daily automated reconciliation initiated');
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a view for reconciliation dashboard
CREATE OR REPLACE VIEW reconciliation_dashboard AS
SELECT 
  e.id as event_id,
  e.name as event_name,
  e.date as event_date,
  e.reconciliation_status,
  e.last_reconciliation,
  COALESCE(rr.total_reports, 0) as total_reports,
  COALESCE(rr.avg_discrepancies, 0) as avg_discrepancies,
  COALESCE(rr.resolution_rate, 0) as resolution_rate,
  COALESCE(rd.unresolved_count, 0) as unresolved_discrepancies,
  COALESCE(rd.critical_count, 0) as critical_discrepancies
FROM events e
LEFT JOIN (
  SELECT 
    event_id,
    COUNT(*) as total_reports,
    AVG(discrepancies_found) as avg_discrepancies,
    CASE 
      WHEN SUM(discrepancies_found) = 0 THEN 1
      ELSE SUM(discrepancies_resolved)::numeric / SUM(discrepancies_found)::numeric
    END as resolution_rate
  FROM reconciliation_reports
  WHERE status = 'completed'
  GROUP BY event_id
) rr ON rr.event_id = e.id
LEFT JOIN (
  SELECT 
    event_id,
    COUNT(*) FILTER (WHERE resolved_at IS NULL) as unresolved_count,
    COUNT(*) FILTER (WHERE resolved_at IS NULL AND severity IN ('high', 'critical')) as critical_count
  FROM reconciliation_discrepancies
  GROUP BY event_id
) rd ON rd.event_id = e.id;