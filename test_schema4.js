import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { error: err } = await supabase.from('erp_clients').insert({ user_id: '00000000-0000-0000-0000-000000000000', payments: [{}] });
  console.log(err);
}
run();
