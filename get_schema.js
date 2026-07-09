import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function getS() {
  const { data, error } = await supabase.rpc('get_schema', { table_name: 'erp_config' });
  console.log("Schema:", data, error);
}
getS();
