const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const target1 = `      existing[key] = data;
      localStorage.setItem('erp_data', JSON.stringify(existing));
      
      // Async sync to Supabase
      setTimeout(async () => {`;

const replace1 = `      existing[key] = data;
      try {
        localStorage.setItem('erp_data', JSON.stringify(existing));
      } catch (e) {
        console.warn("localStorage quota exceeded, skipping local cache.");
      }
      
      // Async sync to Supabase
      setTimeout(async () => {`;

if (code.includes(target1)) {
    code = code.replace(target1, replace1);
    fs.writeFileSync('src/store.ts', code);
    console.log("Patched store.ts localStorage limit");
}

