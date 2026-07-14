import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
async function check() {
  const { data, error } = await supabase.storage.createBucket('logos', { public: true });
  console.log('Created bucket logos:', data, error);
}
check();
