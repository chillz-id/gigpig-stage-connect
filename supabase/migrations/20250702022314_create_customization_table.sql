-- Create customization settings table for Design System
CREATE TABLE IF NOT EXISTS public.customization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  settings JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for active settings lookup
CREATE INDEX IF NOT EXISTS idx_customization_settings_active 
ON public.customization_settings(is_active) 
WHERE is_active = true;

-- Enable RLS (Row Level Security)
ALTER TABLE public.customization_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage customization settings
CREATE POLICY "Admins can manage customization settings" ON public.customization_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default customization settings
INSERT INTO public.customization_settings (name, settings, is_active) VALUES 
('Default Theme', '{
  "primaryColor": "#8b5cf6",
  "secondaryColor": "#06b6d4",
  "backgroundColor": "#1f2937",
  "textColor": "#ffffff",
  "borderRadius": "0.5rem",
  "spacing": "1rem",
  "fontFamily": "Inter, sans-serif",
  "fontSize": "16px",
  "buttonStyle": "rounded",
  "cardStyle": "glass",
  "animationSpeed": "200ms"
}', true)
ON CONFLICT DO NOTHING;