-- Add bank details columns to invoices table for Payment Details section in PDFs

-- Add account name (account holder name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'sender_bank_name'
  ) THEN
    ALTER TABLE invoices ADD COLUMN sender_bank_name text;
  END IF;
END $$;

-- Add BSB number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'sender_bank_bsb'
  ) THEN
    ALTER TABLE invoices ADD COLUMN sender_bank_bsb text;
  END IF;
END $$;

-- Add account number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'sender_bank_account'
  ) THEN
    ALTER TABLE invoices ADD COLUMN sender_bank_account text;
  END IF;
END $$;

COMMENT ON COLUMN invoices.sender_bank_name IS 'Bank account holder name for payment';
COMMENT ON COLUMN invoices.sender_bank_bsb IS 'BSB number for payment';
COMMENT ON COLUMN invoices.sender_bank_account IS 'Bank account number for payment';
