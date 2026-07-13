const fs = require('fs');
let code = fs.readFileSync('src/components/Tanks.tsx', 'utf8');

// 1. Render confirmModalConfig
const confirmRender = `      {/* Modal de Confirmation Générique */}
      {confirmModalConfig && confirmModalConfig.isOpen && (
        <div className="fixed inset-0 bg-[#0f172a99] backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 font-display text-lg mb-1">{confirmModalConfig.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {confirmModalConfig.message}
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setConfirmModalConfig(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  confirmModalConfig.onConfirm();
                  setConfirmModalConfig(null);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg shadow-xs transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}`;

const anchor = "{/* FORMULAIRE LIVRAISON MODAL */}";
if (!code.includes("Modal de Confirmation Générique")) {
  code = code.replace(anchor, confirmRender + "\n\n      " + anchor);
}

// 2. Fix the date bug in executeSupply
const executeSupplyTarget = `        invoiceNumber,
        date: new Date().toISOString()
      }, currentRole);`;
const executeSupplyReplace = `        invoiceNumber,
        date: supplyDate ? new Date(supplyDate).toISOString() : new Date().toISOString()
      }, currentRole);`;

code = code.replace(executeSupplyTarget, executeSupplyReplace);

fs.writeFileSync('src/components/Tanks.tsx', code);
console.log("Patched Tanks.tsx");
