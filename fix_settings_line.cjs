const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

code = code.replace(
  "  const [documentCompanyDetails,\n        documentFooter, setDocumentCompanyDetails] = useState(config.documentCompanyDetails || '');",
  "  const [documentCompanyDetails, setDocumentCompanyDetails] = useState(config.documentCompanyDetails || '');"
);

fs.writeFileSync('src/components/Settings.tsx', code);
