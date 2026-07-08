import re

with open('src/components/Clients.tsx', 'r') as f:
    content = f.read()

search = """        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Nom / Raison Sociale</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Coordonnées</th>
                <th className="px-6 py-4 font-medium">ICE / IF</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{client.name}</div>
                        {client.address && <div className="text-xs text-slate-500 max-w-[200px] truncate">{client.address}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="w-4 h-4 text-slate-400" />
                      {client.contact || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {client.phone || '-'}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {client.email || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600 font-mono">
                      <Building className="w-4 h-4 text-slate-400" />
                      {client.ice || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedClient(client)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Détails & Règlements"
                      >
                        <Wallet className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(client)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setClientToDelete(client.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>"""

replace = """        <div className="p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                </div>
                
                <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {client.ice ? `ICE: ${client.ice}` : 'Client Particulier'}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedClient(client)}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Détails & Règlements"
                    >
                      <Wallet className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openEditModal(client)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setClientToDelete(client.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {paginatedClients.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
              Aucun client trouvé.
            </div>
          )}
        </div>"""

if search in content:
    content = content.replace(search, replace)
    with open('src/components/Clients.tsx', 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Could not find search string. Searching with regex...")
    search_re = re.compile(r'<div className="overflow-x-auto">\s*<table className="w-full text-left">.*?</table>\s*</div>', re.DOTALL)
    if search_re.search(content):
        content = search_re.sub(replace, content)
        with open('src/components/Clients.tsx', 'w') as f:
            f.write(content)
        print("Replaced with regex successfully")
    else:
        print("Regex failed too.")

