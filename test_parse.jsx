import React from 'react';
export function Test() {
  const selectedDetailShift = { nonCashPayments: {}, productsSold: [], servicesSold: [], expenses: [], attendantName: '', date: '', startTime: '', endTime: '', status: '', discrepancy: 0, notes: '' };
  return (
    <div className="p-5 space-y-6 overflow-y-auto overflow-x-hidden bg-slate-50">
      {(() => {
        const nonCashTotal = 0;
        const produitsTotal = 0;
        const servicesTotal = 0;
        const carburantsTotal = 0;
        const chiffreAffaires = 0;
        const depensesTotal = 0;
        const reglementsTotal = 0;
        const rechargesTotal = 0;
        const especeARemettre = 0;

        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <span className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pompiste</div>
                  <div className="font-bold text-slate-800 text-lg">{selectedDetailShift.attendantName}</div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <span className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Période</div>
                  <div className="font-bold text-slate-800 text-sm">
                    {new Date(selectedDetailShift.date).toLocaleDateString('fr-FR')} ({selectedDetailShift.startTime}) → {selectedDetailShift.endTime ? selectedDetailShift.endTime : '--:--'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6">Chiffre d'Affaires</h4>
                <div className="space-y-4 flex-grow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 text-amber-500" />
                      <span className="text-slate-600 font-medium">Carburants</span>
                    </div>
                    <span className="font-bold font-mono text-slate-800 text-[15px]">{carburantsTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 text-blue-500" />
                      <span className="text-slate-600 font-medium">Produits</span>
                    </div>
                    <span className="font-bold font-mono text-slate-800 text-[15px]">{produitsTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 text-purple-500" />
                      <span className="text-slate-600 font-medium">Services</span>
                    </div>
                    <span className="font-bold font-mono text-slate-800 text-[15px]">{servicesTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-800">Total</span>
                  <span className="font-bold font-mono text-emerald-600 text-lg">{chiffreAffaires.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6">Mouvements de Caisse</h4>
                <div className="space-y-4 flex-grow">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium text-sm">Encaissements Non-Espèces</span>
                    <span className="font-bold font-mono text-rose-600 text-[15px]">- {nonCashTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium text-sm">Dépenses (Espèces)</span>
                    <span className="font-bold font-mono text-rose-600 text-[15px]">- {depensesTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium text-sm">Règlements Dettes (Espèces)</span>
                    <span className="font-bold font-mono text-emerald-600 text-[15px]">+ {reglementsTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium text-sm">Recharges (Espèces)</span>
                    <span className="font-bold font-mono text-emerald-600 text-[15px]">+ {rechargesTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-700 rounded-xl p-8 relative overflow-hidden shadow-lg mt-6">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-500 rounded-full opacity-50 blur-2xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-emerald-900 rounded-full opacity-30 blur-2xl pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                <div className="flex items-center gap-2 text-emerald-100 uppercase tracking-widest text-[11px] font-bold">
                  <span className="w-4 h-4" />
                  Espèces à remettre par {selectedDetailShift.attendantName}
                </div>
                <div className="text-4xl md:text-5xl font-black font-mono text-white tracking-tight">
                  {especeARemettre.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH
                </div>
              </div>
            </div>

            <details className="bg-white rounded-xl shadow-sm border border-slate-200 group overflow-hidden">
              <summary className="cursor-pointer p-5 flex items-center justify-between font-bold text-slate-700 uppercase tracking-wider text-xs list-none focus:outline-none focus:ring-2 focus:ring-emerald-500">
                DÉTAIL ENCAISSEMENTS NON-ESPÈCES
                <span className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-5 pt-0 border-t border-slate-100 bg-slate-50 space-y-3 mt-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">TAQATI:</span>
                  <strong className="font-mono">0 DH</strong>
                </div>
              </div>
            </details>

            {selectedDetailShift.status === 'completed' && selectedDetailShift.discrepancy !== undefined && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mt-4">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Bilan de clôture</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-600">Caisse Réelle Déposée</span>
                     <span className="font-bold font-mono text-slate-800">0 DH</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-100">
                     <span className="text-slate-600 font-bold">Écart de caisse</span>
                     {(() => {
                        const disc = selectedDetailShift.discrepancy || 0;
                        return (
                          <span className={`font-bold font-mono text-lg ${disc < 0 ? 'text-rose-600' : disc > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                            {disc === 0 ? 'Aucun écart' : `${disc > 0 ? '+' : ''}${disc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH`}
                          </span>
                        );
                     })()}
                  </div>
                  {selectedDetailShift.notes && (
                    <div className="mt-4 p-3 bg-amber-50 text-amber-800 text-xs rounded border border-amber-200 italic">
                      "{selectedDetailShift.notes}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
