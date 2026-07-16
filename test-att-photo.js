import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('erp_attendants').select('*').limit(1);
  console.log('Select error:', error);
  if (data && data.length > 0) {
      console.log('Sample row keys:', Object.keys(data[0]));
  }
}
check();
