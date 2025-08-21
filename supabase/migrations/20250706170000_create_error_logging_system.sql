-- Error Logging and Monitoring System
-- Creates comprehensive error tracking and analysis infrastructure

-- Create error severity enum
CREATE TYPE error_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Create error category enum
CREATE TYPE error_category AS ENUM (
    'api_error', 'validation_error', 'network_error', 'authentication_error',
    'authorization_error', 'database_error', 'file_upload_error', 'payment_error',
    'integration_error', 'ui_error', 'performance_error', 'security_error', 'unknown_error'
);

-- Error logs table
CREATE TABLE public.error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT now(),
    severity error_severity NOT NULL,
    category error_category NOT NULL,
    message TEXT NOT NULL,
    stack TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_agent TEXT,
    url TEXT,
    component TEXT,
    action TEXT,
    metadata JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Error monitoring rules table
CREATE TABLE public.error_monitoring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category error_category,
    severity error_severity,
    threshold_count INTEGER DEFAULT 5,
    threshold_window_minutes INTEGER DEFAULT 60,
    alert_channels TEXT[] DEFAULT '{}', -- email, slack, etc.
    alert_recipients TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Error alerts table
CREATE TABLE public.error_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES public.error_monitoring_rules(id) ON DELETE CASCADE,
    triggered_at TIMESTAMPTZ DEFAULT now(),
    error_count INTEGER NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    alert_sent BOOLEAN DEFAULT FALSE,
    alert_sent_at TIMESTAMPTZ,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'
);

-- Performance metrics table
CREATE TABLE public.performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    page_url TEXT,
    load_time_ms INTEGER,
    render_time_ms INTEGER,
    api_response_time_ms INTEGER,
    memory_usage_mb DECIMAL(10,2),
    cache_hit_rate DECIMAL(5,4),
    error_count INTEGER DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT now(),
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    metadata JSONB DEFAULT '{}'
);

-- System health metrics table
CREATE TABLE public.system_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,6) NOT NULL,
    metric_unit TEXT,
    tags JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT now(),
    source TEXT DEFAULT 'frontend'
);

-- Enable RLS on all tables
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_monitoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for error_logs
CREATE POLICY "Users can view their own error logs" ON public.error_logs FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage error logs" ON public.error_logs FOR ALL TO service_role 
USING (true);

CREATE POLICY "Admins can manage all error logs" ON public.error_logs FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for error_monitoring_rules
CREATE POLICY "Admins can manage monitoring rules" ON public.error_monitoring_rules FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "All users can view active rules" ON public.error_monitoring_rules FOR SELECT TO authenticated 
USING (is_active = true);

-- RLS Policies for error_alerts
CREATE POLICY "Admins can manage alerts" ON public.error_alerts FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for performance_metrics
CREATE POLICY "Users can view their own metrics" ON public.performance_metrics FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own metrics" ON public.performance_metrics FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage all metrics" ON public.performance_metrics FOR ALL TO service_role 
USING (true);

CREATE POLICY "Admins can view all metrics" ON public.performance_metrics FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for system_health_metrics
CREATE POLICY "Service role can manage health metrics" ON public.system_health_metrics FOR ALL TO service_role 
USING (true);

CREATE POLICY "Admins can view health metrics" ON public.system_health_metrics FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_error_logs_timestamp ON public.error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_error_logs_category ON public.error_logs(category);
CREATE INDEX idx_error_logs_resolved ON public.error_logs(resolved) WHERE resolved = false;
CREATE INDEX idx_error_logs_component_action ON public.error_logs(component, action);

CREATE INDEX idx_error_monitoring_rules_active ON public.error_monitoring_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_error_monitoring_rules_category ON public.error_monitoring_rules(category);

CREATE INDEX idx_error_alerts_triggered_at ON public.error_alerts(triggered_at DESC);
CREATE INDEX idx_error_alerts_rule_id ON public.error_alerts(rule_id);
CREATE INDEX idx_error_alerts_resolved ON public.error_alerts(resolved) WHERE resolved = false;

CREATE INDEX idx_performance_metrics_timestamp ON public.performance_metrics(timestamp DESC);
CREATE INDEX idx_performance_metrics_user_id ON public.performance_metrics(user_id);
CREATE INDEX idx_performance_metrics_page_url ON public.performance_metrics(page_url);

CREATE INDEX idx_system_health_metrics_timestamp ON public.system_health_metrics(timestamp DESC);
CREATE INDEX idx_system_health_metrics_name ON public.system_health_metrics(metric_name);

-- Create triggers for updated_at columns
CREATE TRIGGER update_error_monitoring_rules_updated_at 
    BEFORE UPDATE ON public.error_monitoring_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get error statistics
CREATE OR REPLACE FUNCTION get_error_statistics(
    _start_date TIMESTAMPTZ DEFAULT now() - interval '24 hours',
    _end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE(
    total_errors BIGINT,
    errors_by_severity JSONB,
    errors_by_category JSONB,
    error_rate_trend JSONB,
    most_common_errors JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH error_stats AS (
        SELECT 
            COUNT(*) as total,
            jsonb_object_agg(severity, severity_count) as by_severity,
            jsonb_object_agg(category, category_count) as by_category
        FROM (
            SELECT 
                severity,
                category,
                COUNT(*) OVER (PARTITION BY severity) as severity_count,
                COUNT(*) OVER (PARTITION BY category) as category_count
            FROM public.error_logs 
            WHERE timestamp BETWEEN _start_date AND _end_date
        ) t
        GROUP BY severity, category
    ),
    hourly_trend AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'hour', date_trunc('hour', timestamp),
                'count', count
            ) ORDER BY date_trunc('hour', timestamp)
        ) as trend
        FROM (
            SELECT 
                date_trunc('hour', timestamp) as timestamp,
                COUNT(*) as count
            FROM public.error_logs 
            WHERE timestamp BETWEEN _start_date AND _end_date
            GROUP BY date_trunc('hour', timestamp)
        ) hourly_counts
    ),
    common_errors AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'message', message,
                'count', count
            ) ORDER BY count DESC
        ) as common
        FROM (
            SELECT 
                message,
                COUNT(*) as count
            FROM public.error_logs 
            WHERE timestamp BETWEEN _start_date AND _end_date
            GROUP BY message
            ORDER BY COUNT(*) DESC
            LIMIT 10
        ) top_errors
    )
    SELECT 
        COALESCE(es.total, 0)::BIGINT,
        COALESCE(es.by_severity, '{}'::jsonb),
        COALESCE(es.by_category, '{}'::jsonb),
        COALESCE(ht.trend, '[]'::jsonb),
        COALESCE(ce.common, '[]'::jsonb)
    FROM error_stats es
    CROSS JOIN hourly_trend ht
    CROSS JOIN common_errors ce;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to check error monitoring rules
CREATE OR REPLACE FUNCTION check_error_monitoring_rules()
RETURNS INTEGER AS $$
DECLARE
    rule_record RECORD;
    error_count INTEGER;
    alert_id UUID;
    alerts_created INTEGER := 0;
BEGIN
    FOR rule_record IN 
        SELECT * FROM public.error_monitoring_rules 
        WHERE is_active = true
    LOOP
        -- Count errors matching the rule criteria
        SELECT COUNT(*) INTO error_count
        FROM public.error_logs
        WHERE 
            timestamp >= now() - (rule_record.threshold_window_minutes || ' minutes')::interval
            AND (rule_record.category IS NULL OR category = rule_record.category)
            AND (rule_record.severity IS NULL OR severity = rule_record.severity);
        
        -- Check if threshold is exceeded
        IF error_count >= rule_record.threshold_count THEN
            -- Check if alert already exists for this window
            IF NOT EXISTS (
                SELECT 1 FROM public.error_alerts
                WHERE 
                    rule_id = rule_record.id
                    AND window_start >= now() - (rule_record.threshold_window_minutes || ' minutes')::interval
                    AND resolved = false
            ) THEN
                -- Create new alert
                INSERT INTO public.error_alerts (
                    rule_id,
                    error_count,
                    window_start,
                    window_end,
                    metadata
                ) VALUES (
                    rule_record.id,
                    error_count,
                    now() - (rule_record.threshold_window_minutes || ' minutes')::interval,
                    now(),
                    jsonb_build_object(
                        'rule_name', rule_record.name,
                        'threshold', rule_record.threshold_count,
                        'window_minutes', rule_record.threshold_window_minutes
                    )
                ) RETURNING id INTO alert_id;
                
                alerts_created := alerts_created + 1;
            END IF;
        END IF;
    END LOOP;
    
    RETURN alerts_created;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to cleanup old error logs
CREATE OR REPLACE FUNCTION cleanup_old_error_logs(_days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.error_logs 
    WHERE timestamp < now() - (_days_to_keep || ' days')::interval
    AND resolved = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to get performance summary
CREATE OR REPLACE FUNCTION get_performance_summary(
    _start_date TIMESTAMPTZ DEFAULT now() - interval '24 hours',
    _end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE(
    avg_load_time DECIMAL,
    avg_render_time DECIMAL,
    avg_api_response_time DECIMAL,
    avg_memory_usage DECIMAL,
    avg_cache_hit_rate DECIMAL,
    total_sessions BIGINT,
    performance_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(load_time_ms), 2) as avg_load_time,
        ROUND(AVG(render_time_ms), 2) as avg_render_time,
        ROUND(AVG(api_response_time_ms), 2) as avg_api_response_time,
        ROUND(AVG(memory_usage_mb), 2) as avg_memory_usage,
        ROUND(AVG(cache_hit_rate), 4) as avg_cache_hit_rate,
        COUNT(DISTINCT session_id) as total_sessions,
        -- Simple performance score calculation (0-100)
        GREATEST(0, LEAST(100, 
            100 - (AVG(load_time_ms) / 50) - (AVG(render_time_ms) / 20) - (AVG(api_response_time_ms) / 100)
        )) as performance_score
    FROM public.performance_metrics
    WHERE timestamp BETWEEN _start_date AND _end_date;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Insert default monitoring rules
INSERT INTO public.error_monitoring_rules (name, description, severity, threshold_count, threshold_window_minutes, alert_channels) VALUES
('Critical Errors', 'Monitor for any critical errors', 'critical', 1, 5, ARRAY['email', 'slack']),
('High Error Rate', 'Monitor for high frequency of errors', null, 10, 10, ARRAY['email']),
('Authentication Failures', 'Monitor authentication/authorization errors', null, 5, 15, ARRAY['email']),
('Payment Errors', 'Monitor payment processing errors', null, 3, 30, ARRAY['email', 'slack']),
('API Errors', 'Monitor API integration errors', null, 8, 20, ARRAY['email']);

-- Grant necessary permissions
GRANT ALL ON public.error_logs TO authenticated;
GRANT ALL ON public.error_monitoring_rules TO authenticated;
GRANT ALL ON public.error_alerts TO authenticated;
GRANT ALL ON public.performance_metrics TO authenticated;
GRANT ALL ON public.system_health_metrics TO authenticated;

-- Grant service role permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;