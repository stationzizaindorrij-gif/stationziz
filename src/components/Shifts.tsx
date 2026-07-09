import React, { useState } from 'react';
import {
  Database, Droplet,  
  ClipboardList, Plus, Play, CheckCircle2, AlertTriangle, ArrowRight, 
  Fuel, ShieldAlert, FileSpreadsheet, Calendar, User, Info, Clock, CheckCircle, X, Check 
, Download , Edit, Trash2, ChevronLeft, ChevronRight , Wallet, Package, Wrench, ChevronDown, ChevronUp, CreditCard , Settings } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';
import { ERPStoreType } from '../store';
import { Shift, Nozzle } from '../types';
import ShiftWizard from './ShiftWizard';

interface ShiftsProps {
  store: ERPStoreType;
}

const printStyles = `
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { margin: 10mm; }
  }
`;

export default function Shifts({ store }: ShiftsProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });
  const { 
    shifts, attendants, pumps, nozzles, products, startShift, submitShiftCounters, currentRole, cashRegistry 
  } = store;

  // Tabs for sub-workflows
  const [activeTab, setActiveTab] = useState<'list' | 'wizard'>('list');
  const [editingShift, setEditingShift] = useState<Shift | undefined>(undefined);
  const [closingShiftId, setClosingShiftId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const shiftsPerPage = 10;
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [shiftToDelete, setShiftToDelete] = useState<string | null>(null);
  const [shiftToEdit, setShiftToEdit] = useState<Shift | null>(null);
  const [editRealCashValue, setEditRealCashValue] = useState('');

  // Start shift form state
  const [selectedAttendant, setSelectedAttendant] = useState('');
  const [shiftName, setShiftName] = useState<'Journée' | 'Matin' | 'Après-midi' | 'Nuit'>('Journée');
  const [selectedPumps, setSelectedPumps] = useState<string[]>([]);
  const [startShiftStep, setStartShiftStep] = useState<'selection' | 'counters'>('selection');
  const [startMechCounters, setStartMechCounters] = useState<{ [nozzleId: string]: string }>({});
  const [startElecCounters, setStartElecCounters] = useState<{ [nozzleId: string]: string }>({});

  // Checkout shift state
  const [selectedShiftForCheckout, setSelectedShiftForCheckout] = useState<Shift | null>(null);
  const [endMechCounters, setEndMechCounters] = useState<{ [nozzleId: string]: string }>({});
  const [endElecCounters, setEndElecCounters] = useState<{ [nozzleId: string]: string }>({});
  const [realCashInput, setRealCashInput] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');

  // Selected shift details popup state
  const [selectedDetailShift, setSelectedDetailShift] = useState<Shift | null>(null);

  const downloadPDF = () => {
    reactToPrintFn();
  };


  // Active shifts list
  const activeShifts = shifts.filter(s => s.status === 'active');
  const completedShifts = shifts.filter(s => {
    if (s.status !== 'completed' && s.status !== 'ready_to_close') return false;
    
    // Apply date filters if they exist
    if (filterStartDate && s.date < filterStartDate) return false;
    if (filterEndDate && s.date > filterEndDate) return false;
    
    return true;
  }).sort((a, b) => new Date(`${b.date}T${b.startTime || '00:00'}`).getTime() - new Date(`${a.date}T${a.startTime || '00:00'}`).getTime());
  
  const totalPages = Math.ceil(completedShifts.length / shiftsPerPage);
  const currentCompletedShifts = completedShifts.slice((currentPage - 1) * shiftsPerPage, currentPage * shiftsPerPage);

  // Handle pump selection toggling
  const handleTogglePump = (pumpId: string) => {
    if (selectedPumps.includes(pumpId)) {
      setSelectedPumps(selectedPumps.filter(id => id !== pumpId));
    } else {
      setSelectedPumps([...selectedPumps, pumpId]);
    }
  };

  const handleProceedToCounters = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttendant) {
      alert("Veuillez sélectionner un pompiste.");
      return;
    }
    if (selectedPumps.length === 0) {
      alert("Veuillez affecter au moins une pompe à ce shift.");
      return;
    }

    // Check if attendant is already in an active shift
    const isAlreadyWorking = activeShifts.some(s => s.attendantId === selectedAttendant);
    if (isAlreadyWorking) {
      alert("Ce pompiste a déjà un shift actif en cours.");
      return;
    }

    // Prepopulate starting counters with current nozzle counters
    const initMech: typeof startMechCounters = {};
    const initElec: typeof startElecCounters = {};
    const selectedNozzles = nozzles.filter(n => selectedPumps.includes(n.pumpId));
    
    selectedNozzles.forEach(noz => {
      initMech[noz.id] = noz.currentMechCounter.toString();
      initElec[noz.id] = noz.currentElecCounter.toString();
    });

    setStartMechCounters(initMech);
    setStartElecCounters(initElec);
    setStartShiftStep('counters');
  };

  const handleStartShiftSubmitWithCounters = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttendant || selectedPumps.length === 0) return;

    // Build the custom start counters structure
    const customStartCounters: {
      [nozzleId: string]: {
        mech: number;
        elec: number;
      }
    } = {};

    const selectedNozzles = nozzles.filter(n => selectedPumps.includes(n.pumpId));
    let validationFailed = false;

    selectedNozzles.forEach(noz => {
      const mechVal = parseFloat(startMechCounters[noz.id]);
      const elecVal = parseFloat(startElecCounters[noz.id]);

      if (isNaN(mechVal) || isNaN(elecVal) || mechVal < 0 || elecVal < 0) {
        alert(`Veuillez entrer des index valides et positifs pour le pistolet ${noz.name}.`);
        validationFailed = true;
        return;
      }

      customStartCounters[noz.id] = {
        mech: mechVal,
        elec: elecVal
      };
    });

    if (validationFailed) return;

    // Call startShift with custom start counters!
    startShift(selectedAttendant, shiftName, selectedPumps, 'Directeur ERP', customStartCounters);
    
    // Go back to list and reset states
    setActiveTab('list');
    setStartShiftStep('selection');
    setSelectedAttendant('');
    setShiftName('Journée');
    setSelectedPumps([]);
    setStartMechCounters({});
    setStartElecCounters({});
  };

  const handleInitCheckout = (shift: Shift) => {
    setSelectedShiftForCheckout(shift);
    
    // Initialize end counters with start counters + 100 liters to make it easy to simulate
    const initEndMech: typeof endMechCounters = {};
    const initEndElec: typeof endElecCounters = {};
    
    const assignedNozzles = nozzles.filter(n => shift.pumpIds.includes(n.pumpId));
    assignedNozzles.forEach(noz => {
      const start = shift.startCounters[noz.id];
      if (start) {
        // Suggest a simulated sale of 100 liters
        initEndMech[noz.id] = '';
        initEndElec[noz.id] = '';
      }
    });

    setEndMechCounters(initEndMech);
    setEndElecCounters(initEndElec);

    // Calculate a theoretical cash suggestion to ease simulation
    let theoreticalSum = 0;
    assignedNozzles.forEach(noz => {
      const prod = products.find(p => p.id === noz.productId);
      const price = prod?.salePrice || 1.80;
      theoreticalSum += 100 * price; // 100 liters simulated
    });
    setRealCashInput('');
    setCheckoutNotes('');
    setActiveTab('checkout');
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftForCheckout) return;

    // Parse values
    const finalEndCounters: { [nozzleId: string]: { mech: number; elec: number } } = {};
    let validationFailed = false;

    const assignedNozzles = nozzles.filter(n => selectedShiftForCheckout.pumpIds.includes(n.pumpId));
    
    assignedNozzles.forEach(noz => {
      const start = selectedShiftForCheckout.startCounters[noz.id];
      const endMech = parseFloat(endMechCounters[noz.id]);
      const endElec = parseFloat(endElecCounters[noz.id]);

      if (isNaN(endMech) || isNaN(endElec)) {
        validationFailed = true;
        return;
      }

      if (endMech < start.mech || endElec < start.elec) {
        alert(`Erreur sur le pistolet ${noz.name}: Les index de fin ne peuvent pas être inférieurs aux index de début (Début Elec: ${start.elec.toFixed(3)}, Saisi: ${endElec}).`);
        validationFailed = true;
        return;
      }

      finalEndCounters[noz.id] = {
        mech: endMech,
        elec: endElec
      };
    });

    if (validationFailed) return;

    

    submitShiftCounters(selectedShiftForCheckout.id, finalEndCounters, 'Directeur ERP');
    
    // Reset and go back
    setSelectedShiftForCheckout(null);
    setActiveTab('list');
  };

  const activeAttendantsList = attendants.filter(a => a.status === 'active');

  if (activeTab === 'wizard') {
    return <ShiftWizard store={store} onBack={() => { setActiveTab('list'); setEditingShift(undefined); }} editingShift={editingShift} />;
  }

  return (
    <div className="space-y-6" id="shifts-view">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Prise de Service & Shifts</h1>
          <p className="text-sm text-slate-500">Gérez les ouvertures, affectations de pompes, relevés de pistolets et dépôts de caisse de fin de shift.</p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === 'list' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Vue d'ensemble ({shifts.length})
          </button>
          <button 
            onClick={() => setActiveTab('wizard')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${activeTab === 'start' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Play className="w-3 h-3" />
            Saisir un Shift
          </button>
        </div>
      </div>

      {/* 1. ON-GOING ACTIVE SHIFTS AND ARCHIVES */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* Section: Shifts Actifs en cours */}
          {activeShifts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Play className="w-4 h-4 text-slate-400" />
                Shifts actifs en cours
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeShifts.map(s => {
                  return (
                    <div key={s.id} className="bg-white border-2 border-indigo-200 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                              En cours
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-800 flex items-center gap-2"><User className="w-4 h-4 text-slate-400"/> {s.attendantName}</h4>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{s.startTime} - ...</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(s.date).toLocaleDateString('fr-FR')} - Shift {s.shiftName}
                      </div>
                      <div className="pt-3 border-t border-slate-100 mt-auto flex justify-end">
                        <button
                          onClick={() => {
                            setEditingShift(s);
                            setActiveTab('wizard');
                          }}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          Saisie & Clôture <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Historique des shifts terminés */}
          <div className="space-y-3 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-slate-400" />
                Historique des shifts clos
              </h3>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Du:</span>
                  <input 
                    type="date" 
                    value={filterStartDate} 
                    onChange={(e) => { setFilterStartDate(e.target.value); setCurrentPage(1); }} 
                    className="text-xs border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Au:</span>
                  <input 
                    type="date" 
                    value={filterEndDate} 
                    onChange={(e) => { setFilterEndDate(e.target.value); setCurrentPage(1); }} 
                    className="text-xs border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-1"
                  />
                </div>
                {(filterStartDate || filterEndDate) && (
                  <button 
                    onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setCurrentPage(1); }}
                    className="p-1 text-slate-400 hover:text-rose-500"
                    title="Effacer les filtres"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="p-3.5">Statut</th>
                      <th className="p-3.5">Pompiste</th>
                      <th className="p-3.5">Période</th>
                      <th className="p-3.5">Total des ventes</th>
                      <th className="p-3.5">Encaissements</th>
                      <th className="p-3.5">Dépenses</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentCompletedShifts.map(s => (
                                            <tr key={s.id} className="hover:bg-[#f8fafc99] transition-colors">
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <Check className="w-3 h-3 text-emerald-600" /> Fermée
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800">{s.attendantName}</td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-700">{new Date(s.date).toLocaleDateString('fr-FR')} {s.endDate && s.endDate !== s.date ? ` - ${new Date(s.endDate).toLocaleDateString('fr-FR')}` : ''}</div>
                          <span className="text-[10px] text-slate-400">Shift {s.shiftName} ({s.startTime} - {s.endTime || '--:--'})</span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">
                          {(() => {
                            const produitsTotal = s.productsSold?.reduce((sum, item) => sum + item.total, 0) || 0;
                            const servicesTotal = s.servicesSold?.reduce((sum, item) => sum + item.total, 0) || 0;
                            const carburantsTotal = s.totalAmount || 0;
                            return (carburantsTotal + produitsTotal + servicesTotal).toFixed(2);
                          })()} MAD
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">
                          {(() => {
                            const carteSntl = s.nonCashPayments?.carteSntl?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const espece = s.nonCashPayments?.espece?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const vignette = s.nonCashPayments?.vignette?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const bonClient = s.nonCashPayments?.bonClient?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            return (carteSntl + espece + (s.nonCashPayments?.bonCarburantsVivo?.reduce((sum: any, item: any) => sum + item.amount, 0) || 0) + vignette + bonClient).toFixed(2);
                          })()} MAD
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">
                          {(() => {
                            const depenses = s.expenses?.filter(e => e.method === 'cash').reduce((sum, e) => sum + e.amount, 0) || 0;
                            return depenses.toFixed(2);
                          })()} MAD
                        </td>
                        <td className="p-3.5 text-right">
                          {s.status === 'ready_to_close' ? (
                            <button 
                              onClick={() => setClosingShiftId(s.id)}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white rounded font-bold transition-all"
                            >
                              Clôturer
                            </button>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => setSelectedDetailShift(s)}
                                className="px-2 py-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 hover:border-indigo-200 rounded font-bold transition-all text-[10px]"
                                title="Consulter Rapport"
                              >
                                Consulter
                              </button>
                              <button
                                onClick={() => {
                                  setEditingShift(s);
                                  setActiveTab('wizard');
                                }}
                                className="p-1 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded transition-colors"
                                title="Modifier"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setShiftToDelete(s.id);
                                }}
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {currentCompletedShifts.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                          Aucun shift archivé.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <span className="text-sm font-bold text-slate-700">Page {currentPage} sur {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. OUVRIR / COMMENCER UN SHIFT (ENTRÉE POMPISTE) */}
      {activeTab === 'start' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-w-2xl mx-auto overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold font-display">Ouverture de Service & Affectation de Piste</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 px-2 py-1 rounded">
              Étape {startShiftStep === 'selection' ? '1 / 2' : '2 / 2'}
            </span>
          </div>

          {startShiftStep === 'selection' ? (
            <form onSubmit={handleProceedToCounters} className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Pompiste de Service <span className="text-rose-500">*</span></label>
                  <select 
                    required
                    value={selectedAttendant}
                    onChange={(e) => setSelectedAttendant(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Choisir un pompiste --</option>
                    {activeAttendantsList.map(a => (
                      <option key={a.id} value={a.id}>{a.firstName} {a.lastName} ({a.matricule})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Service / Tranche Horaire <span className="text-rose-500">*</span></label>
                  <select 
                    disabled
                    value={shiftName}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
                  >
                    <option value="Journée">Journée Complète (Service Continu)</option>
                  </select>
                </div>
              </div>

              {/* Affectation des pompes */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Pompes à affecter au pompiste <span className="text-rose-500">*</span></label>
                <span className="block text-[11px] text-slate-400">Sélectionnez les pompes dont le pompiste va relever les index de départ et encaisser les ventes de carburant.</span>
                
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {pumps.map(pump => {
                    const pumpNozzles = nozzles.filter(n => n.pumpId === pump.id);
                    const isSelected = selectedPumps.includes(pump.id);
                    return (
                      <div 
                        key={pump.id} 
                        onClick={() => pump.status === 'active' && handleTogglePump(pump.id)}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          pump.status !== 'active' 
                            ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                            : isSelected 
                              ? 'bg-blue-50 border-blue-500 shadow-xs' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Fuel className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                            <h4 className={`font-bold text-sm ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>{pump.number}</h4>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            pump.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {pump.status === 'active' ? 'Disponible' : 'En maintenance'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-2">
                          {pumpNozzles.length} pistolets associés :
                          <div className="flex flex-wrap gap-1 mt-1">
                            {pumpNozzles.map(noz => (
                              <span key={noz.id} className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 text-[9px] font-medium">{noz.name.split(' ')[1] || noz.name}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  Continuer : Saisir les Index de départ
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStartShiftSubmitWithCounters} className="p-5 space-y-5">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-slate-600 space-y-1">
                <div><strong>Pompiste sélectionné :</strong> {attendants.find(a => a.id === selectedAttendant)?.firstName} {attendants.find(a => a.id === selectedAttendant)?.lastName}</div>
                <div><strong>Service :</strong> {shiftName} (Service Continu / Journée)</div>
                <div><strong>Pompes affectées :</strong> {selectedPumps.map(pId => pumps.find(p => p.id === pId)?.number).join(', ')}</div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-1">
                  <Fuel className="w-4 h-4 text-blue-600" />
                  Saisie obligatoire des index de départ des pistolets
                </h4>
                <p className="text-[11px] text-slate-400">Veuillez relever et saisir les index physiques actuels de chaque pistolet pour démarrer le shift.</p>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1 mt-2">
                  {nozzles.filter(n => selectedPumps.includes(n.pumpId)).map(noz => (
                    <div key={noz.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 text-xs block">{noz.name}</span>
                        <span className="text-[10px] text-slate-400 block font-medium">Carburant: {noz.productName} ({noz.pumpNumber})</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Index Début Élec (L)</label>
                        <input 
                          type="number" 
                          step="any"
                          required
                          value={startElecCounters[noz.id] || ''}
                          onChange={(e) => setStartElecCounters({ ...startElecCounters, [noz.id]: e.target.value })}
                          className="w-full border border-slate-200 bg-white rounded p-1.5 text-xs font-mono text-center focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Index Début Méc (L)</label>
                        <input 
                          type="number" 
                          required
                          value={startMechCounters[noz.id] || ''}
                          onChange={(e) => setStartMechCounters({ ...startMechCounters, [noz.id]: e.target.value })}
                          className="w-full border border-slate-200 bg-white rounded p-1.5 text-xs font-mono text-center focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setStartShiftStep('selection')}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Retour
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  Confirmer & Ouvrir le Shift
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 3. SORTIE / CLÔTURE DE SHIFT (SORTIE POMPISTE) */}
      {activeTab === 'checkout' && selectedShiftForCheckout && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-w-3xl mx-auto overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold font-display">Clôture de service : {selectedShiftForCheckout.attendantName}</h3>
            </div>
            <button onClick={() => { setSelectedShiftForCheckout(null); setActiveTab('list'); }} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCheckoutSubmit} className="p-5 space-y-6">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-500 grid grid-cols-3 gap-2">
              <div><strong>Date :</strong> {selectedShiftForCheckout.date}</div>
              <div><strong>Shift :</strong> {selectedShiftForCheckout.shiftName}</div>
              <div><strong>Ouverture à :</strong> {selectedShiftForCheckout.startTime}</div>
            </div>

            {/* Saisie des compteurs de fin */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-1">
                <Fuel className="w-4 h-4 text-indigo-600" />
                1. Saisie des index de fin des pistolets
              </h4>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {nozzles.filter(n => selectedShiftForCheckout.pumpIds.includes(n.pumpId)).map(noz => {
                  const start = selectedShiftForCheckout.startCounters[noz.id];
                  if (!start) return null;

                  return (
                    <div key={noz.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 text-xs block">{noz.name}</span>
                        <span className="text-[10px] text-slate-400 block font-medium">Carburant: {noz.productName} ({noz.pumpNumber})</span>
                      </div>
                      
                      {/* Compteur Début */}
                      <div className="text-xs space-y-0.5 bg-slate-100 border border-slate-200 rounded p-2 text-center">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Index Début (élec)</span>
                        <strong className="text-slate-700 font-mono text-xs">{start.elec.toFixed(3)} L</strong>
                      </div>

                      {/* Compteur Fin Saisie */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Index Fin Élec</label>
                          <input 
                            type="number" 
                            step="any"
                            required
                            value={endElecCounters[noz.id] || ''}
                            onChange={(e) => setEndElecCounters({ ...endElecCounters, [noz.id]: e.target.value })}
                            className="w-full border border-slate-200 bg-white rounded p-1 text-xs font-mono text-center focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Index Fin Méc</label>
                          <input 
                            type="number" 
                            required
                            value={endMechCounters[noz.id] || ''}
                            onChange={(e) => setEndMechCounters({ ...endMechCounters, [noz.id]: e.target.value })}
                            className="w-full border border-slate-200 bg-white rounded p-1 text-xs font-mono text-center focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Saisie de l'encaissement et note */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  2. Remise d'espèces & caisse réelle
                </h4>
                <p className="text-[11px] text-slate-400 leading-normal">Comptez les billets et pièces remis physiquement par le pompiste à la fin de son service.</p>
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-xs">MAD</div>
                  <input 
                    type="number" 
                    step="any"
                    required
                    placeholder="0.00"
                    value={realCashInput}
                    onChange={(e) => setRealCashInput(e.target.value)}
                    className="w-full pl-11 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  3. Observations & Notes du shift
                </h4>
                <p className="text-[11px] text-slate-400">Précisez les raisons d'un éventuel écart de caisse ou tout incident de pompe.</p>
                <textarea 
                  placeholder="Ex: Erreur de monnaie sur client SP95, ou panne de pistolet transitoire..."
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 mt-2"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => { setSelectedShiftForCheckout(null); setActiveTab('list'); }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                Valider la clôture, Décrémenter Stock & Alimenter Caisse
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP DE DETAIL DE SHIFT CLOS */}
      {selectedDetailShift && (
        <div className="fixed inset-0 bg-[#0f172a99] backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center bg-slate-900 text-white px-4 py-3 shrink-0 rounded-t-xl">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Rapport de Shift</h3>
                <span className="text-[10px] text-slate-400 font-mono">ID: {selectedDetailShift.id}</span>
              </div>
              <button onClick={() => setSelectedDetailShift(null)} className="text-slate-400 hover:text-white transition-colors hide-in-pdf">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div id="shift-report-content" ref={contentRef} className="p-4 sm:p-6 overflow-y-auto bg-white text-slate-800 text-sm flex-grow print:p-8"
            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              {(() => {
                const nonCashTotal = selectedDetailShift.nonCashPayments ? (
                  (selectedDetailShift.nonCashPayments?.carteSntl?.reduce((sum, item) => sum + item.amount, 0) || 0) + 
                  (selectedDetailShift.nonCashPayments?.espece?.reduce((sum, item) => sum + item.amount, 0) || 0) + 
                  (selectedDetailShift.nonCashPayments?.bonCarburantsVivo?.reduce((sum, item) => sum + item.amount, 0) || 0) +
                  (selectedDetailShift.nonCashPayments?.vignette?.reduce((sum, item) => sum + item.amount, 0) || 0) +
                  (selectedDetailShift.nonCashPayments?.bonClient?.reduce((sum, item) => sum + item.amount, 0) || 0)
                ) : 0;

                const produitsTotal = selectedDetailShift.productsSold?.reduce((sum, item) => sum + item.total, 0) || 0;
                const servicesTotal = selectedDetailShift.servicesSold?.reduce((sum, item) => sum + item.total, 0) || 0;
                const carburantsTotal = selectedDetailShift.totalAmount || 0;
                const chiffreAffaires = carburantsTotal + produitsTotal + servicesTotal;
                const depensesTotal = selectedDetailShift.expenses?.filter(e => e.method === 'cash').reduce((sum, exp) => sum + exp.amount, 0) || 0;
                const especeARemettre = chiffreAffaires - nonCashTotal - depensesTotal;

                // Calculs Carburants par produit dynamique
                const productAggregates: Record<string, { name: string, liters: number, amount: number }> = {};
                const usedTanks = new Set<string>();
                const nozzleRows: any[] = [];

                if (selectedDetailShift.litersSold) {
                  Object.entries(selectedDetailShift.litersSold).forEach(([nozzleId, liters]) => {
                    if ((liters as number) > 0) {
                      const nozzle = store.nozzles.find(n => n.id === nozzleId);
                      if (nozzle) {
                        usedTanks.add(nozzle.tankId);
                        const product = store.products.find(p => p.id === nozzle.productId);
                        const amount = selectedDetailShift.amountSold?.[nozzleId] || 0;
                        const prodName = product?.name || nozzle.productName || 'Carburant Inconnu';
                        
                        nozzleRows.push({
                          nozzleName: nozzle.name,
                          productName: prodName,
                          startElec: parseFloat(selectedDetailShift.startCounters?.[nozzleId]?.elec as any) || 0,
                          startMech: parseFloat(selectedDetailShift.startCounters?.[nozzleId]?.mech as any) || 0,
                          endElec: parseFloat(selectedDetailShift.endCounters?.[nozzleId]?.elec as any) || 0,
                          endMech: parseFloat(selectedDetailShift.endCounters?.[nozzleId]?.mech as any) || 0,
                          liters,
                          amount
                        });

                        if (!productAggregates[prodName]) {
                          productAggregates[prodName] = { name: prodName, liters: 0, amount: 0 };
                        }
                        productAggregates[prodName].liters += (liters as number);
                        productAggregates[prodName].amount += (amount as number);
                      }
                    }
                  });
                }

                return (
                  <div className="space-y-6">
                    {/* EN TÊTE COMPACT */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mb-1">Pompiste</div>
                        <div className="font-bold text-slate-800 text-lg uppercase">{selectedDetailShift.attendantName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mb-1">Période</div>
                        <div className="font-bold text-slate-800">
                          {new Date(selectedDetailShift.date).toLocaleDateString('fr-FR')} {selectedDetailShift.startTime} &rarr; {selectedDetailShift.endDate && selectedDetailShift.endDate !== selectedDetailShift.date ? new Date(selectedDetailShift.endDate).toLocaleDateString('fr-FR') : ''} {selectedDetailShift.endTime || 'En cours'}
                        </div>
                      </div>
                    </div>

                    {/* RELEVÉ DES INDEX */}
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Fuel className="w-3.5 h-3.5 text-indigo-500" />
                        Relevé des Index
                      </h4>
                      <div className="rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                            <tr>
                              <th className="px-3 py-2 font-medium">Pistolet</th>
                              
                              <th className="px-3 py-2 font-medium text-right whitespace-nowrap">Début (Elec/Méc)</th>
                              <th className="px-3 py-2 font-medium text-right whitespace-nowrap">Fin (Elec/Méc)</th>
                              <th className="px-3 py-2 font-medium text-right text-slate-900 whitespace-nowrap">Volume (Elec/Méc)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {nozzleRows.map((row, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 font-bold text-slate-800">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                                      <Fuel className="w-3.5 h-3.5 text-indigo-500" />
                                    </div>
                                    {row.nozzleName}
                                  </div>
                                </td>
                                
                                <td className="px-3 py-2 text-right font-mono text-blue-600 whitespace-nowrap">
                                  {row.startElec.toFixed(2)} <span className="text-slate-400 mx-1">/</span> <span className="text-orange-500">{row.startMech.toFixed(0)}</span>
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-blue-600 whitespace-nowrap">
                                  {row.endElec.toFixed(2)} <span className="text-slate-400 mx-1">/</span> <span className="text-orange-500">{row.endMech.toFixed(0)}</span>
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 bg-slate-50/50 whitespace-nowrap">
                                  <span className="text-blue-700">{row.liters.toFixed(2)}</span> <span className="text-slate-400 font-normal mx-1">/</span> <span className="text-orange-600">{(row.endMech - row.startMech).toFixed(2)}</span>
                                </td>
                              </tr>
                            ))}
                            {nozzleRows.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-3 py-4 text-center text-slate-500 italic">Aucune vente de carburant enregistrée</td>
                              </tr>
                            )}
                          </tbody>
                          <thead className="bg-slate-100 border-y border-slate-200 text-slate-600">
                            <tr>
                              <th colSpan={2} className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-slate-500"><div className="flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5 text-blue-500" /> Volumes par Carburant</div></th>
                              <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-slate-500 text-right">Volume (L)</th>
                              <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-slate-500 text-right">Montant (DH)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-slate-50/50">
                            {Object.values(productAggregates).map((prod, idx) => (
                              <tr key={idx}>
                                <td colSpan={2} className="px-3 py-2 font-medium text-slate-800">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                                      <Droplet className="w-3.5 h-3.5 text-blue-500" />
                                    </div>
                                    {prod.name}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-slate-700">{prod.liters.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-blue-700">{prod.amount.toFixed(2)}</td>
                              </tr>
                            ))}
                            {Object.keys(productAggregates).length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-3 py-4 text-center text-slate-500 italic">Aucun carburant vendu</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">

                      {usedTanks.size > 0 && (
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-slate-500" />
                            Cuves (Consommées)
                          </h4>
                          <div className="rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                <tr>
                                  <th className="px-3 py-2 font-medium">Cuve</th>
                                  <th className="px-3 py-2 font-medium">Produit</th>
                                  <th className="px-3 py-2 font-medium text-right">Niveau Actuel (L)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {Array.from(usedTanks).map(tankId => {
                                  const tank = store.tanks.find(t => t.id === tankId);
                                  if (!tank) return null;
                                  return (
                                    <tr key={tank.id}>
                                      <td className="px-3 py-2 font-bold text-slate-800">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                            <Database className="w-3 h-3 text-slate-500" />
                                          </div>
                                          {tank.number}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                          <Droplet className="w-3 h-3 text-slate-400" />
                                          {tank.productName}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-right font-mono font-bold">{tank.currentLevel.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>


                    {/* NON-CASH BREAKDOWN IN REPORT */}
                    {nonCashTotal > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                          Détail des Encaissements
                        </h4>
                        <div className="rounded-lg border border-slate-200 overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <tbody className="divide-y divide-slate-100">
                              {(() => {
                                const tCarteSntl = selectedDetailShift.nonCashPayments?.carteSntl?.reduce((sum, item) => sum + item.amount, 0) || 0;
                                const tEspece = selectedDetailShift.nonCashPayments?.espece?.reduce((sum, item) => sum + item.amount, 0) || 0;
                                const tBonVivo = selectedDetailShift.nonCashPayments?.bonCarburantsVivo?.reduce((sum, item) => sum + item.amount, 0) || 0;
                                const tVignette = selectedDetailShift.nonCashPayments?.vignette?.reduce((sum, item) => sum + item.amount, 0) || 0;
                                const tBonClient = selectedDetailShift.nonCashPayments?.bonClient?.reduce((sum, item) => sum + item.amount, 0) || 0;
                                return (
                                  <>
                                    {tCarteSntl > 0 && (
                                      <tr>
                                        <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">Carte SNTL</td>
                                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{tCarteSntl.toFixed(2)} DH</td>
                                      </tr>
                                    )}
                                    {tEspece > 0 && (
                                      <tr>
                                        <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">Espèce (Déclaration)</td>
                                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{tEspece.toFixed(2)} DH</td>
                                      </tr>
                                    )}
                                    {tBonVivo > 0 && (
                                      <tr>
                                        <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">Bon Carburants Vivo</td>
                                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{tBonVivo.toFixed(2)} DH</td>
                                      </tr>
                                    )}
                                    {tVignette > 0 && (
                                      <tr>
                                        <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">Vignette</td>
                                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{tVignette.toFixed(2)} DH</td>
                                      </tr>
                                    )}
                                    {tBonClient > 0 && (
                                      <tr>
                                        <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">Bon Client</td>
                                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{tBonClient.toFixed(2)} DH</td>
                                      </tr>
                                    )}
                                  </>
                                );
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {/* DETAILS BOUTIQUE */}
                    {(selectedDetailShift.productsSold?.length || 0) > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-indigo-500" />
                          Détails de Boutique
                        </h4>
                        <div className="rounded-lg border border-slate-200 overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <tbody className="divide-y divide-slate-100">
                              {selectedDetailShift.productsSold?.map(p => (
                                <tr key={p.id}>
                                  <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">{p.name}</td>
                                  <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{p.total.toFixed(2)} DH</td>
                                </tr>
                              ))}
                              <tr>
                                <td className="px-3 py-2 font-black text-slate-800 bg-slate-100 uppercase text-[10px]">Total Boutique</td>
                                <td className="px-3 py-2 text-right font-mono font-black text-indigo-700 bg-slate-100">{produitsTotal.toFixed(2)} DH</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* DETAILS LAVAGE LA GRAISSE */}
                    {(selectedDetailShift.servicesSold?.length || 0) > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Settings className="w-3.5 h-3.5 text-indigo-500" />
                          Détails de Lavage et Graissage
                        </h4>
                        <div className="rounded-lg border border-slate-200 overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <tbody className="divide-y divide-slate-100">
                              {selectedDetailShift.servicesSold?.map(s => (
                                <tr key={s.id}>
                                  <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">{s.name}</td>
                                  <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{s.total.toFixed(2)} DH</td>
                                </tr>
                              ))}
                              <tr>
                                <td className="px-3 py-2 font-black text-slate-800 bg-slate-100 uppercase text-[10px]">Total Lavage et Graissage</td>
                                <td className="px-3 py-2 text-right font-mono font-black text-indigo-700 bg-slate-100">{servicesTotal.toFixed(2)} DH</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* FINANCES COMPACTES */}
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-slate-500" />
                        Bilan Financier
                      </h4>
                      <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                          <div className="p-4 flex flex-col">
                            <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Encaissement</div>
                            <div className="font-mono font-bold text-indigo-600 text-lg">+{nonCashTotal.toFixed(2)} DH</div>
                          </div>
                          <div className="p-4 flex flex-col">
                            <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Dépenses</div>
                            <div className="font-mono font-bold text-rose-600 text-lg">-{depensesTotal.toFixed(2)} DH</div>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-800 flex justify-between items-center text-white">
                          <div className="text-sm uppercase text-slate-300 font-black tracking-widest">Total Global</div>
                          <div className="font-mono font-black text-white text-2xl">{(nonCashTotal - depensesTotal).toFixed(2)} <span className="text-slate-400 text-lg">DH</span></div>
                        </div>
                      </div>
                    </div>

                  </div>

                );
              })()}
            </div>

            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 shrink-0 flex justify-end gap-3 rounded-b-xl hide-in-pdf">
              <button 
                onClick={() => setSelectedDetailShift(null)}
                className="px-4 py-2 rounded-lg font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 text-sm"
              >
                Fermer
              </button>
              <button 
                onClick={() => reactToPrintFn()}
                className="px-4 py-2 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Télécharger PDF
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Shift Modal */}
      {shiftToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-xl font-bold text-slate-800">Supprimer le shift ?</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Êtes-vous sûr de vouloir supprimer ce shift ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShiftToDelete(null)}
                className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if ((store as any).deleteShift) {
                    (store as any).deleteShift(shiftToDelete, 'Propriétaire');
                  }
                  setShiftToDelete(null);
                }}
                className="px-4 py-2 text-white bg-rose-600 hover:bg-rose-700 rounded-lg font-bold transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}