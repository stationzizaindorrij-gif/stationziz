import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  const item = {
    id: "test",
    date: new Date().toISOString(),
    employeeId: "test",
    pumpReadings: [],
    cashCollected: 0,
    status: "open",
    expenses: [],
    clientInvoices: [],
    clientPayments: [],
    TPE: 0,
    tankReadings: [],
    manualPrices: [],
  };
  const { error } = await supabase.from('erp_shifts').upsert([item]);
  console.log('error:', error);
}
test();
