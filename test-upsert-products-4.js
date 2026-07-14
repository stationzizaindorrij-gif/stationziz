import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  const { data: { session } } = await supabase.auth.getSession();
  
  const item = {
    id: "test",
    name: "test",
    type: "test",
    purchasePrice: 10,
    salePrice: 15,
    status: 'active',
    user_id: session?.user?.id || 'a7183e87-63bb-40cf-a20c-b26a6428c034' // use a valid format or valid uuid if RLS needs it
  };
  const { error } = await supabase.from('erp_products').upsert([item]);
  console.log('error:', error);
}
test();
