import { createClient } from '@supabase/supabase-js';

// These should be moved to .env later, but for PoC we can use placeholders or ask user.
const supabaseUrl = 'https://almihtbknfluzlccuszp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsbWlodGJrbmZsdXpsY2N1c3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NjcxMTksImV4cCI6MjA4NjQ0MzExOX0.lAMZgilox43k9uaCmB_T_ECyd6IKHeCZOXs7oEhwErU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
