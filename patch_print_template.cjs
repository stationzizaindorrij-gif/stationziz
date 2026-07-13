const fs = require('fs');

let code = fs.readFileSync('src/components/Billing.tsx', 'utf8');

const startMarker = "{/* === PDF PRINT VIEW (Hidden on screen, visible on print) === */}";
let startIdx = code.indexOf(startMarker);
if (startIdx === -1) {
  console.log("NOT FOUND");
  process.exit(1);
}

let totalIdx = code.indexOf("TOTAL</div>", startIdx);
let endIdx = code.indexOf("              </div>", totalIdx) + "              </div>".length;

const before = code.substring(0, startIdx);
const after = code.substring(endIdx);

const newTemplate = startMarker + `
              <div className="hidden print:block w-full h-full bg-white text-black font-sans relative" style={{ padding: '40px', minHeight: '297mm' }}>
                {/* Header Row */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-2 max-w-sm">
                    {config.logo && config.logo.length > 5 ? (
                      <div className="h-16 mb-2">
                        <img src={config.logo} alt="Logo" className="h-full object-contain object-left" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <strong className="text-xl block mb-1 uppercase tracking-wide">{config.name}</strong>
                    )}
                    <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                      {config.documentCompanyDetails || config.address}
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-3xl font-bold uppercase tracking-wider mb-2" style={{ color: config.documentColor || '#f39c12' }}>
                      {selectedInvoice.type === 'purchase' ? 'FACTURE' : (selectedInvoice.type === 'devis' ? 'DEVIS' : 'FACTURE')}
                    </h1>
                    <p className="text-sm font-bold text-slate-800">N° {selectedInvoice.type === 'purchase' ? 'FACTURE' : (selectedInvoice.type === 'devis' ? 'DEVIS' : 'FACTURE')}/{selectedInvoice.invoiceNumber}</p>
                    <p className="text-xs text-slate-600 mt-1">Date : <span className="font-bold">{selectedInvoice.date}</span></p>
                  </div>
                </div>

                {/* Client Info Block */}
                <div className="mt-12">
                  <div className="inline-block border border-slate-200 rounded-lg p-5 min-w-[300px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Adressé à</span>
                    <h3 className="text-base font-bold text-slate-800 mb-1">
                      {selectedInvoice.type === 'purchase' 
                         ? store.clients.find(s => s.id === (selectedInvoice as any).supplierId)?.name 
                         : store.clients.find(c => c.id === (selectedInvoice as any).clientId)?.name}
                    </h3>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      <p>
                        {selectedInvoice.type === 'purchase' 
                           ? store.clients.find(s => s.id === (selectedInvoice as any).supplierId)?.ice 
                           : store.clients.find(c => c.id === (selectedInvoice as any).clientId)?.ice}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="mt-12">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr style={{ backgroundColor: config.documentColor || '#f39c12', color: 'white' }}>
                        <th className="py-2 px-4 font-bold uppercase text-[10px] tracking-wider w-16">Numéro</th>
                        <th className="py-2 px-4 font-bold uppercase text-[10px] tracking-wider">Désignation</th>
                        <th className="py-2 px-4 font-bold uppercase text-[10px] tracking-wider text-center">Quantité</th>
                        <th className="py-2 px-4 font-bold uppercase text-[10px] tracking-wider text-right">Prix Unitaire</th>
                        <th className="py-2 px-4 font-bold uppercase text-[10px] tracking-wider text-right">Montant HT</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="py-4 px-4 text-slate-600">-</td>
                        <td className="py-4 px-4 font-bold text-slate-800">
                          {store.products.find(p => p.id === selectedInvoice.productId)?.name}
                        </td>
                        <td className="py-4 px-4 text-center font-mono">{selectedInvoice.quantity}</td>
                        <td className="py-4 px-4 text-right font-mono">{selectedInvoice.pricePerLiter.toFixed(2)}</td>
                        <td className="py-4 px-4 text-right font-mono font-bold">{selectedInvoice.amountHT.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totals Section */}
                <div className="mt-8 flex justify-between items-start gap-8">
                  {/* Amount in words */}
                  <div className="flex-1 bg-slate-50 p-4 border-l-4" style={{ borderColor: config.documentColor || '#f39c12' }}>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Arrêté la présente facture à la somme de :</p>
                    <p className="text-sm font-bold italic text-slate-800">
                      {selectedInvoice.amountTTC.toFixed(2)} dirhams
                    </p>
                  </div>
                  
                  {/* Numbers */}
                  <div className="w-72">
                    <div className="flex justify-between py-2 border-b border-slate-100 text-sm">
                      <span className="text-slate-600">Total ht</span>
                      <span className="font-mono">{selectedInvoice.amountHT.toFixed(2)} MAD</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100 text-sm">
                      <span className="text-slate-600">TVA</span>
                      <span className="font-mono">{(selectedInvoice.amountTTC - selectedInvoice.amountHT).toFixed(2)} MAD</span>
                    </div>
                    <div className="flex justify-between py-3 text-base">
                      <span className="font-bold text-slate-800">Montant TTC</span>
                      <span className="font-bold font-mono text-slate-800">{selectedInvoice.amountTTC.toFixed(2)} MAD</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-10 left-10 right-10">
                  <div className="border-t border-black pt-4 flex justify-between items-end">
                    <div className="flex-1 text-center text-[10px] text-slate-600 leading-relaxed">
                      <p className="uppercase font-bold text-black mb-1">{config.name} Capital 100 000.00 Dh, {config.address ? config.address.split('\\n')[0] : ''}</p>
                      <p>tel : {config.phone} {config.taxId ? ' | ICE: ' + config.taxId : ''}</p>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Page 1 / 1
                    </div>
                  </div>
                </div>
              </div>`;

fs.writeFileSync('src/components/Billing.tsx', before + newTemplate + after);
