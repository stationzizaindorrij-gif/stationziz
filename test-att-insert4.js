import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { error } = await supabase.from('erp_attendants').insert({ 
    user_id: '00000000-0000-0000-0000-000000000000', 
    id: 'att_123',
    firstName: 'test', 
    lastName: 'test',
    phone: '123',
    matricule: 'A123',
    hireDate: '2023-01-01',
    status: 'active',
    notes: 'note'
  });
  console.log('Insert without photo error:', error);
}
check();
