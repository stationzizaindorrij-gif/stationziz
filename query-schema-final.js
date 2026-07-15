import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const tsKeys = {
  "erp_rich_documents": ["id", "doctype", "document_number", "partner_id", "partner_name", "date", "due_date", "items", "amount_ht", "vat_amount", "amount_ttc", "payment_method", "mixed_payments", "notes", "terms", "status", "history_logs"]
};

async function check() {
  for (const table of Object.keys(tsKeys)) {
    const keys = tsKeys[table];
    const missing = [];
    
    for (const key of keys) {
      if (key === 'id') continue;
      
      let testObj = { user_id: '00000000-0000-0000-0000-000000000000' };
      if (key === 'items' || key === 'mixed_payments' || key === 'history_logs') testObj[key] = [];
      else testObj[key] = null;
      
      const { error: err } = await supabase.from(table).insert(testObj);
      if (err && err.code === 'PGRST204') {
        const match = err.message.match(/Could not find the '([^']+)' column/);
        if (match && match[1] === key) {
          missing.push(key);
        }
      }
    }
    
    if (missing.length === 0) {
        console.log(`Table ${table} HAS ALL COLUMNS.`);
    } else {
        console.log(`Table ${table} is missing: ${missing.join(', ')}`);
    }
  }
}
check();
