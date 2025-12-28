-- Migration: Add atomic invoice number sequence
-- Purpose: Generate collision-safe invoice numbers with format GIG-XXXXXXXX

-- Create atomic sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq
  START WITH 1
  INCREMENT BY 1
  NO MAXVALUE
  CACHE 1;

-- Function to get next invoice number atomically
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_val BIGINT;
BEGIN
  SELECT nextval('invoice_number_seq') INTO next_val;
  RETURN 'GIG-' || LPAD(next_val::TEXT, 8, '0');
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_next_invoice_number() TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION get_next_invoice_number() IS 'Generates platform-wide unique invoice numbers in format GIG-XXXXXXXX. Uses PostgreSQL SEQUENCE for atomic increment, preventing collision when multiple invoices are created simultaneously.';
