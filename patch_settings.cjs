const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

code = code.replace(
  "const [documentCompanyDetails, setDocumentCompanyDetails] = useState(config.documentCompanyDetails || '');",
  "const [documentCompanyDetails, setDocumentCompanyDetails] = useState(config.documentCompanyDetails || '');\n  const [documentFooter, setDocumentFooter] = useState(config.documentFooter || '');"
);

code = code.replace(
  "setDocumentCompanyDetails(config.documentCompanyDetails || '');",
  "setDocumentCompanyDetails(config.documentCompanyDetails || '');\n    setDocumentFooter(config.documentFooter || '');"
);

code = code.replace(
  "documentCompanyDetails,",
  "documentCompanyDetails,\n        documentFooter,"
);

const footerInputHTML = `              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase block">Pied de page (Facture / Devis)</label>
                <textarea
                  disabled={!hasWriteAccess}
                  value={documentFooter}
                  onChange={(e) => setDocumentFooter(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 min-h-[60px] whitespace-pre"
                  placeholder="Ex: YOULAS SARL Capital 100 000.00 Dh, Bd...\\ntel : 0522..."
                />
              </div>

              <div>`;

code = code.replace(
  "              <div>\n                <label className=\"text-xs font-bold text-slate-500 uppercase block mb-2\">Numérotation</label>",
  footerInputHTML + "\n                <label className=\"text-xs font-bold text-slate-500 uppercase block mb-2\">Numérotation</label>"
);

fs.writeFileSync('src/components/Settings.tsx', code);
