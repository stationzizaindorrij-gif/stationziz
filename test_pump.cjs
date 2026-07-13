const fs = require('fs');
let code = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

const target = `    const stockReste: Record<string, { liters: number, purchase: number, montant: number }> = {};
    store.products.forEach(p => {
      const productSupplies = store.supplies.filter(s => s.productId === p.id && (s.date <= selectedEndDateObj));
      let avgPurchasePrice = getHistoricalPrice(p.id, selectedEndDateObj).purchasePrice;
      if (productSupplies.length > 0) {
        const totalQty = productSupplies.reduce((sum, s) => sum + s.qtyDelivered, 0);
        const totalValue = productSupplies.reduce((sum, s) => sum + (s.qtyDelivered * s.purchasePrice), 0);
        if (totalQty > 0) {
          avgPurchasePrice = totalValue / totalQty;
        }
      }
      stockReste[p.id] = { liters: 0, purchase: avgPurchasePrice, montant: 0 };
    });`;

const replace = `    const stockReste: Record<string, { liters: number, purchase: number, montant: number, historyPump: any[] }> = {};
    
    // We will calculate the PUMP (Prix Unitaire Moyen Pondéré) for each product chronologically
    store.products.forEach(p => {
      // Find all events for this product up to the selected date
      const pSales = store.sales.filter(s => s.productId === p.id && s.date <= selectedEndDateObj).map(s => ({ type: 'sale', date: s.date, time: s.time || '00:00:00', qty: s.qty, price: s.price }));
      const pSupplies = store.supplies.filter(s => s.productId === p.id && s.date <= selectedEndDateObj).map(s => ({ type: 'supply', date: s.date, time: s.time || '00:00:00', qty: s.qtyDelivered, price: s.purchasePrice }));
      const pCorrections = (store.stockCorrections || []).filter(c => {
         const tank = store.tanks.find(t => t.id === c.tankId);
         return tank && tank.productId === p.id && c.date <= selectedEndDateObj;
      }).map(c => ({ type: 'correction', date: c.date, time: c.time || '00:00:00', qty: c.qtyAfter - c.qtyBefore }));
      
      const allEvents = [...pSales, ...pSupplies, ...pCorrections].sort((a, b) => new Date(\`\${a.date}T\${a.time}\`).getTime() - new Date(\`\${b.date}T\${b.time}\`).getTime());
      
      // Determine the very first purchase price in the system for this product
      // We will look at priceChanges for the oldest entry
      const priceChangesForP = (store.priceChanges || []).filter(pc => pc.productId === p.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // The user specified that the system starts on the 3rd with an initial price
      const initialPrice = priceChangesForP.length > 0 ? priceChangesForP[0].oldPurchasePrice ?? priceChangesForP[0].purchasePrice : p.purchasePrice;
      
      // To find the initial stock at the beginning of time, we do:
      // Initial Stock = Current Stock (now) - Net Change (from all time)
      let actualCurrentStock = 0;
      store.tanks.filter(t => t.productId === p.id).forEach(t => actualCurrentStock += t.currentLevel);
      
      // We need ALL events from all time to find the true initial stock
      const allTimeSales = store.sales.filter(s => s.productId === p.id).reduce((sum, s) => sum + s.qty, 0);
      const allTimeSupplies = store.supplies.filter(s => s.productId === p.id).reduce((sum, s) => sum + s.qtyDelivered, 0);
      const allTimeCorrections = (store.stockCorrections || []).filter(c => {
         const tank = store.tanks.find(t => t.id === c.tankId);
         return tank && tank.productId === p.id;
      }).reduce((sum, c) => sum + (c.qtyAfter - c.qtyBefore), 0);
      
      const netChangeAllTime = allTimeSupplies + allTimeCorrections - allTimeSales;
      const initialStock = actualCurrentStock - netChangeAllTime;
      
      let runningStock = Math.max(0, initialStock);
      let currentPump = initialPrice;
      const historyPump = [];
      
      if (runningStock > 0) {
          historyPump.push({ date: 'Initial', type: 'initial', stockBefore: 0, qty: runningStock, price: initialPrice, stockAfter: runningStock, newPump: currentPump });
      }

      allEvents.forEach(e => {
         const stockBefore = runningStock;
         if (e.type === 'supply') {
            const newStock = runningStock + e.qty;
            if (newStock > 0) {
               currentPump = ((runningStock * currentPump) + (e.qty * e.price)) / newStock;
            } else {
               currentPump = e.price;
            }
            runningStock = newStock;
            historyPump.push({ date: e.date, type: 'supply', stockBefore, qty: e.qty, price: e.price, stockAfter: runningStock, newPump: currentPump });
         } else if (e.type === 'sale') {
            runningStock -= e.qty;
         } else if (e.type === 'correction') {
            runningStock += e.qty;
         }
      });
      
      // Store the final calculated PUMP
      stockReste[p.id] = { liters: 0, purchase: currentPump, montant: 0, historyPump };
    });`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/Analytics.tsx', code);
console.log("Patched PUMP calculation.");
