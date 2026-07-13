const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

code = code.replace(
  "documentCompanyDetails,\n        documentNumbering",
  "documentCompanyDetails,\n        documentFooter,\n        documentNumbering"
);

fs.writeFileSync('src/components/Settings.tsx', code);
