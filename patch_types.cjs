const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  "  documentColumnsOrder?: string[];\n}",
  "  documentColumnsOrder?: string[];\n  documentFooter?: string;\n}"
);

fs.writeFileSync('src/types.ts', code);
