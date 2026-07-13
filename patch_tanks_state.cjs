const fs = require('fs');
let code = fs.readFileSync('src/components/Tanks.tsx', 'utf8');

code = code.replace(
  "  const [isSupplyFormOpen, setIsSupplyFormOpen] = useState(false);",
  "  const [isSupplyFormOpen, setIsSupplyFormOpen] = useState(false);\n  const [supplyToDelete, setSupplyToDelete] = useState<string | null>(null);"
);

const confirmModalStr = `      {/* CONFIRMATION MODAL FOR SUPPLY DELETION */}
      {supplyToDelete && (
        <div className="fixed inset-0 bg-[#0f172a99] backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 font-display text-lg mb-1">Confirmer la suppression</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer cette livraison ? Le volume sera déduit de la cuve associée. Cette action est irréversible.
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setSupplyToDelete(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  store.deleteSupply(supplyToDelete, 'Directeur ERP');
                  setSupplyToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg shadow-xs transition-colors"
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}`;

const formModalStr = "{/* FORMULAIRE LIVRAISON MODAL */}";

code = code.replace(formModalStr, confirmModalStr + "\n\n      " + formModalStr);

const deleteBtnStr = `                        <button 
                          onClick={() => {
                            if (window.confirm("Êtes-vous sûr de vouloir supprimer cette livraison ? Le volume sera soustrait de la cuve associée.")) {
                              store.deleteSupply(sup.id, 'Directeur ERP');
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded transition-colors"
                        >`;

const newDeleteBtnStr = `                        <button 
                          onClick={() => setSupplyToDelete(sup.id)}
                          className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded transition-colors"
                        >`;

code = code.replace(deleteBtnStr, newDeleteBtnStr);

fs.writeFileSync('src/components/Tanks.tsx', code);
