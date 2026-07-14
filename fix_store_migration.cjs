const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const targetRegex = /const isFixed = localStorage\.getItem\('erp_price_history_fixed_v6'\);[\s\S]*?localStorage\.setItem\('erp_price_history_fixed_v6', 'true'\);\s*\}/;

const replacement = `const isFixed = localStorage.getItem('erp_price_history_fixed_v8');
       if (!isFixed) {
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
          
          saveState('price_changes', newChanges, setPriceChanges);
          
          // Force update products current prices as well
          const updatedProducts = products.map(p => {
             if (sp && p.id === sp.id) return { ...p, purchasePrice: 15.90, salePrice: 16.45 };
             if (melange && p.id === melange.id) return { ...p, purchasePrice: 15.90, salePrice: 16.45 };
             if (gasoil && p.id === gasoil.id) return { ...p, purchasePrice: 14.27, salePrice: 14.71 };
             return p;
          });
          saveState('products', updatedProducts, setProducts);
          
          // Update sales and supplies to reflect correct historical pricing
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
          if (salesChanged) saveState('sales', updatedSales, setSales);

          let suppliesChanged = false;
          const updatedSupplies = supplies.map(s => {
             const h = getHistoricalP(s.productId, s.date);
             if (h && s.purchasePrice !== h.purchasePrice) {
                 suppliesChanged = true;
                 return { ...s, purchasePrice: h.purchasePrice, totalAmount: parseFloat((s.qtyDelivered * h.purchasePrice).toFixed(2)) };
             }
             return s;
          });
          if (suppliesChanged) saveState('supplies', updatedSupplies, setSupplies);

          localStorage.setItem('erp_price_history_fixed_v8', 'true');
       }`;

if (targetRegex.test(code)) {
    code = code.replace(targetRegex, replacement);
    
    // Also, I need to add sales, supplies to dependency array
    code = code.replace(`}, [products, priceChanges]);`, `}, [products, priceChanges, sales, supplies]);`);
    
    fs.writeFileSync('src/store.ts', code);
    console.log("Patched successfully.");
} else {
    console.log("Could not find target block.");
}
