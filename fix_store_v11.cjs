const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

// 1. Update saveState to strip problematic fields
const saveStateTarget = `             if (Array.isArray(data)) {
                 const items = data.map(item => ({ ...item, user_id }));
                 
                 // Smart sync: Upsert existing/new, delete removed`;
const saveStateReplacement = `             if (Array.isArray(data)) {
                 let items = data.map(item => ({ ...item, user_id }));
                 
                 // Strip fields that might not be in Supabase schema
                 if (key === 'price_changes') {
                     items = items.map(c => {
                         const { oldPurchasePrice, oldSalePrice, productType, ...rest } = c;
                         return rest;
                     });
                 }
                 if (key === 'supplies') {
                     items = items.map(s => {
                         const { totalAmount, ...rest } = s;
                         return rest;
                     });
                 }
                 if (key === 'sales') {
                     items = items.map(s => {
                         const { totalAmount, ...rest } = s;
                         return rest;
                     });
                 }
                 if (key === 'shifts') {
                     items = items.map(s => {
                         const { totalAmount, ...rest } = s;
                         return rest;
                     });
                 }

                 // Smart sync: Upsert existing/new, delete removed`;
if (code.includes(saveStateTarget)) {
    code = code.replace(saveStateTarget, saveStateReplacement);
}

// 2. Replace Migration v10 with Migration v11
const migrationRegex = /const isFixed = localStorage\.getItem\('erp_price_history_fixed_v10'\);[\s\S]*?localStorage\.setItem\('erp_price_history_fixed_v10', 'true'\);\s*console\.log\("Migration v10 successfully saved to Supabase\."\);\s*\} catch \(err\) \{\s*console\.error\("Migration v10 failed to sync to Supabase:", err\);\s*\/\/ Do not set localStorage so it retries on next reload\s*\}\s*\};\s*performSync\(\);\s*\}/;

const migrationReplacement = `const isFixed = localStorage.getItem('erp_price_history_fixed_v11');
       if (!isFixed && sales.length > 0) {
          console.log("Running migration v11 to sync with Supabase...");
          const sp = products.find(p => p.name.toLowerCase().includes('sans plom') || p.name.toLowerCase().includes('sans-plom'));
          const melange = products.find(p => p.name.toLowerCase().includes('lange') || p.name.toLowerCase().includes('mélange'));
          const gasoil = products.find(p => p.name.toLowerCase().includes('gasoil') || p.name.toLowerCase().includes('gazoil'));
          
          // Keep existing non-fuel price changes
          const otherChanges = priceChanges.filter(pc => 
              (!sp || pc.productId !== sp.id) && 
              (!melange || pc.productId !== melange.id) && 
              (!gasoil || pc.productId !== gasoil.id)
          );
          
          let newChanges = [...otherChanges];
          
          if (sp) {
             newChanges.push({ id: \`fixed_sp_1\`, date: '2026-07-03T08:00:00.000Z', productId: sp.id, productType: sp.type, purchasePrice: 11.71, salePrice: 12.71, oldPurchasePrice: 11.71, oldSalePrice: 12.71 });
             newChanges.push({ id: \`fixed_sp_2\`, date: '2026-07-06T08:00:00.000Z', productId: sp.id, productType: sp.type, purchasePrice: 12.71, salePrice: 13.71, oldPurchasePrice: 11.71, oldSalePrice: 12.71 });
             newChanges.push({ id: \`fixed_sp_3\`, date: '2026-07-09T08:00:00.000Z', productId: sp.id, productType: sp.type, purchasePrice: 15.90, salePrice: 16.45, oldPurchasePrice: 12.71, oldSalePrice: 13.71 });
          }
          if (melange) {
             newChanges.push({ id: \`fixed_mel_1\`, date: '2026-07-03T08:00:00.000Z', productId: melange.id, productType: melange.type, purchasePrice: 11.71, salePrice: 12.71, oldPurchasePrice: 11.71, oldSalePrice: 12.71 });
             newChanges.push({ id: \`fixed_mel_2\`, date: '2026-07-06T08:00:00.000Z', productId: melange.id, productType: melange.type, purchasePrice: 12.71, salePrice: 13.71, oldPurchasePrice: 11.71, oldSalePrice: 12.71 });
             newChanges.push({ id: \`fixed_mel_3\`, date: '2026-07-09T08:00:00.000Z', productId: melange.id, productType: melange.type, purchasePrice: 15.90, salePrice: 16.45, oldPurchasePrice: 12.71, oldSalePrice: 13.71 });
          }
          if (gasoil) {
             newChanges.push({ id: \`fixed_gas_1\`, date: '2026-07-03T08:00:00.000Z', productId: gasoil.id, productType: gasoil.type, purchasePrice: 13.45, salePrice: 14.45, oldPurchasePrice: 13.45, oldSalePrice: 14.45 });
             newChanges.push({ id: \`fixed_gas_2\`, date: '2026-07-06T08:00:00.000Z', productId: gasoil.id, productType: gasoil.type, purchasePrice: 14.45, salePrice: 15.45, oldPurchasePrice: 13.45, oldSalePrice: 14.45 });
             newChanges.push({ id: \`fixed_gas_3\`, date: '2026-07-09T08:00:00.000Z', productId: gasoil.id, productType: gasoil.type, purchasePrice: 14.27, salePrice: 14.71, oldPurchasePrice: 14.45, oldSalePrice: 15.45 });
          }
          
          const updatedProducts = products.map(p => {
             if (sp && p.id === sp.id) return { ...p, purchasePrice: 15.90, salePrice: 16.45 };
             if (melange && p.id === melange.id) return { ...p, purchasePrice: 15.90, salePrice: 16.45 };
             if (gasoil && p.id === gasoil.id) return { ...p, purchasePrice: 14.27, salePrice: 14.71 };
             return p;
          });
          
          const getHistoricalP = (productId, date) => {
             const sortedChanges = [...newChanges].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
             const changesBeforeDate = sortedChanges.filter(c => c.productId === productId && c.date.split('T')[0] <= date.split('T')[0]);
             if (changesBeforeDate.length > 0) return { purchasePrice: changesBeforeDate[0].purchasePrice, salePrice: changesBeforeDate[0].salePrice };
             return null;
          };
          
          let salesChanged = false;
          const updatedSales = sales.map(s => {
             const h = getHistoricalP(s.productId, s.date);
             if (h && s.price !== h.salePrice) {
                 salesChanged = true;
                 return { ...s, price: h.salePrice, total: parseFloat((s.qty * h.salePrice).toFixed(2)) };
             }
             return s;
          });

          let suppliesChanged = false;
          const updatedSupplies = supplies.map(s => {
             const h = getHistoricalP(s.productId, s.date);
             if (h && s.purchasePrice !== h.purchasePrice) {
                 suppliesChanged = true;
                 return { ...s, purchasePrice: h.purchasePrice };
             }
             return s;
          });

          // Perform robust Supabase sync
          const performSync = async () => {
              try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session || !session.user) {
                      console.log("No session, will retry later.");
                      return;
                  }
                  const user_id = session.user.id;
                  
                  // Delete old price changes for these products to avoid duplicates
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
                  }
                  setPriceChanges(newChanges);

                  // Update products
                  const prodsToInsert = updatedProducts.map(p => ({ ...p, user_id }));
                  for (let i = 0; i < prodsToInsert.length; i += 100) {
                      const { error } = await supabase.from('erp_products').upsert(prodsToInsert.slice(i, i + 100));
                      if (error) throw new Error("products error: " + error.message);
                  }
                  setProducts(updatedProducts);

                  // Update sales
                  if (salesChanged) {
                      const salesToInsert = updatedSales.map(s => {
                          const { totalAmount, ...rest } = s;
                          return { ...rest, user_id };
                      });
                      for (let i = 0; i < salesToInsert.length; i += 100) {
                          const { error } = await supabase.from('erp_sales').upsert(salesToInsert.slice(i, i + 100));
                          if (error) throw new Error("sales error: " + error.message);
                      }
                      setSales(updatedSales);
                  }

                  // Update supplies
                  if (suppliesChanged) {
                      const suppliesToInsert = updatedSupplies.map(s => {
                          const { totalAmount, ...rest } = s;
                          return { ...rest, user_id };
                      });
                      for (let i = 0; i < suppliesToInsert.length; i += 100) {
                          const { error } = await supabase.from('erp_supplies').upsert(suppliesToInsert.slice(i, i + 100));
                          if (error) throw new Error("supplies error: " + error.message);
                      }
                      setSupplies(updatedSupplies);
                  }

                  // Only if everything succeeded do we mark as fixed
                  localStorage.setItem('erp_price_history_fixed_v11', 'true');
                  console.log("Migration v11 successfully saved to Supabase.");
              } catch (err) {
                  console.error("Migration v11 failed to sync to Supabase:", err);
                  alert("Erreur de synchronisation Supabase: " + err.message);
                  // Do not set localStorage so it retries on next reload
              }
          };
          
          performSync();
       }`;

if (migrationRegex.test(code)) {
    code = code.replace(migrationRegex, migrationReplacement);
    fs.writeFileSync('src/store.ts', code);
    console.log("Patched successfully.");
} else {
    console.log("Could not find target block.");
}
