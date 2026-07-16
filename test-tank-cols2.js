import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const data = {
  tanks: [{ id: 'tank_1', number: 'Cuve N°1 (Gazoil)', productId: 'prod_gazoil', productName: 'Gazoil', capacity: 30000, currentLevel: 24500, minLevel: 5000, maxLevel: 29500 }]
};

async function check() {
  const obj = { ...data.tanks[0], user_id: '00000000-0000-0000-0000-000000000000' };
  const { error } = await supabase.from('erp_tanks').insert(obj);
  console.log('erp_tanks:', error);
}
check();
