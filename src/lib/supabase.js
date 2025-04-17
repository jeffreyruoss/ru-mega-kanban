import { createClient } from '@supabase/supabase-js'

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if credentials are available
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials are missing. Please check your environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
