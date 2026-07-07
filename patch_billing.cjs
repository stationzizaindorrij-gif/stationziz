const fs = require('fs');
let content = fs.readFileSync('src/components/Billing.tsx', 'utf-8');

// Rename title
content = content.replace(
  '<h3 className="font-bold text-slate-800">Fournisseurs & Clients Pro</h3>',
  '<h3 className="font-bold text-slate-800">Fournisseurs</h3>'
);

// Remove "Client" button
const btnClient = `<button 
                onClick={() => setShowPartnerModal('client')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Client
              </button>`;
if (content.includes(btnClient)) {
    content = content.replace(btnClient, '');
}

// Remove mapping of clients
const clientMap = `{store.clients.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">Client Pro</span></td>
                    <td className="p-4 font-bold text-slate-800">{c.name}</td>
                    <td className="p-4 text-slate-600">{c.phone}<br/><span className="text-xs text-slate-400">{c.email}</span></td>
                    <td className="p-4 text-slate-600 font-mono">{c.ice}</td>
                  </tr>
                ))}`;
if (content.includes(clientMap)) {
    content = content.replace(clientMap, '');
}

fs.writeFileSync('src/components/Billing.tsx', content);
console.log('Billing patched!');
