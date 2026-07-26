import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const dummyClient = {
    id: "test",
    user_id: 'bad-uuid',
  };
  const { error } = await supabase.from('erp_clients').insert(dummyClient);
  console.log(error);
}
run();
