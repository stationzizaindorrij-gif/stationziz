import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const dummyClient = {
    id: "test",
    user_id: '00000000-0000-0000-0000-000000000000',
    name: "t",
    phone: "t",
    email: "t",
    address: "t",
    ice: "t",
    contact: "t",
    notes: "t",
    payments: []
  };
  
  for (const key of Object.keys(dummyClient)) {
    if (key === 'user_id') continue;
    const obj = { user_id: '00000000-0000-0000-0000-000000000000', [key]: dummyClient[key] };
    const { error } = await supabase.from('erp_clients').insert(obj);
    if (error && error.code === 'PGRST204') {
        console.log("Missing column:", key);
    }
  }
}
run();
