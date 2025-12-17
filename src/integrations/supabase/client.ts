// Supabase client configuration - uses environment variables for security
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Trim to handle any accidental whitespace/newlines in env vars
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);