import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const data = {
  tanks: [{ id: '1' }]
};

async function check() {
  const obj = { ...data.tanks[0], user_id: '00000000-0000-0000-0000-000000000000' };
  const { error } = await supabase.from('erp_tanks').insert(obj);
  console.log(error);
}
check();
