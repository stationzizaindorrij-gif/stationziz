import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const keys = [
  'products', 'tanks', 'pumps', 'nozzles', 'attendants', 'shifts', 
  'sales', 'supplies', 'stock_corrections', 'audit_logs', 
  'alerts', 'users', 'suppliers', 'clients', 'purchase_invoices', 'sales_invoices',
  'rich_documents', 'shop_products'
];

async function check() {
  for (const k of keys) {
    const { error } = await supabase.from(`erp_${k}`).insert({ user_id: '00000000-0000-0000-0000-000000000000' });
    if (error && error.code === 'PGRST205') {
       console.log(`Table erp_${k} is MISSING`);
    } else if (error && error.code === '42501') {
       console.log(`Table erp_${k} EXISTS (RLS error)`);
    } else {
       console.log(`Table erp_${k} error:`, error);
    }
  }
}
check();
