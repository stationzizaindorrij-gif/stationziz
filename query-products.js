import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase.from('erp_products').select('id, name, type, purchasePrice, salePrice');
  console.log(data);
}
check();
