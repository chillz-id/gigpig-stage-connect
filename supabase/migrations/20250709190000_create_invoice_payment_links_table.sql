-- Create invoice_payment_links table to track payment links for invoices
CREATE TABLE IF NOT EXISTS public.invoice_payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  payment_link_id TEXT NOT NULL, -- Stripe payment link ID
  url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'used', 'expired', 'cancelled')) DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.invoice_payment_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoice_payment_links
CREATE POLICY "Users can view payment links for their invoices" ON public.invoice_payment_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

CREATE POLICY "Users can insert payment links for their invoices" ON public.invoice_payment_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

CREATE POLICY "Users can update payment links for their invoices" ON public.invoice_payment_links
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND ((promoter_id = auth.uid()) OR (comedian_id = auth.uid()))
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_invoice_payment_links_invoice_id ON public.invoice_payment_links(invoice_id);
CREATE INDEX idx_invoice_payment_links_status ON public.invoice_payment_links(status);
CREATE INDEX idx_invoice_payment_links_expires_at ON public.invoice_payment_links(expires_at);

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_invoice_payment_links_updated_at
  BEFORE UPDATE ON public.invoice_payment_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.invoice_payment_links IS 'Tracks payment links created for invoices through various payment gateways';
COMMENT ON COLUMN public.invoice_payment_links.payment_link_id IS 'External payment gateway link ID (e.g., Stripe payment link ID)';
COMMENT ON COLUMN public.invoice_payment_links.status IS 'Link status: active, used, expired, or cancelled';
COMMENT ON COLUMN public.invoice_payment_links.expires_at IS 'When the payment link expires (typically 7 days from creation)';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.invoice_payment_links TO authenticated;