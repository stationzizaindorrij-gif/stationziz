import re

with open('src/components/ShiftWizard.tsx', 'r') as f:
    content = f.read()

search = """                      {/* FINANCES COMPACTES */}

                      <div>
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-slate-500" />
                          Bilan Financier
                        </h4>"""

replace = """                      {/* DETAILS BOUTIQUE */}
                      {productSales.length > 0 && (
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-indigo-500" />
                            Détails de Boutique
                          </h4>
                          <div className="rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full text-xs text-left">
                              <tbody className="divide-y divide-slate-100">
                                {productSales.map((p: any) => (
                                  <tr key={p.id}>
                                    <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">{p.name}</td>
                                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{p.total.toFixed(2)} DH</td>
                                  </tr>
                                ))}
                                <tr>
                                  <td className="px-3 py-2 font-black text-slate-800 bg-slate-100 uppercase text-[10px]">Total Boutique</td>
                                  <td className="px-3 py-2 text-right font-mono font-black text-indigo-700 bg-slate-100">{totalProductSales.toFixed(2)} DH</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* DETAILS LAVAGE LA GRAISSE */}
                      {serviceSales.length > 0 && (
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Settings className="w-3.5 h-3.5 text-indigo-500" />
                            Détails de Lavage La Graisse
                          </h4>
                          <div className="rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full text-xs text-left">
                              <tbody className="divide-y divide-slate-100">
                                {serviceSales.map((s: any) => (
                                  <tr key={s.id}>
                                    <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">{s.name}</td>
                                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{s.total.toFixed(2)} DH</td>
                                  </tr>
                                ))}
                                <tr>
                                  <td className="px-3 py-2 font-black text-slate-800 bg-slate-100 uppercase text-[10px]">Total Lavage La Graisse</td>
                                  <td className="px-3 py-2 text-right font-mono font-black text-indigo-700 bg-slate-100">{totalServiceSales.toFixed(2)} DH</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* FINANCES COMPACTES */}
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-slate-500" />
                          Bilan Financier
                        </h4>"""

if search in content:
    content = content.replace(search, replace)
    with open('src/components/ShiftWizard.tsx', 'w') as f:
        f.write(content)
    print("Added to wizard")
else:
    print("search not found")
