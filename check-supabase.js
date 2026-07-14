import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
  const { error } = await supabase.from('erp_price_changes').select('id').limit(1);
  console.log('erp_price_changes error:', error);
}
check();
