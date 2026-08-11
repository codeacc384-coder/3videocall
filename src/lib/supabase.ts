import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ygvcyoexgljhtgqkglkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlndmN5b2V4Z2xqaHRncWtnbGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMDUxMTcsImV4cCI6MjEwMTU4MTExN30.-y3UcnBMk50hMHK4zJJSRmZD4W21yerE1RwHWi-EN_E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
