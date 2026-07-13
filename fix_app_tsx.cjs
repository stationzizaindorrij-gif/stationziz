const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the runInChunks fetcher block
const oldFetcher = `        await runInChunks(arrayKeys, async (k) => {
          const { data } = await supabase.from(\`erp_\${k}\`).select('*').eq('user_id', session.user.id);
          if (data && data.length > 0) fetchedData[k] = data;
        }, 4);`;

const newFetcher = `        await runInChunks(arrayKeys, async (k) => {
          let allData = [];
          let from = 0;
          const step = 1000;
          let hasMore = true;
          
          while (hasMore) {
            const { data, error } = await supabase
              .from(\`erp_\${k}\`)
              .select('*')
              .eq('user_id', session.user.id)
              .range(from, from + step - 1);
              
            if (error || !data || data.length === 0) {
              hasMore = false;
            } else {
              allData = [...allData, ...data];
              if (data.length < step) hasMore = false;
              from += step;
            }
          }
          if (allData.length > 0) fetchedData[k] = allData;
        }, 4);`;

if(code.includes(oldFetcher)) {
    code = code.replace(oldFetcher, newFetcher);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched App.tsx successfully");
} else {
    console.log("Could not find the target code in App.tsx");
}
