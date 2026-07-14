import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log("Session:", session ? "Exists" : "None", sessionError);
}
test();
