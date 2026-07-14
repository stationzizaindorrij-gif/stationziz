import { supabase } from './src/lib/supabase.js';

async function test() {
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Session user:', session?.user?.id);
  const { data, error } = await supabase.from('erp_products').select('*').limit(1);
  console.log('Select erp_products:', data, error);
}
test();
