import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Configure these in .env.local file
// Copy .env.local.example and fill in your actual Supabase credentials
// Get from: Supabase Dashboard → Settings → API
// See DATABASE_SETUP_GUIDE.md for complete instructions

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  if (typeof window !== 'undefined') {
    console.warn(
      'Missing Supabase credentials. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
    );
  }
}
