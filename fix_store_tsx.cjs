const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const target = `const { data: currentItems } = await supabase.from(\`erp_\${key}\`).select('id').eq('user_id', user_id);`;
const replacement = `let currentItems = [];
                 let from = 0;
                 const step = 1000;
                 let hasMore = true;
                 while(hasMore) {
                   const { data } = await supabase.from(\`erp_\${key}\`).select('id').eq('user_id', user_id).range(from, from + step - 1);
                   if (!data || data.length === 0) {
                     hasMore = false;
                   } else {
                     currentItems = [...currentItems, ...data];
                     if (data.length < step) hasMore = false;
                     from += step;
                   }
                 }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/store.ts', code);
  console.log("Patched store.ts successfully");
} else {
  console.log("Target not found in store.ts");
}
