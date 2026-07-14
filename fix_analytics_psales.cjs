const fs = require('fs');
let code = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

let target = "const pSales = store.sales.filter(s => s.productId === p.id && s.date <= selectedEndDateObj).map(s => ({ type: 'sale', date: s.date, time: s.time || '00:00:00', qty: s.qty, price: s.price }));";
let replacement = "const pSales = store.sales.filter(s => s.productId === p.id && s.date.split('T')[0] <= selectedEndDateObj).map(s => ({ type: 'sale', date: s.date.split('T')[0], time: s.time || (s.date.includes('T') ? s.date.split('T')[1].substring(0,8) : '00:00:00'), qty: s.qty, price: s.price }));";

code = code.replace(target, replacement);

// There is also store.expenses. Let's check expenses in Analytics.tsx:
// "const expensesList = store.expenses.filter(e => e.date <= selectedEndDateObj).map..."
let target2 = "const expensesList = store.expenses.filter(e => e.date <= selectedEndDateObj).map(e => ({";
let replacement2 = "const expensesList = store.expenses.filter(e => e.date.split('T')[0] <= selectedEndDateObj).map(e => ({";
code = code.replace(target2, replacement2);

fs.writeFileSync('src/components/Analytics.tsx', code);
console.log("Patched Analytics.tsx");
