const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const t1 = `...pSales.map(s => ({ type: 'sale', date: s.date, time: s.time || '00:00:00', price: s.price })),`;
const r1 = `...pSales.map(s => ({ type: 'sale', date: s.date.includes('T') ? s.date.split('T')[0] : s.date, time: s.time || (s.date.includes('T') ? s.date.split('T')[1].substring(0,8) : '00:00:00'), price: s.price })),`;

const t2 = `...pSupplies.map(s => ({ type: 'supply', date: s.date, time: '00:00:00', price: s.purchasePrice }))`;
const r2 = `...pSupplies.map(s => ({ type: 'supply', date: s.date.includes('T') ? s.date.split('T')[0] : s.date, time: s.time || (s.date.includes('T') ? s.date.split('T')[1].substring(0,8) : '00:00:00'), price: s.purchasePrice }))`;

code = code.replace(t1, r1);
code = code.replace(t2, r2);

// There's also `date: s.date` inside pSales/pSupplies filter earlier
const t3 = `const pSales = sales.filter(s => s.productId === p.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());`;
const r3 = `const pSales = sales.filter(s => s.productId === p.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());`; // no change here, sorting by original date works

fs.writeFileSync('src/store.ts', code);
console.log('Fixed migration strings');
