const fs = require('fs');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // We are going to find the end of the first table:
  const targetEndTable = `                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Droplet className="w-3.5 h-3.5 text-blue-500" />
                            Volumes par Carburant
                          </h4>
                        <div className="rounded-lg border border-slate-200 overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                              <tr>
                                <th className="px-3 py-2 font-medium">Type</th>
                                <th className="px-3 py-2 font-medium text-right">Volume (L)</th>
                                <th className="px-3 py-2 font-medium text-right">Montant (DH)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {Object.values(productAggregates).map((prod, idx) => (
                                <tr key={idx}>
                                  <td className="px-3 py-2 font-medium text-slate-800">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                                        <Droplet className="w-3.5 h-3.5 text-blue-500" />
                                      </div>
                                      {prod.name}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-right font-mono">{prod.liters.toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right font-mono font-bold">{prod.amount.toFixed(2)}</td>
                                </tr>
                              ))}
                              {Object.keys(productAggregates).length === 0 && (
                                <tr>
                                  <td colSpan={3} className="px-3 py-4 text-center text-slate-500 italic">Aucun carburant vendu</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>`;

  const replaceEndTable = `                          <thead className="bg-slate-100 border-y border-slate-200 text-slate-600">
                            <tr>
                              <th colSpan={2} className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-slate-500"><div className="flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5 text-blue-500" /> Volumes par Carburant</div></th>
                              <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-slate-500 text-right">Volume (L)</th>
                              <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-slate-500 text-right">Montant (DH)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-slate-50/50">
                            {Object.values(productAggregates).map((prod, idx) => (
                              <tr key={idx}>
                                <td colSpan={2} className="px-3 py-2 font-medium text-slate-800">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                                      <Droplet className="w-3.5 h-3.5 text-blue-500" />
                                    </div>
                                    {prod.name}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-slate-700">{prod.liters.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-blue-700">{prod.amount.toFixed(2)}</td>
                              </tr>
                            ))}
                            {Object.keys(productAggregates).length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-3 py-4 text-center text-slate-500 italic">Aucun carburant vendu</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">`;

  content = content.replace(targetEndTable, replaceEndTable);
  fs.writeFileSync(filePath, content);
}

processFile('src/components/Shifts.tsx');
processFile('src/components/ShiftWizard.tsx');

console.log("Done");
