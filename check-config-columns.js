import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  key
);

async function run() {
  const { data, error } = await supabase.from('erp_config').select('*').limit(1);
  console.log('erp_config Data:', data);
  console.log('erp_config Error:', error);
  if (data && data.length > 0) {
    console.log('Keys on row:', Object.keys(data[0]));
  }
}
run();
