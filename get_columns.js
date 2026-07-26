import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase
    .from('erp_clients')
    .select('*')
    .limit(1);
    
  if (error) {
    console.log("Error selecting:", error);
  } else {
    // try to get a single row, but if it's empty we can't see the keys.
    // wait, we can query information_schema if RLS allows, but RLS usually doesn't.
    // Let's deliberately insert a row with bad column to see what happens.
    const { error: err } = await supabase.from('erp_clients').insert({ user_id: '00000000-0000-0000-0000-000000000000', fake_col: 1 });
    console.log(err.message);
  }
}
run();
