import 'dotenv/config';

async function fetchSchema() {
  const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/?apikey=${process.env.VITE_SUPABASE_ANON_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(Object.keys(data));
  console.log(Object.keys(data.definitions || {}));
}
fetchSchema();
