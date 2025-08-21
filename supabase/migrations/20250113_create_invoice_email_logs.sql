-- Create invoice email logs table for tracking bulk email operations
CREATE TABLE IF NOT EXISTS invoice_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  recipients TEXT[] NOT NULL DEFAULT '{}',
  cc TEXT[] DEFAULT '{}',
  bcc TEXT[] DEFAULT '{}',
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_invoice_email_logs_invoice_id ON invoice_email_logs(invoice_id);
CREATE INDEX idx_invoice_email_logs_sent_at ON invoice_email_logs(sent_at);
CREATE INDEX idx_invoice_email_logs_status ON invoice_email_logs(status);

-- Enable RLS
ALTER TABLE invoice_email_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view email logs for their own invoices"
  ON invoice_email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_email_logs.invoice_id
      AND (
        invoices.promoter_id = auth.uid()
        OR invoices.comedian_id = auth.uid()
        OR invoices.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Service role can manage email logs"
  ON invoice_email_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON invoice_email_logs TO authenticated;
GRANT ALL ON invoice_email_logs TO service_role;

-- Add comment
COMMENT ON TABLE invoice_email_logs IS 'Tracks email sending history for invoices, including bulk operations';