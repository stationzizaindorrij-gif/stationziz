import re

with open('src/components/Reports.tsx', 'r') as f:
    content = f.read()

search = """                <div className="p-5 flex flex-col">
                  <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Espèces à remettre (Théorique)</div>
                  <div className="font-mono font-black text-emerald-700 text-2xl">{especeTheorique.toFixed(2)} DH</div>
                </div>"""

if search in content:
    content = content.replace(search, "")
    with open('src/components/Reports.tsx', 'w') as f:
        f.write(content)
    print("Reports patched espece 1")
else:
    print("search 1 not found in Reports")

search2 = """                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                  <div className="p-5 flex flex-col">
                    <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Espèces Remises (Déclarées)</div>
                    <div className="font-mono font-bold text-slate-800 text-2xl">{especeReelle.toFixed(2)} DH</div>
                  </div>
                  <div className="p-5 flex flex-col justify-center">
                    <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Écart Global</div>
                    <div className={`font-mono font-black text-2xl ${ecartGlobal < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {ecartGlobal > 0 ? '+' : ''}{ecartGlobal.toFixed(2)} DH
                    </div>
                  </div>
                </div>"""

if search2 in content:
    content = content.replace(search2, "")
    with open('src/components/Reports.tsx', 'w') as f:
        f.write(content)
    print("Reports patched espece 2")
else:
    print("search 2 not found in Reports")
