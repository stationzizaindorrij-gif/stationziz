import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  const { data: { session } } = await supabase.auth.getSession();
  
  const item = {
    user_id: 'a7183e87-63bb-40cf-a20c-b26a6428c034', // Try some dummy ID
    name: 'test',
    logo: 'test',
    address: 'test',
    phone: 'test',
    taxid: 'test',
    autobackup: true,
    language: 'fr',
    theme: 'light',
    printerip: 'test',
    iotconfigured: false
  };
  const { error } = await supabase.from('erp_config').upsert([item]);
  console.log('error config:', error);
}
test();
