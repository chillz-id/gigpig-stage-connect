-- Create customization settings table for Design System
CREATE TABLE IF NOT EXISTS public.customization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  settings_data JSONB NOT NULL,
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

-- Insert default customization settings with proper structure
INSERT INTO public.customization_settings (name, settings_data, is_active) VALUES 
('Default iD Comedy Theme', '{
  "colors": {
    "primary": "#7C3AED",
    "secondary": "#EC4899",
    "accent": "#F59E0B",
    "background": "#0F172A",
    "foreground": "#F8FAFC",
    "card": "#1E293B",
    "card-foreground": "#F1F5F9",
    "muted": "#475569",
    "muted-foreground": "#94A3B8",
    "border": "#334155",
    "input": "#1E293B",
    "primary-foreground": "#F8FAFC",
    "secondary-foreground": "#F8FAFC",
    "destructive": "#EF4444",
    "destructive-foreground": "#F8FAFC",
    "success": "#10B981",
    "success-foreground": "#F8FAFC",
    "warning": "#F59E0B",
    "warning-foreground": "#F8FAFC"
  },
  "buttons": {
    "borderRadius": 8,
    "borderWidth": 1,
    "paddingX": 16,
    "paddingY": 8,
    "fontSize": 14,
    "fontWeight": 500
  },
  "typography": {
    "headingFont": "Inter, sans-serif",
    "bodyFont": "Inter, sans-serif",
    "h1Size": 36,
    "h2Size": 30,
    "h3Size": 24,
    "bodySize": 16,
    "smallSize": 14,
    "lineHeight": 1.5,
    "letterSpacing": 0
  },
  "layout": {
    "containerMaxWidth": 1200,
    "sectionPadding": 24,
    "cardSpacing": 16,
    "gridGap": 24
  },
  "effects": {
    "shadowIntensity": 0.1,
    "blurIntensity": 8,
    "animationSpeed": "200ms",
    "hoverScale": 1.02
  }
}', true)
ON CONFLICT DO NOTHING;