import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { error } = await supabase.from('erp_shifts').insert({ user_id: '00000000-0000-0000-0000-000000000000', startTime: 'test' });
  console.log('Insert startTime error:', error);
  const { error: err2 } = await supabase.from('erp_shifts').insert({ user_id: '00000000-0000-0000-0000-000000000000', start_time: 'test' });
  console.log('Insert start_time error:', err2);
}
check();
