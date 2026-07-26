import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.rpc('get_schema');
  // if no rpc, we can try to insert a dummy record and catch the error.
  const { error: err } = await supabase.from('erp_clients').insert({ user_id: '123', ice: '123' });
  console.log(err);
}
run();
