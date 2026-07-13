const fs = require('fs');
let code = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

const targetState = `  const [reportAttendant, setReportAttendant] = useState<string>('all');`;
const replaceState = `  const [reportAttendant, setReportAttendant] = useState<string>('all');\n  const [expandedPumpProduct, setExpandedPumpProduct] = useState<string | null>(null);`;
code = code.replace(targetState, replaceState);

const targetRender = `                    return (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className={\`w-2 h-2 rounded-full \${theme.bg}\`}></div>
                            <span className="font-bold text-slate-700">{info.name || theme.label}</span>
                          </div>
                        </td>
                        <td className="py-4 text-right font-mono text-slate-600">{data.liters.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} L</td>
                        <td className="py-4 text-right font-mono text-slate-500">x {data.purchase.toFixed(2)} MAD</td>
                        <td className="py-4 text-right font-mono font-bold text-slate-800">{data.montant.toLocaleString('fr-FR', {minimumFractionDigits: 2})} MAD</td>
                      </tr>
                    );`;

const replaceRender = `                    return (
                      <React.Fragment key={product.id}>
                        <tr className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setExpandedPumpProduct(expandedPumpProduct === product.id ? null : product.id)}>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <div className={\`w-2 h-2 rounded-full \${theme.bg}\`}></div>
                              <span className="font-bold text-slate-700">{info.name || theme.label}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-2">Détails PUMP</span>
                            </div>
                          </td>
                          <td className="py-4 text-right font-mono text-slate-600">{data.liters.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} L</td>
                          <td className="py-4 text-right font-mono text-slate-500">x {data.purchase.toFixed(2)} MAD</td>
                          <td className="py-4 text-right font-mono font-bold text-slate-800">{data.montant.toLocaleString('fr-FR', {minimumFractionDigits: 2})} MAD</td>
                        </tr>
                        {expandedPumpProduct === product.id && data.historyPump && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={4} className="p-0 border-b border-slate-100">
                              <div className="p-4 pl-8 border-l-2 border-indigo-500 m-2 rounded-r-lg bg-white shadow-sm overflow-x-auto">
                                <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Historique PUMP (Prix Unitaire Moyen Pondéré)</h4>
                                <table className="w-full text-xs text-left">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-slate-400">
                                      <th className="pb-2 font-medium">Date</th>
                                      <th className="pb-2 font-medium">Événement</th>
                                      <th className="pb-2 text-right font-medium">Stock Avant (L)</th>
                                      <th className="pb-2 text-right font-medium">Qté Livrée (L)</th>
                                      <th className="pb-2 text-right font-medium">Prix Achat (MAD)</th>
                                      <th className="pb-2 text-right font-medium">Nouveau Stock (L)</th>
                                      <th className="pb-2 text-right font-medium text-indigo-600">Nouveau PUMP (MAD)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {data.historyPump.map((h, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-2 text-slate-600">{h.date === 'Initial' ? 'Stock Initial (03/07)' : new Date(h.date).toLocaleDateString('fr-FR')}</td>
                                        <td className="py-2">
                                          <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold \${h.type === 'initial' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-600'}\`}>
                                            {h.type === 'initial' ? 'Initialisation' : 'Livraison'}
                                          </span>
                                        </td>
                                        <td className="py-2 text-right font-mono text-slate-500">{h.stockBefore.toLocaleString('fr-FR', {minimumFractionDigits: 2})}</td>
                                        <td className="py-2 text-right font-mono text-slate-700">+{h.qty.toLocaleString('fr-FR', {minimumFractionDigits: 2})}</td>
                                        <td className="py-2 text-right font-mono text-slate-700">{h.price.toFixed(2)}</td>
                                        <td className="py-2 text-right font-mono text-slate-800 font-medium">{h.stockAfter.toLocaleString('fr-FR', {minimumFractionDigits: 2})}</td>
                                        <td className="py-2 text-right font-mono font-bold text-indigo-600">{h.newPump.toFixed(2)}</td>
                                      </tr>
                                    ))}
                                    {data.historyPump.length === 0 && (
                                      <tr>
                                        <td colSpan={7} className="py-4 text-center text-slate-400 italic">Aucune donnée historique de livraison pour calculer le PUMP.</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );`;

code = code.replace(targetRender, replaceRender);
fs.writeFileSync('src/components/Analytics.tsx', code);
console.log("Patched PUMP UI.");
