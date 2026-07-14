const fs = require('fs');
let code = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

// fix pSupplies
let target1 = `s.time || (s.date.includes('T') ? s.date.split('T')[1].substring(0,8) : '00:00:00')`;
let replace1 = `(s as any).time || (s.date.includes('T') ? s.date.split('T')[1].substring(0,8) : '00:00:00')`;

code = code.split(target1).join(replace1);

// fix pCorrections
let target2 = `c.time || (c.date.includes('T') ? c.date.split('T')[1].substring(0,8) : '00:00:00')`;
let replace2 = `(c as any).time || (c.date.includes('T') ? c.date.split('T')[1].substring(0,8) : '00:00:00')`;

code = code.split(target2).join(replace2);

// fix type: string; date: string; time: any; qty: number; (missing price) in Analytics.tsx
let target3 = `}).map(c => ({ type: 'correction', date: c.date.split('T')[0], time: (c as any).time || (c.date.includes('T') ? c.date.split('T')[1].substring(0,8) : '00:00:00'), qty: c.qtyAfter - c.qtyBefore }));`;
let replace3 = `}).map(c => ({ type: 'correction', date: c.date.split('T')[0], time: (c as any).time || (c.date.includes('T') ? c.date.split('T')[1].substring(0,8) : '00:00:00'), qty: c.qtyAfter - c.qtyBefore, price: 0 }));`;
code = code.replace(target3, replace3);

let target4 = `const pCorrections = (store.stockCorrections || []).filter(c => {`;
let replace4 = `const pCorrections = (store.stockCorrections || []).filter((c: any) => {`;
code = code.replace(target4, replace4);

fs.writeFileSync('src/components/Analytics.tsx', code);

// Fix store.ts TS errors
let storeCode = fs.readFileSync('src/store.ts', 'utf8');
storeCode = storeCode.replace(`const shiftData: Omit<Shift,`, `const shiftData: any /* Omit<Shift,`);
storeCode = storeCode.replace(`} = {`, `} */ = {`);

fs.writeFileSync('src/store.ts', storeCode);
