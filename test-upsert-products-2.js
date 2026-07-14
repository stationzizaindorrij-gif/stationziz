import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  const item = {
    id: "test",
    name: "test",
    type: "test",
    purchase_price: 10,
    sale_price: 15,
    unit: 'L',
    status: 'active',
    user_id: 'dummy'
  };
  const { error } = await supabase.from('erp_products').upsert([item]);
  console.log('error:', error);
}
test();
