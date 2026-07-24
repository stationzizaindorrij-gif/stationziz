import { supabase } from './src/lib/supabase';
async function run() {
  const { data, error } = await supabase.from('erp_price_history').select('*');
  console.log('Error:', error);
  console.log('Data:', data);
}
run();
