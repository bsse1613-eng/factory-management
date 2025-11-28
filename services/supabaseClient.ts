import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Configure these in .env.local file
// Copy .env.local.example and fill in your actual Supabase credentials
// Get from: Supabase Dashboard → Settings → API
// See DATABASE_SETUP_GUIDE.md for complete instructions

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase credentials. Please:\n' +
    '1. Copy .env.local.example to .env.local\n' +
    '2. Fill in your SUPABASE_URL and SUPABASE_ANON_KEY\n' +
    '3. Restart the development server\n' +
    'See DATABASE_SETUP_GUIDE.md for complete instructions.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
