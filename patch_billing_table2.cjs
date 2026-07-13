const fs = require('fs');
let code = fs.readFileSync('src/components/Billing.tsx', 'utf8');

const tableStr = `                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr style={{ backgroundColor: config.documentColor || '#f39c12', color: 'white' }}>
                        <th className="py-3 px-4 align-middle font-bold uppercase text-[10px] tracking-wider w-16">Numéro</th>
                        <th className="py-3 px-4 align-middle font-bold uppercase text-[10px] tracking-wider">Désignation</th>
                        <th className="py-3 px-4 align-middle font-bold uppercase text-[10px] tracking-wider text-center">Quantité</th>
                        <th className="py-3 px-4 align-middle font-bold uppercase text-[10px] tracking-wider text-right">Prix Unitaire</th>
                        <th className="py-3 px-4 align-middle font-bold uppercase text-[10px] tracking-wider text-right">Montant HT</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="py-3 px-4 text-slate-600 align-middle">-</td>
                        <td className="py-3 px-4 font-bold text-slate-800 align-middle">
                          {store.products.find(p => p.id === selectedInvoice.productId)?.name || 'HUILE 2-40 5L'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono align-middle">{selectedInvoice.quantity}</td>
                        <td className="py-3 px-4 text-right font-mono align-middle">{selectedInvoice.pricePerLiter.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold align-middle">{selectedInvoice.amountHT.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>`;

const newTableStr = `                  <table className="w-full text-sm text-center">
                    <thead>
                      <tr style={{ backgroundColor: config.documentColor || '#f39c12', color: 'white' }}>
                        <th className="py-4 px-4 align-middle font-bold uppercase text-[10px] tracking-wider w-16 text-center">N°</th>
                        <th className="py-4 px-4 align-middle font-bold uppercase text-[10px] tracking-wider text-left">Désignation</th>
                        <th className="py-4 px-4 align-middle font-bold uppercase text-[10px] tracking-wider text-center">Quantité</th>
                        <th className="py-4 px-4 align-middle font-bold uppercase text-[10px] tracking-wider text-center">Prix Unitaire</th>
                        <th className="py-4 px-4 align-middle font-bold uppercase text-[10px] tracking-wider text-center">Montant HT</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="py-5 px-4 text-slate-600 align-middle text-center">-</td>
                        <td className="py-5 px-4 font-bold text-slate-800 align-middle text-left">
                          {store.products.find(p => p.id === selectedInvoice.productId)?.name || 'Produit'}
                        </td>
                        <td className="py-5 px-4 text-center font-mono align-middle">{selectedInvoice.quantity}</td>
                        <td className="py-5 px-4 text-center font-mono align-middle">{selectedInvoice.pricePerLiter.toFixed(2)}</td>
                        <td className="py-5 px-4 text-center font-mono font-bold align-middle">{selectedInvoice.amountHT.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>`;

code = code.replace(tableStr, newTableStr);

fs.writeFileSync('src/components/Billing.tsx', code);
