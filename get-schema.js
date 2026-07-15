import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: user_auth } = await supabase.auth.getSession();
  console.log("Auth session?", user_auth.session ? "yes" : "no");
}
check();
