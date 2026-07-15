import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
console.log('Using key:', key ? key.substring(0, 10) + '...' : 'none');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  key
);

async function run() {
  // Let's select 1 row from erp_products bypassing RLS if we have service role key,
  // or just check with anon key
  const { data, error } = await supabase.from('erp_products').select('*');
  console.log('Data:', data);
  console.log('Error:', error);
}
run();
