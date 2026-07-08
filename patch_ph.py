import re

with open('src/components/PriceHistory.tsx', 'r') as f:
    content = f.read()

search = """      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <History className="w-7 h-7 text-indigo-600" />
            Historique des Prix
          </h2>
          <p className="text-slate-500 mt-1">Consultez l'évolution des prix d'achat et de vente de vos carburants.</p>
        </div>
      </div>"""

if search in content:
    content = content.replace(search, "")
    with open('src/components/PriceHistory.tsx', 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Could not find search string.")
