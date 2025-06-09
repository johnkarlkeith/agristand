import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Only the 'standards' table is used. Each standard has a file_url column for the PDF.
const SUPABASE_URL = 'https://mwdjnvdtxvxcheksfsht.supabase.co'; // Replace with your Supabase project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13ZGpudmR0eHZ4Y2hla3Nmc2h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0OTE3NzQsImV4cCI6MjA2NTA2Nzc3NH0.ZTzKys9uKf4kJxzgdgMxo61ppxOxNVmG8RfrevcBicU'; // Replace with your Supabase anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 