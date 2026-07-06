const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: { user }, error: authErr } = await supabase.auth.getUser(); // This will fail without token. But we don't have auth here. Wait, we can't test without user session!
}
test();
