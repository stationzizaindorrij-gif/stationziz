import re

with open('src/components/DailyClosing.tsx', 'r') as f:
    content = f.read()

search = """                <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                    <div className="p-4 flex flex-col">
                      <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Encaissement</div>
                      <div className="font-mono font-bold text-indigo-600 text-lg">+{totalNonCashPayments.toFixed(2)} DH</div>
                    </div>
                    <div className="p-4 flex flex-col">
                      <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Dépenses</div>
                      <div className="font-mono font-bold text-rose-600 text-lg">-{totalExpenses.toFixed(2)} DH</div>
                    </div>
                    <div className="p-4 bg-emerald-50 flex flex-col justify-center">
                      <div className="text-[10px] uppercase text-emerald-600 font-bold mb-1">Caisse Théorique</div>
                      <div className="font-mono font-black text-emerald-700 text-xl">{theoreticalCash.toFixed(2)} DH</div>
                    </div>
                  </div>
                  <div className="border-t border-slate-200 grid grid-cols-2 divide-x divide-slate-200 bg-slate-50">
                    <div className="p-4 flex flex-col">
                      <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Caisse Réelle</div>
                      <div className="font-mono font-bold text-slate-800 text-lg">{parseFloat(realCashInput || "0").toFixed(2)} DH</div>
                    </div>
                    <div className="p-4 flex flex-col justify-center">
                      <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Écart</div>
                      <div className={`font-mono font-black text-xl ${ecart < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{ecart > 0 ? '+' : ''}{ecart.toFixed(2)} DH</div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-800 text-white space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="text-sm uppercase text-slate-300 font-bold tracking-widest">Total Carburant</div>
                      <div className="font-mono font-bold text-white text-lg">{fuelSalesDetails.totalFuelAmount.toFixed(2)} <span className="text-slate-400 text-sm">DH</span></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm uppercase text-slate-300 font-bold tracking-widest">Total Boutique</div>
                      <div className="font-mono font-bold text-white text-lg">{totalProductSales.toFixed(2)} <span className="text-slate-400 text-sm">DH</span></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm uppercase text-slate-300 font-bold tracking-widest">Total Lavage La Graisse</div>
                      <div className="font-mono font-bold text-white text-lg">{totalServiceSales.toFixed(2)} <span className="text-slate-400 text-sm">DH</span></div>
                    </div>
                    <div className="pt-3 border-t border-slate-700 flex justify-between items-center">
                      <div className="text-sm uppercase text-white font-black tracking-widest">Total Global</div>
                      <div className="font-mono font-black text-white text-2xl">{grandTotalSales.toFixed(2)} <span className="text-slate-400 text-lg">DH</span></div>
                    </div>
                  </div>
                </div>"""

replace = """                {/* DETAILS BOUTIQUE */}
                {productSales.length > 0 && (
                  <div className="mb-4">
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
                  <div className="mb-4">
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

                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-slate-500" />
                  Bilan Financier
                </h4>
                <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                    <div className="p-4 flex flex-col">
                      <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Encaissement</div>
                      <div className="font-mono font-bold text-indigo-600 text-lg">+{totalNonCashPayments.toFixed(2)} DH</div>
                    </div>
                    <div className="p-4 flex flex-col">
                      <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Dépenses</div>
                      <div className="font-mono font-bold text-rose-600 text-lg">-{totalExpenses.toFixed(2)} DH</div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-800 flex justify-between items-center text-white">
                    <div className="text-sm uppercase text-slate-300 font-black tracking-widest">Total Global</div>
                    <div className="font-mono font-black text-white text-2xl">{(totalNonCashPayments - totalExpenses).toFixed(2)} <span className="text-slate-400 text-lg">DH</span></div>
                  </div>
                </div>"""

if search in content:
    content = content.replace(search, replace)
    with open('src/components/DailyClosing.tsx', 'w') as f:
        f.write(content)
    print("DailyClosing patched")
else:
    print("search not found in DailyClosing")

