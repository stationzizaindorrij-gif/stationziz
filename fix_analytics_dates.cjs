const fs = require('fs');
let code = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

// Fix pSupplies
let target1 = `const pSupplies = store.supplies.filter(s => s.productId === p.id && s.date <= selectedEndDateObj).map(s => ({ type: 'supply', date: s.date, time: s.time || '00:00:00', qty: s.qtyDelivered, price: s.purchasePrice }));`;
let replace1 = `const pSupplies = store.supplies.filter(s => s.productId === p.id && s.date.split('T')[0] <= selectedEndDateObj).map(s => ({ type: 'supply', date: s.date.split('T')[0], time: s.time || (s.date.includes('T') ? s.date.split('T')[1].substring(0,8) : '00:00:00'), qty: s.qtyDelivered, price: s.purchasePrice }));`;
code = code.replace(target1, replace1);

// Fix pCorrections
let target2 = `return tank && tank.productId === p.id && c.date <= selectedEndDateObj;`;
let replace2 = `return tank && tank.productId === p.id && c.date.split('T')[0] <= selectedEndDateObj;`;
code = code.replace(target2, replace2);

let target3 = `}).map(c => ({ type: 'correction', date: c.date, time: c.time || '00:00:00', qty: c.qtyAfter - c.qtyBefore }));`;
let replace3 = `}).map(c => ({ type: 'correction', date: c.date.split('T')[0], time: c.time || (c.date.includes('T') ? c.date.split('T')[1].substring(0,8) : '00:00:00'), qty: c.qtyAfter - c.qtyBefore }));`;
code = code.replace(target3, replace3);

// Fix suppliesAfter
let target4 = `const suppliesAfter = store.supplies.filter(s => {
        // Since supply doesn't have time, we rely on the date string
        return s.date > targetDateStr;
    });`;
let replace4 = `const suppliesAfter = store.supplies.filter(s => {
        return s.date.split('T')[0] > targetDateStr;
    });`;
code = code.replace(target4, replace4);

// Fix correctionsAfter
let target5 = `const correctionsAfter = (store.stockCorrections || []).filter(c => c.date > targetDateStr);`;
let replace5 = `const correctionsAfter = (store.stockCorrections || []).filter(c => c.date.split('T')[0] > targetDateStr);`;
code = code.replace(target5, replace5);

fs.writeFileSync('src/components/Analytics.tsx', code);
console.log("Patched dates in Analytics.tsx");
