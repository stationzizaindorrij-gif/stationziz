import React, { useState } from 'react';
import { 
  DollarSign, ArrowUpRight, ArrowDownRight, Archive, CheckCircle, 
  AlertTriangle, Play, X, User, Clock, FileText, Calendar, Plus 
} from 'lucide-react';
import { ERPStoreType } from '../store';

interface RegistryProps {
  store: ERPStoreType;
}

export default function Registry({ store }: RegistryProps) {
  const { 
    cashRegistry, openCashRegistry, addCashMovement, closeCashRegistry, currentRole 
  } = store;

  // Form states
  const [isMovementFormOpen, setIsMovementFormOpen] = useState(false);
  const [isCloseFormOpen, setIsCloseFormOpen] = useState(false);
  const [isOpenFormOpen, setIsOpenFormOpen] = useState(false);

  // Movement Form fields
  const [mvtType, setMvtType] = useState<'input' | 'output'>('input');
  const [mvtAmount, setMvtAmount] = useState('');
  const [mvtLabel, setMvtLabel] = useState('');

  // Opening fields
  const [openAmount, setOpenAmount] = useState('500');

  // Closing fields
  const [realCashClose, setRealCashClose] = useState('');

  const hasWriteAccess = currentRole === 'admin' || currentRole === 'manager' || currentRole === 'cashier';

  const handleOpenRegistry = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(openAmount);
    if (isNaN(amt) || amt < 0) {
      alert("Le fond de caisse initial doit être supérieur ou égal à zéro.");
      return;
    }
    openCashRegistry(amt, 'Directeur ERP');
    setIsOpenFormOpen(false);
  };

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(mvtAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Le montant doit être un nombre strictement positif.");
      return;
    }
    if (!mvtLabel.trim()) {
      alert("Veuillez saisir un libellé.");
      return;
    }
    addCashMovement(mvtType, amt, mvtLabel.trim(), 'Directeur ERP');
    
    // Clear state
    setMvtAmount('');
    setMvtLabel('');
    setIsMovementFormOpen(false);
  };

  const handleCloseRegistry = (e: React.FormEvent) => {
    e.preventDefault();
    const realAmt = parseFloat(realCashClose);
    if (isNaN(realAmt) || realAmt < 0) {
      alert("Veuillez saisir un montant réel compté valide.");
      return;
    }
    closeCashRegistry(realAmt, 'Directeur ERP');
    
    setRealCashClose('');
    setIsCloseFormOpen(false);
  };

  return (
    <div className="space-y-6" id="registry-view">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Gestion Financière & Caisse</h1>
          <p className="text-sm text-slate-500">Supervisez l'état du tiroir-caisse de la station, réalisez des dépôts ou sorties de fonds de sécurité.</p>
        </div>
      </div>

      {/* État de la caisse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne Gauche : Statut et Actions de Session */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Session de caisse active</h3>
          
          {cashRegistry.isOpen ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase">Statut</span>
                  <span className="text-sm font-bold text-emerald-600">OUVERTE & SÉCURISÉE</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Ouverte par :</span>
                  <strong className="text-slate-700">{cashRegistry.openedBy}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Date d'ouverture :</span>
                  <strong className="text-slate-700 font-mono">{new Date(cashRegistry.openedAt).toLocaleString('fr-FR')}</strong>
                </div>
              </div>

              {hasWriteAccess && (
                <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => setIsMovementFormOpen(true)}
                    className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Enregistrer Entrée / Sortie de Caisse
                  </button>
                  <button 
                    onClick={() => {
                      setRealCashClose(cashRegistry.theoreticalCash.toString());
                      setIsCloseFormOpen(true);
                    }}
                    className="w-full px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Clôturer la Caisse & Faire le Bilan
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase">Statut</span>
                  <span className="text-sm font-bold text-slate-500">FERMÉE</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Le tiroir-caisse de la station est verrouillé. Aucune vente de shift ou mouvement manuel de trésorerie ne peut être comptabilisé dans le bilan de caisse actuel.
              </p>
              {hasWriteAccess && (
                <button 
                  onClick={() => setIsOpenFormOpen(true)}
                  className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Ouvrir la caisse de la station
                </button>
              )}
            </div>
          )}
        </div>

        {/* Colonne Centre : Chiffres de caisse en temps réel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Solde théorique instantané</h3>
          
          <div className="py-4 text-center">
            <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Encaisse théorique calculée</span>
            <h2 className="text-3xl font-black font-mono text-slate-900 mt-1">
              {(cashRegistry.theoreticalCash || 0).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500 font-mono">
            <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-sans block font-semibold uppercase">Fond de départ</span>
              <strong className="text-slate-700">{(cashRegistry.openingCash || 0).toLocaleString()} MAD</strong>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-sans block font-semibold uppercase">Flux de shift</span>
              <strong className="text-emerald-600">+{cashRegistry.inputs.filter(i => i.label.includes('shift')).reduce((acc, i) => acc + i.amount, 0).toLocaleString()} MAD</strong>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Mouvements récents de la session */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Flux de Trésorerie</h3>
          
          <div className="flex-1 max-h-36 overflow-y-auto divide-y divide-slate-100 pr-1 my-2">
            {cashRegistry.isOpen && (cashRegistry.inputs.length > 0 || cashRegistry.outputs.length > 0) ? (
              <>
                {cashRegistry.inputs.map(i => (
                  <div key={i.id} className="py-2 flex justify-between items-start text-xs">
                    <div>
                      <span className="font-semibold text-slate-700 block">{i.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{i.time} - Entrée</span>
                    </div>
                    <span className="text-emerald-600 font-mono font-bold">+{i.amount.toLocaleString()} MAD</span>
                  </div>
                ))}
                {cashRegistry.outputs.map(o => (
                  <div key={o.id} className="py-2 flex justify-between items-start text-xs">
                    <div>
                      <span className="font-semibold text-slate-700 block">{o.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{o.time} - Sortie</span>
                    </div>
                    <span className="text-rose-600 font-mono font-bold">-{o.amount.toLocaleString()} MAD</span>
                  </div>
                ))}
              </>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Aucun mouvement financier sur cette session.
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs text-slate-400">
            <span>Dernière opération:</span>
            <span className="font-mono text-slate-600 font-bold">Aujourd'hui</span>
          </div>
        </div>
      </div>

      {/* Historique général des clôtures passées */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Journal comptable des clôtures de caisse</h3>
        </div>
        <div className="p-8 text-center text-slate-400 text-xs">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-medium">Toutes les sessions de caisse d'archive ont été validées par le commissaire aux comptes.</p>
          <span className="text-[10px] text-slate-400">Pour consulter les exports de clôture, rendez-vous dans le module "Rapports".</span>
        </div>
      </div>

      {/* MODAL OUVERTURE CAISSE */}
      {isOpenFormOpen && (
        <div className="fixed inset-0 bg-[#0f172a99] backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex justify-between items-center bg-slate-900 text-white px-5 py-4">
              <h3 className="font-bold font-display">Ouvrir la Caisse Générale</h3>
              <button onClick={() => setIsOpenFormOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleOpenRegistry} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Fond de caisse initial (MAD)</label>
                <input 
                  type="number" 
                  required
                  value={openAmount}
                  onChange={(e) => setOpenAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-mono focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400">Montant en espèces de départ dans le tiroir à l'ouverture de la station.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsOpenFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Ouvrir le tiroir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJOUT DE MOUVEMENT MANUEL */}
      {isMovementFormOpen && (
        <div className="fixed inset-0 bg-[#0f172a99] backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex justify-between items-center bg-slate-900 text-white px-5 py-4">
              <h3 className="font-bold font-display">Nouveau mouvement de caisse</h3>
              <button onClick={() => setIsMovementFormOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddMovement} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Type de flux</label>
                  <select 
                    value={mvtType}
                    onChange={(e) => setMvtType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="input">Entrée (+) d'espèces</option>
                    <option value="output">Sortie (-) d'espèces</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Montant (MAD)</label>
                  <input 
                    type="number" 
                    step="any"
                    required
                    placeholder="0.00"
                    value={mvtAmount}
                    onChange={(e) => setMvtAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Libellé de l'opération <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Achat ramette de papier, alimentation monnaie..."
                  value={mvtLabel}
                  onChange={(e) => setMvtLabel(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsMovementFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CLÔTURE DE CAISSE */}
      {isCloseFormOpen && (
        <div className="fixed inset-0 bg-[#0f172a99] backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex justify-between items-center bg-slate-900 text-white px-5 py-4">
              <h3 className="font-bold font-display">Clôture & Bilan de caisse</h3>
              <button onClick={() => setIsCloseFormOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCloseRegistry} className="p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1 font-mono">
                <span className="font-sans font-bold text-slate-700 block mb-1">Résumé théorique :</span>
                <div className="flex justify-between text-slate-500">
                  <span>Solde de caisse attendu :</span>
                  <span className="font-bold text-slate-800">{cashRegistry.theoreticalCash.toLocaleString()} MAD</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Montant Réel Physiquement Compté (MAD)</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  value={realCashClose}
                  onChange={(e) => setRealCashClose(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-mono focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400">Le système calculera l'écart de caisse éventuel d'intervention à la clôture.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsCloseFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Confirmer la Clôture Générale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
