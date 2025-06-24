
-- Add custom_show_types column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN custom_show_types text[] DEFAULT '{}';
