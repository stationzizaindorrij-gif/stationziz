const fs = require('fs');
let code = fs.readFileSync('src/components/Billing.tsx', 'utf8');

code = code.replace(
  /<th className="py-2 px-4/g,
  '<th className="py-3 px-4 align-middle'
);

fs.writeFileSync('src/components/Billing.tsx', code);
