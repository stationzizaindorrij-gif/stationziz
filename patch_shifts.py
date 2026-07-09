import re

with open('src/components/Shifts.tsx', 'r') as f:
    content = f.read()

# 1. Non-Espèces -> Encaissement
search_non_especes = """                          <div className="p-4 flex flex-col">
                            <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Non-Espèces</div>
                            <div className="font-mono font-bold text-rose-600 text-lg">-{nonCashTotal.toFixed(2)} DH</div>
                          </div>"""
replace_non_especes = """                          <div className="p-4 flex flex-col">
                            <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Encaissement</div>
                            <div className="font-mono font-bold text-indigo-600 text-lg">+{nonCashTotal.toFixed(2)} DH</div>
                          </div>"""
content = content.replace(search_non_especes, replace_non_especes)

# 2. Total Ventes breakdown
search_total = """                        <div className="p-4 bg-slate-800 flex justify-between items-center text-white">
                          <div className="text-sm uppercase text-slate-300 font-black tracking-widest">Total Ventes</div>
                          <div className="font-mono font-black text-white text-2xl">{chiffreAffaires.toFixed(2)} <span className="text-slate-400 text-lg">DH</span></div>
                        </div>"""

replace_total = """                        <div className="p-4 bg-slate-800 text-white space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="text-sm uppercase text-slate-300 font-bold tracking-widest">Total Carburant</div>
                            <div className="font-mono font-bold text-white text-lg">{carburantsTotal.toFixed(2)} <span className="text-slate-400 text-sm">DH</span></div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm uppercase text-slate-300 font-bold tracking-widest">Total Boutique</div>
                            <div className="font-mono font-bold text-white text-lg">{produitsTotal.toFixed(2)} <span className="text-slate-400 text-sm">DH</span></div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm uppercase text-slate-300 font-bold tracking-widest">Total Lavage La Graisse</div>
                            <div className="font-mono font-bold text-white text-lg">{servicesTotal.toFixed(2)} <span className="text-slate-400 text-sm">DH</span></div>
                          </div>
                          <div className="pt-3 border-t border-slate-700 flex justify-between items-center">
                            <div className="text-sm uppercase text-white font-black tracking-widest">Total Global</div>
                            <div className="font-mono font-black text-white text-2xl">{chiffreAffaires.toFixed(2)} <span className="text-slate-400 text-lg">DH</span></div>
                          </div>
                        </div>"""
content = content.replace(search_total, replace_total)

# 3. Détail des Encaissements Non-Espèces
content = content.replace("Détail des Encaissements Non-Espèces", "Détail des Encaissements")

with open('src/components/Shifts.tsx', 'w') as f:
    f.write(content)

print("Shifts patched")
