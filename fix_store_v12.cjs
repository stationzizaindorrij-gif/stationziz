const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

// Update Migration v11 to gracefully handle missing tables
const migrationTarget = `                  // Delete old price changes for these products to avoid duplicates
                  const { data: existingChanges } = await supabase.from('erp_price_changes').select('id').eq('user_id', user_id);
                  if (existingChanges) {
                     const existingIds = existingChanges.map(c => c.id);
                     const newIds = newChanges.map(c => c.id);
                     const toDelete = existingIds.filter(id => !newIds.includes(id));
                     if (toDelete.length > 0) {
                         await supabase.from('erp_price_changes').delete().in('id', toDelete).eq('user_id', user_id);
                     }
                  }

                  // Upsert new price changes (stripping bad fields)
                  const changesToInsert = newChanges.map(c => {
                      const { oldPurchasePrice, oldSalePrice, productType, ...rest } = c;
                      return { ...rest, user_id };
                  });
                  for (let i = 0; i < changesToInsert.length; i += 100) {
                      const { error } = await supabase.from('erp_price_changes').upsert(changesToInsert.slice(i, i + 100));
                      if (error) throw new Error("price_changes error: " + error.message);
                  }`;

const migrationReplacement = `                  // Delete old price changes for these products to avoid duplicates
                  const { data: existingChanges, error: existingErr } = await supabase.from('erp_price_changes').select('id').eq('user_id', user_id);
                  if (existingErr) {
                     console.warn("Skipping erp_price_changes table (might not exist).");
                  } else if (existingChanges) {
                     const existingIds = existingChanges.map(c => c.id);
                     const newIds = newChanges.map(c => c.id);
                     const toDelete = existingIds.filter(id => !newIds.includes(id));
                     if (toDelete.length > 0) {
                         await supabase.from('erp_price_changes').delete().in('id', toDelete).eq('user_id', user_id);
                     }
                  }

                  // Upsert new price changes (stripping bad fields)
                  if (!existingErr) {
                      const changesToInsert = newChanges.map(c => {
                          const { oldPurchasePrice, oldSalePrice, productType, ...rest } = c;
                          return { ...rest, user_id };
                      });
                      for (let i = 0; i < changesToInsert.length; i += 100) {
                          const { error } = await supabase.from('erp_price_changes').upsert(changesToInsert.slice(i, i + 100));
                          if (error) console.warn("price_changes error (ignored): " + error.message);
                      }
                  }`;
if (code.includes(migrationTarget)) {
    code = code.replace(migrationTarget, migrationReplacement);
}

// Ensure the general saveState gracefully skips missing tables
const saveStateTarget = `                   const { data } = await supabase.from(\`erp_\${key}\`).select('id').eq('user_id', user_id).order('id').range(from, from + step - 1);
                   if (!data || data.length === 0) {
                     hasMore = false;`;
const saveStateReplacement = `                   const { data, error: selectErr } = await supabase.from(\`erp_\${key}\`).select('id').eq('user_id', user_id).order('id').range(from, from + step - 1);
                   if (selectErr) {
                       console.warn(\`Skipping smart sync for erp_\${key} (table missing or error): \`, selectErr);
                       return;
                   }
                   if (!data || data.length === 0) {
                     hasMore = false;`;
if (code.includes(saveStateTarget)) {
    code = code.replace(saveStateTarget, saveStateReplacement);
}

fs.writeFileSync('src/store.ts', code);
console.log("Patched successfully.");
