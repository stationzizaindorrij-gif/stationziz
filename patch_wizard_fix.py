import re

with open('src/components/ShiftWizard.tsx', 'r') as f:
    content = f.read()

search = """                          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                            <div className="p-4 flex flex-col">
                              <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Encaissement</div>
                              <div className="font-mono font-bold text-indigo-600 text-lg">+{totalNonCashPayments.toFixed(2)} DH</div>
                            </div>
                            <div className="p-4 flex flex-col">
                              <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Dépenses</div>
                              <div className="font-mono font-bold text-rose-600 text-lg">-{cashExpenses.toFixed(2)} DH</div>
                            </div>
                            <div className="p-4 bg-emerald-50 flex flex-col justify-center">
                              <div className="text-[10px] uppercase text-emerald-600 font-bold mb-1">Espèces à remettre</div>
                              <div className="font-mono font-black text-emerald-700 text-xl">{especeARemettre.toFixed(2)} DH</div>
                            </div>
                          </div>"""

replace = """                          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                            <div className="p-4 flex flex-col">
                              <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Encaissement</div>
                              <div className="font-mono font-bold text-indigo-600 text-lg">+{totalNonCashPayments.toFixed(2)} DH</div>
                            </div>
                            <div className="p-4 flex flex-col">
                              <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Dépenses</div>
                              <div className="font-mono font-bold text-rose-600 text-lg">-{cashExpenses.toFixed(2)} DH</div>
                            </div>
                          </div>"""

if search in content:
    content = content.replace(search, replace)
    with open('src/components/ShiftWizard.tsx', 'w') as f:
        f.write(content)
    print("ShiftWizard patched 1")
else:
    print("search not found")

search2 = """                          <div className="p-4 bg-slate-800 text-white space-y-3">
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
                          </div>"""
replace2 = """                          <div className="p-4 bg-slate-800 flex justify-between items-center text-white">
                            <div className="text-sm uppercase text-slate-300 font-black tracking-widest">Total Global</div>
                            <div className="font-mono font-black text-white text-2xl">{(totalNonCashPayments - cashExpenses).toFixed(2)} <span className="text-slate-400 text-lg">DH</span></div>
                          </div>"""

if search2 in content:
    content = content.replace(search2, replace2)
    with open('src/components/ShiftWizard.tsx', 'w') as f:
        f.write(content)
    print("ShiftWizard patched 2")
else:
    print("search2 not found")
