const fs = require('fs');
let code = fs.readFileSync('src/components/Billing.tsx', 'utf8');

// Fix invoice number
code = code.replace(
  "<p className=\"text-sm font-bold text-slate-800\">N° {selectedInvoice.type === 'purchase' ? 'FACTURE' : (selectedInvoice.type === 'devis' ? 'DEVIS' : 'FACTURE')}/{selectedInvoice.invoiceNumber}</p>",
  "<p className=\"text-sm font-bold text-slate-800 uppercase\">{selectedInvoice.invoiceNumber}</p>"
);

// Fix footer
code = code.replace(
  "<p className=\"uppercase font-bold text-black mb-1\">{config.name} Capital 100 000.00 Dh, {config.address ? config.address.split('\\n')[0] : ''}</p>\n                      <p>tel : {config.phone} {config.taxId ? ' | ICE: ' + config.taxId : ''}</p>",
  "{config.documentFooter ? (\n                        <span className=\"whitespace-pre-line text-black leading-snug\">{config.documentFooter}</span>\n                      ) : (\n                        <>\n                          <p className=\"uppercase font-bold text-black mb-1\">{config.name} Capital 100 000.00 Dh, {config.address ? config.address.split('\\n')[0] : ''}</p>\n                          <p>tel : {config.phone} {config.taxId ? ' | ICE: ' + config.taxId : ''}</p>\n                        </>\n                      )}"
);

// Fix table padding/alignment
code = code.replace(
  "<tr className=\"border-b border-slate-200\">\n                        <td className=\"py-4 px-4 text-slate-600\">-</td>\n                        <td className=\"py-4 px-4 font-bold text-slate-800\">\n                          {store.products.find(p => p.id === selectedInvoice.productId)?.name}\n                        </td>\n                        <td className=\"py-4 px-4 text-center font-mono\">{selectedInvoice.quantity}</td>\n                        <td className=\"py-4 px-4 text-right font-mono\">{selectedInvoice.pricePerLiter.toFixed(2)}</td>\n                        <td className=\"py-4 px-4 text-right font-mono font-bold\">{selectedInvoice.amountHT.toFixed(2)}</td>\n                      </tr>",
  "<tr className=\"border-b border-slate-200\">\n                        <td className=\"py-3 px-4 text-slate-600 align-middle\">-</td>\n                        <td className=\"py-3 px-4 font-bold text-slate-800 align-middle\">\n                          {store.products.find(p => p.id === selectedInvoice.productId)?.name || 'HUILE 2-40 5L'}\n                        </td>\n                        <td className=\"py-3 px-4 text-center font-mono align-middle\">{selectedInvoice.quantity}</td>\n                        <td className=\"py-3 px-4 text-right font-mono align-middle\">{selectedInvoice.pricePerLiter.toFixed(2)}</td>\n                        <td className=\"py-3 px-4 text-right font-mono font-bold align-middle\">{selectedInvoice.amountHT.toFixed(2)}</td>\n                      </tr>"
);

fs.writeFileSync('src/components/Billing.tsx', code);
