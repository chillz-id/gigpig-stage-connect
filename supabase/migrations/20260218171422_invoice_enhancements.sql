-- Invoice Form Enhancements Migration
-- Adds per-item GST treatment, deductions support, CC/BCC emails, and client profile reference

-- ============================================================================
-- Invoice Items: Per-line GST treatment and deductions
-- ============================================================================

-- Add GST treatment per line item
ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS gst_treatment TEXT DEFAULT 'no_gst'
CHECK (gst_treatment IN ('gst_included', 'gst_excluded', 'no_gst'));

-- Add deduction flag for line items
ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS is_deduction BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN invoice_items.gst_treatment IS 'Per-item GST: gst_included (total includes 10%), gst_excluded (10% added on top), no_gst (no GST applied)';
COMMENT ON COLUMN invoice_items.is_deduction IS 'If true, this is a deduction (negative amount) rather than a charge';

-- ============================================================================
-- Invoice Recipients: CC/BCC support
-- ============================================================================

-- Add CC emails array
ALTER TABLE invoice_recipients
ADD COLUMN IF NOT EXISTS cc_emails TEXT[] DEFAULT '{}';

-- Add BCC emails array
ALTER TABLE invoice_recipients
ADD COLUMN IF NOT EXISTS bcc_emails TEXT[] DEFAULT '{}';

COMMENT ON COLUMN invoice_recipients.cc_emails IS 'Array of email addresses to CC on invoice emails';
COMMENT ON COLUMN invoice_recipients.bcc_emails IS 'Array of email addresses to BCC on invoice emails';

-- ============================================================================
-- Invoices: Client profile reference
-- ============================================================================

-- Add client profile reference (links to directory_profiles)
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS client_profile_id UUID REFERENCES directory_profiles(id) ON DELETE SET NULL;

-- Add client profile type for display/categorization
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS client_profile_type TEXT;

-- Add client GST registration status (snapshot at invoice creation)
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS client_gst_registered BOOLEAN DEFAULT false;

-- Create index for client profile lookups
CREATE INDEX IF NOT EXISTS idx_invoices_client_profile_id ON invoices(client_profile_id);

COMMENT ON COLUMN invoices.client_profile_id IS 'Reference to directory_profile for the client';
COMMENT ON COLUMN invoices.client_profile_type IS 'Type of client: comedian, photographer, videographer, manager, organization, venue, custom';
COMMENT ON COLUMN invoices.client_gst_registered IS 'Snapshot of client GST registration at invoice creation time';

-- ============================================================================
-- Directory Profiles: Add invoice-related fields if not exist
-- ============================================================================

-- Ensure directory_profiles has ABN field in metadata (it uses metadata.financial.abn)
-- No schema change needed as metadata is JSONB

-- Add phone field if not exists (for client search)
ALTER TABLE directory_profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add address field if not exists
ALTER TABLE directory_profiles
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add ABN field directly (in addition to metadata)
ALTER TABLE directory_profiles
ADD COLUMN IF NOT EXISTS abn TEXT;

-- Add GST registered flag
ALTER TABLE directory_profiles
ADD COLUMN IF NOT EXISTS gst_registered BOOLEAN DEFAULT false;

COMMENT ON COLUMN directory_profiles.phone IS 'Contact phone number';
COMMENT ON COLUMN directory_profiles.address IS 'Business/mailing address';
COMMENT ON COLUMN directory_profiles.abn IS 'Australian Business Number';
COMMENT ON COLUMN directory_profiles.gst_registered IS 'Whether the entity is registered for GST';
