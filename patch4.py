import re

with open('src/components/Clients.tsx', 'r') as f:
    content = f.read()

search = """          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedClients.map(client => (
              <div key={client.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl border border-indigo-100/50">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-900 transition-colors">{client.name}</h3>
                      {client.address && <p className="text-sm text-slate-500 mt-1 line-clamp-1" title={client.address}>{client.address}</p>}
                    </div>
                  </div>
                </div>"""

replace = """          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedClients.map(client => {
              const clientBonsList = store.shifts
                .filter(s => s.status === 'completed' && s.nonCashPayments && s.nonCashPayments.bonClient)
                .flatMap(shift => shift.nonCashPayments!.bonClient.filter(b => b.clientName?.toLowerCase().trim() === client.name.toLowerCase().trim()));
              const totalBons = clientBonsList.reduce((sum, b) => sum + (parseFloat(b.amount as any) || 0), 0);
              const totalPayments = (client.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0);
              const balance = totalBons - totalPayments;
              
              return (
              <div key={client.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl border border-indigo-100/50">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-900 transition-colors">{client.name}</h3>
                      {client.address && <p className="text-sm text-slate-500 mt-1 line-clamp-1" title={client.address}>{client.address}</p>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">Solde (Bons)</div>
                    <div className={`font-black font-mono text-sm ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {balance.toFixed(2)} MAD
                    </div>
                  </div>
                </div>"""

if search in content:
    content = content.replace(search, replace)
    
    # We also need to fix the closing parenthesis for paginatedClients.map
    search_end = """              </div>
            ))}
          </div>
          {paginatedClients.length === 0 && ("""
    
    replace_end = """              </div>
            );})}
          </div>
          {paginatedClients.length === 0 && ("""
    
    content = content.replace(search_end, replace_end)
    
    with open('src/components/Clients.tsx', 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Could not find search string.")

