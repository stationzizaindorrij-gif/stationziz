const fs = require('fs');
let code = fs.readFileSync('src/components/Billing.tsx', 'utf8');

// For Purchase
code = code.replace(
  "{store.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}",
  "{store.products.filter(p => ['gazoil', 'sans_plomb', 'melange'].includes(p.type)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}"
);

// For Sales
code = code.replace(
  "{store.products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.salePrice} MAD/L)</option>)}",
  "{store.products.filter(p => ['gazoil', 'sans_plomb', 'melange'].includes(p.type)).map(p => <option key={p.id} value={p.id}>{p.name} ({p.salePrice} MAD/L)</option>)}"
);

fs.writeFileSync('src/components/Billing.tsx', code);
