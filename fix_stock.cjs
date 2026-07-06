const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf-8');

const replacement = `
    shiftData.productsSold.forEach((p, idx) => {
       newSales.push({
         ...p,
         id: \`sale_\${Date.now()}_prod_\${idx}\`,
         date: shiftData.date,
         time: shiftData.endTime || shiftData.startTime,
         shiftId: newShift.id,
         attendantId: newShift.attendantId,
         attendantName: newShift.attendantName,
         pumpId: '', pumpNumber: '', nozzleId: '', nozzleName: ''
       });
       
       if (p.shopProductId) {
         const shopProduct = shopProducts.find(sp => sp.id === p.shopProductId);
         if (shopProduct) {
           const updatedShopProducts = shopProducts.map(sp => sp.id === p.shopProductId ? { ...sp, stockQuantity: sp.stockQuantity - p.qty } : sp);
           // We cannot easily set state from inside a loop for the same state repeatedly if it relies on current state,
           // but since it's just adding to an array of updates, it's better to calculate all updates first.
         }
       }
    });
`;
// Let's modify the code safely
