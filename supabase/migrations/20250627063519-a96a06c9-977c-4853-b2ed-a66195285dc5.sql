
-- Create table for storing website customization settings
CREATE TABLE public.customization_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  settings_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for admin access only
ALTER TABLE public.customization_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view customization settings
CREATE POLICY "Admins can view customization settings" 
  ON public.customization_settings 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can create customization settings
CREATE POLICY "Admins can create customization settings" 
  ON public.customization_settings 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update customization settings
CREATE POLICY "Admins can update customization settings" 
  ON public.customization_settings 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete customization settings
CREATE POLICY "Admins can delete customization settings" 
  ON public.customization_settings 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_customization_settings_updated_at
  BEFORE UPDATE ON public.customization_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default theme
INSERT INTO public.customization_settings (name, description, settings_data, is_active)
VALUES (
  'Default Theme',
  'The default Stand Up Sydney theme',
  '{
    "colors": {
      "primary": "#3b82f6",
      "secondary": "#64748b",
      "tertiary": "#8b5cf6",
      "background": "#ffffff",
      "cardBackground": "#f8fafc",
      "headerBackground": "#1e293b",
      "textPrimary": "#0f172a",
      "textSecondary": "#64748b",
      "textLink": "#3b82f6",
      "border": "#e2e8f0",
      "accent": "#10b981"
    },
    "typography": {
      "headingSize": 24,
      "bodySize": 16,
      "smallSize": 14,
      "headingWeight": 600,
      "bodyWeight": 400
    },
    "components": {
      "buttonRadius": 6,
      "cardRadius": 8,
      "inputRadius": 6,
      "profilePictureShape": "circle",
      "profilePictureSize": 80
    },
    "layout": {
      "containerMaxWidth": 1200,
      "pageMargin": 16,
      "componentSpacing": 16
    },
    "icons": {
      "size": 20,
      "color": "#64748b"
    }
  }'::jsonb,
  true
);
