-- Create invoice_templates table for storing custom invoice templates
CREATE TABLE IF NOT EXISTS public.invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('modern', 'classic', 'minimal', 'professional')),
  layout VARCHAR(50) NOT NULL CHECK (layout IN ('standard', 'two-column', 'detailed', 'compact')),
  preview_url TEXT,
  branding_options JSONB NOT NULL DEFAULT '{
    "colors": {
      "primary": "#7C3AED",
      "secondary": "#A855F7",
      "accent": "#C084FC",
      "text": "#1F2937",
      "background": "#FFFFFF",
      "border": "#E5E7EB"
    },
    "fonts": {
      "heading": "Inter, sans-serif",
      "body": "Inter, sans-serif",
      "accent": "Inter, sans-serif"
    },
    "header": {
      "showCompanyInfo": true,
      "showLogo": true,
      "backgroundColor": "#FFFFFF",
      "textColor": "#1F2937",
      "borderColor": "#E5E7EB"
    },
    "footer": {
      "showFooter": true,
      "text": "Thank you for your business with Stand Up Sydney",
      "backgroundColor": "#F9FAFB",
      "textColor": "#6B7280",
      "borderColor": "#E5E7EB"
    },
    "layout": {
      "marginTop": 20,
      "marginBottom": 20,
      "marginLeft": 20,
      "marginRight": 20,
      "pageSize": "A4",
      "orientation": "portrait"
    },
    "logo": null
  }'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_invoice_templates_user_id ON public.invoice_templates(user_id);
CREATE INDEX idx_invoice_templates_category ON public.invoice_templates(category);
CREATE INDEX idx_invoice_templates_is_public ON public.invoice_templates(is_public);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_invoice_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_templates_updated_at
BEFORE UPDATE ON public.invoice_templates
FOR EACH ROW
EXECUTE FUNCTION update_invoice_templates_updated_at();

-- RLS Policies
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own templates
CREATE POLICY "Users can view own templates" ON public.invoice_templates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can view public templates
CREATE POLICY "Users can view public templates" ON public.invoice_templates
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Users can create their own templates
CREATE POLICY "Users can create own templates" ON public.invoice_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update own templates" ON public.invoice_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates" ON public.invoice_templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create user_invoice_preferences table for storing user preferences
CREATE TABLE IF NOT EXISTS public.user_invoice_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_template_id UUID REFERENCES public.invoice_templates(id) ON DELETE SET NULL,
  auto_save BOOLEAN DEFAULT true,
  show_preview BOOLEAN DEFAULT true,
  company_info JSONB DEFAULT '{
    "name": "",
    "address": "",
    "phone": "",
    "email": "",
    "website": "",
    "abn": "",
    "logo": ""
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_preferences UNIQUE(user_id)
);

-- Create index
CREATE INDEX idx_user_invoice_preferences_user_id ON public.user_invoice_preferences(user_id);

-- Create updated_at trigger
CREATE TRIGGER update_user_invoice_preferences_updated_at
BEFORE UPDATE ON public.user_invoice_preferences
FOR EACH ROW
EXECUTE FUNCTION update_invoice_templates_updated_at();

-- RLS Policies for user preferences
ALTER TABLE public.user_invoice_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences" ON public.user_invoice_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own preferences
CREATE POLICY "Users can create own preferences" ON public.user_invoice_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences" ON public.user_invoice_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences" ON public.user_invoice_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add template usage tracking
CREATE TABLE IF NOT EXISTS public.invoice_template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.invoice_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_invoice_template_usage_template_id ON public.invoice_template_usage(template_id);
CREATE INDEX idx_invoice_template_usage_user_id ON public.invoice_template_usage(user_id);
CREATE INDEX idx_invoice_template_usage_invoice_id ON public.invoice_template_usage(invoice_id);

-- RLS Policies for template usage
ALTER TABLE public.invoice_template_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage" ON public.invoice_template_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own usage records
CREATE POLICY "Users can create own usage" ON public.invoice_template_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add template_id to invoices table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'template_id'
  ) THEN
    ALTER TABLE public.invoices 
    ADD COLUMN template_id UUID REFERENCES public.invoice_templates(id) ON DELETE SET NULL;
    
    CREATE INDEX idx_invoices_template_id ON public.invoices(template_id);
  END IF;
END $$;