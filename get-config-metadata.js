import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  key
);

async function run() {
  const columns = ['name', 'logo', 'address', 'phone', 'taxid', 'autobackup', 'language', 'theme', 'printerip', 'iotconfigured'];
  const missing = [];
  
  for (const col of columns) {
    const testObj = { id: '00000000-0000-0000-0000-000000000000', user_id: '00000000-0000-0000-0000-000000000000' };
    testObj[col] = (col === 'autobackup' || col === 'iotconfigured') ? false : 'test';
    
    const { error: err } = await supabase.from('erp_config').insert(testObj);
    if (err) {
      if (err.message && err.message.includes('Could not find the \'' + col + '\' column')) {
        missing.push(col);
      } else {
        console.log(`Column ${col} check got other error:`, err.code, err.message);
      }
    } else {
      console.log(`Column ${col} exists!`);
    }
  }
  
  console.log('Missing columns in erp_config:', missing);
}
run();
