const fs = require('fs');
let code = fs.readFileSync('src/components/Tanks.tsx', 'utf8');

const theadStr = `<th className="p-3">Coût Total d'Acquisition</th>
                  <th className="p-3">Date Réception</th>
                </tr>`;

const theadStrRep = `<th className="p-3">Coût Total d'Acquisition</th>
                  <th className="p-3">Date Réception</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>`;

const tbodyStr = `<td className="p-3 font-sans text-slate-500">{new Date(sup.date).toLocaleDateString('fr-FR')}</td>
                  </tr>`;

const tbodyStrRep = `<td className="p-3 font-sans text-slate-500">{new Date(sup.date).toLocaleDateString('fr-FR')}</td>
                    <td className="p-3 text-right">
                      {hasWriteAccess && (
                        <button 
                          onClick={() => {
                            if (window.confirm("Êtes-vous sûr de vouloir supprimer cette livraison ? Le volume sera soustrait de la cuve associée.")) {
                              store.deleteSupply(sup.id, 'Directeur ERP');
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>`;

code = code.replace(theadStr, theadStrRep);
code = code.replace(tbodyStr, tbodyStrRep);

fs.writeFileSync('src/components/Tanks.tsx', code);
