import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { error } = await supabase.from('erp_attendants').insert({ user_id: '00000000-0000-0000-0000-000000000000', first_name: 'test', last_name: 'test' });
  console.log('Insert first_name error:', error);
}
check();
