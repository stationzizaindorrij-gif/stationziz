import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, CheckCircle2, DollarSign, Fuel, Package, Settings, Users, Droplet,
  CreditCard, Receipt, FileText, ChevronRight, ChevronLeft, Calendar,
  Clock, Lock, CheckCircle, AlertTriangle, Plus, Trash2, Printer, Check, User, Wallet, Wrench, ChevronDown
, Database } from 'lucide-react';
import { ERPStoreType } from '../store';
import { Shift, Product, Nozzle, Sale } from '../types';

interface ShiftWizardProps {
  store: ERPStoreType;
  onBack: () => void;
  editingShift?: Shift;
}

export default function ShiftWizard({ store, onBack, editingShift }: ShiftWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  // Step 1: Info
  const [date, setDate] = useState(editingShift?.date || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(editingShift?.endDate || editingShift?.date || new Date().toISOString().split('T')[0]);
  const [attendantId, setAttendantId] = useState(editingShift?.attendantId || '');
  const [shiftName, setShiftName] = useState<'Journée' | 'Matin' | 'Après-midi' | 'Nuit'>(editingShift?.shiftName || 'Journée');
  const [startTime, setStartTime] = useState(editingShift?.startTime || '06:00');
  const [endTime, setEndTime] = useState(editingShift?.endTime || '14:00');
  const [selectedPumps, setSelectedPumps] = useState<string[]>(editingShift?.pumpIds || []);

  // Step 2: Counters
  const [startCounters, setStartCounters] = useState<{ [nozzleId: string]: { mech: number; elec: number } }>(editingShift?.startCounters || {});
  const [endCounters, setEndCounters] = useState<{ [nozzleId: string]: { mech: number | ''; elec: number | '' } }>(editingShift?.endCounters || {});

  // Step 3-6: Sales, Expenses, Payments
  const [productSales, setProductSales] = useState<any[]>(editingShift?.productsSold || []);
  const [serviceSales, setServiceSales] = useState<any[]>(editingShift?.servicesSold || []);
  const [expenses, setExpenses] = useState<any[]>(editingShift?.expenses || []);
  const [nonCashPayments, setNonCashPayments] = useState<any>({
    carteSntl: editingShift?.nonCashPayments?.carteSntl || [],
    espece: editingShift?.nonCashPayments?.espece || [],
    bonCarburantsVivo: editingShift?.nonCashPayments?.bonCarburantsVivo || [],
    vignette: editingShift?.nonCashPayments?.vignette || [],
    bonClient: editingShift?.nonCashPayments?.bonClient || []
  });
  const [realCashInput, setRealCashInput] = useState(editingShift?.realCashReceived?.toString() || '');

useEffect(() => {
    setStartCounters(prevStart => {
      const newStart = { ...prevStart };
      let hasChanges = false;
      selectedPumps.forEach(pumpId => {
        const pumpNozzles = store.nozzles.filter(n => n.pumpId === pumpId);
        pumpNozzles.forEach(noz => {
          if (!newStart[noz.id] && !editingShift) {
            newStart[noz.id] = { mech: noz.currentMechCounter, elec: noz.currentElecCounter };
            hasChanges = true;
          }
        });
      });
      return hasChanges ? newStart : prevStart;
    });

    setEndCounters(prevEnd => {
      const newEnd = { ...prevEnd };
      let hasChanges = false;
      selectedPumps.forEach(pumpId => {
        const pumpNozzles = store.nozzles.filter(n => n.pumpId === pumpId);
        pumpNozzles.forEach(noz => {
          if (!newEnd[noz.id]) {
            newEnd[noz.id] = { mech: '', elec: '' };
            hasChanges = true;
          }
        });
      });
      return hasChanges ? newEnd : prevEnd;
    });
  }, [selectedPumps, store.nozzles, editingShift]);

  const fuelSalesDetails = useMemo(() => {
    const details = [];
    let totalFuelAmount = 0;
    let totalFuelLiters = 0;
    const litersSold: any = {};
    const amountSold: any = {};

    selectedPumps.forEach(pumpId => {
      const pumpNozzles = store.nozzles.filter(n => n.pumpId === pumpId);
      pumpNozzles.forEach(noz => {
        const start = startCounters[noz.id];
        const end = endCounters[noz.id];
        if (start && end) {
          const sElec = parseFloat(start.elec) || 0;
          const eElec = parseFloat(end.elec) || 0;
          const sMech = parseFloat(start.mech) || 0;
          const eMech = parseFloat(end.mech) || 0;

          const qtyElec = Math.max(0, eElec - sElec);
          const qtyMech = Math.max(0, eMech - sMech);
          const product = store.products.find(p => p.id === noz.productId);
          const price = product ? product.salePrice : 0;
          const total = qtyElec * price; // Defaulting to Elec for totals
          
          totalFuelAmount += total;
          totalFuelLiters += qtyElec;
          litersSold[noz.id] = qtyElec;
          amountSold[noz.id] = total;

          details.push({
            nozzle: noz,
            startElec: sElec,
            endElec: eElec,
            startMech: sMech,
            endMech: eMech,
            qtyElec,
            qtyMech,
            price,
            total
          });
        }
      });
    });
    return { details, totalFuelAmount, totalFuelLiters, litersSold, amountSold };
  }, [selectedPumps, startCounters, endCounters, store.nozzles, store.products]);


// Auto-fill start counters based on previous shifts when pumps are selected
  useEffect(() => {
    if (selectedPumps.length === 0 || editingShift) return;
    
    setStartCounters(prevStart => {
      const newStart = { ...prevStart };
      let hasChanges = false;
      
      selectedPumps.forEach(pumpId => {
        const pumpNozzles = store.nozzles.filter(n => n.pumpId === pumpId);
        pumpNozzles.forEach(noz => {
          const previousShifts = [...store.shifts]
            .filter(s => s.status === 'completed' && s.endCounters && s.endCounters[noz.id])
            .sort((a, b) => new Date(`${b.date}T${b.startTime || '00:00'}`).getTime() - new Date(`${a.date}T${a.startTime || '00:00'}`).getTime());
                    
          if (previousShifts.length > 0) {
            const lastEndCounter = previousShifts[0].endCounters[noz.id];
            if (!newStart[noz.id] || 
                 (newStart[noz.id].elec === noz.currentElecCounter && newStart[noz.id].elec !== lastEndCounter.elec)) {
              newStart[noz.id] = {
                elec: lastEndCounter.elec,
                mech: lastEndCounter.mech
              };
              hasChanges = true;
            }
          }
        });
      });
      return hasChanges ? newStart : prevStart;
    });
  }, [selectedPumps, store.shifts, store.nozzles, editingShift]);

  const totalProductSales = productSales.reduce((acc, curr) => acc + curr.total, 0);
  const totalServiceSales = serviceSales.reduce((acc, curr) => acc + curr.total, 0);
  const grandTotalSales = fuelSalesDetails.totalFuelAmount + totalProductSales + totalServiceSales;

  const totalCarteSntl = (nonCashPayments?.carteSntl || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalEspeceClient = (nonCashPayments?.espece || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalBonVivo = (nonCashPayments?.bonCarburantsVivo || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalVignette = (nonCashPayments?.vignette || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalBonClient = (nonCashPayments?.bonClient || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const totalNonCashPayments = totalCarteSntl + totalEspeceClient + totalBonVivo + totalVignette + totalBonClient;
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const cashExpenses = expenses.filter(e => e.method === 'cash').reduce((acc, curr) => acc + curr.amount, 0);
  
  const realCash = parseFloat(realCashInput) || 0;
  const theoreticalCash = grandTotalSales - totalNonCashPayments - cashExpenses;
  const ecart = parseFloat((realCash - theoreticalCash).toFixed(2));

  const handleTogglePump = (pumpId: string) => {
    if (selectedPumps.includes(pumpId)) {
      setSelectedPumps(selectedPumps.filter(id => id !== pumpId));
    } else {
      setSelectedPumps([...selectedPumps, pumpId]);
    }
  };

  const handleSaveShift = () => {
    const attendant = store.attendants.find(a => a.id === attendantId);
    if (!attendant) return;
    
    const shiftData = {
      date,
      endDate,
      startTime,
      endTime,
      shiftName,
      attendantId,
      attendantName: `${attendant.firstName} ${attendant.lastName}`,
      pumpIds: selectedPumps,
      startCounters,
      endCounters,
      productsSold: productSales,
      servicesSold: serviceSales,
      expenses,
      nonCashPayments,
      realCashReceived: realCash,
      theoreticalCash,
      discrepancy: ecart,
      notes: `Saisi manuellement. Écart: ${ecart.toFixed(2)} MAD. Dépenses: ${totalExpenses.toFixed(2)} MAD.`,
      litersSold: fuelSalesDetails.litersSold,
      amountSold: fuelSalesDetails.amountSold,
      totalLiters: fuelSalesDetails.totalFuelLiters,
      totalAmount: fuelSalesDetails.totalFuelAmount
    };

    if (nonCashPayments && nonCashPayments.bonClient && nonCashPayments.bonClient.length > 0) {
      const newClientsToAdd: any[] = [];
      const currentClientNames = new Set(store.clients.map(c => c.name.toLowerCase()));
      
      nonCashPayments.bonClient.forEach((bc: any) => {
        if (bc.clientName && bc.clientName.trim() !== '') {
          const clientNameTrimmed = bc.clientName.trim();
          const lowerName = clientNameTrimmed.toLowerCase();
          if (!currentClientNames.has(lowerName)) {
            currentClientNames.add(lowerName);
            newClientsToAdd.push({
              name: clientNameTrimmed,
              phone: '',
              email: '',
              address: '',
              ice: '',
              contact: '',
              notes: 'Client ajouté automatiquement depuis un Bon Client'
            });
          }
        }
      });

      if (newClientsToAdd.length > 0 && (store as any).addClients) {
        (store as any).addClients(newClientsToAdd, store.currentRole);
      }
    }

    if (editingShift) {
      store.updateShift(editingShift.id, shiftData, store.currentRole);
    } else {
      store.addCompletedShift(shiftData, store.currentRole);
    }

    setIsCompleted(true);
  };

  const steps = [
    { id: 1, title: 'Infos', icon: Settings },
    { id: 2, title: 'Index', icon: Fuel },
    { id: 3, title: 'Boutique', icon: Package },
    { id: 4, title: 'Services', icon: Users },
    { id: 5, title: 'Dépenses', icon: Receipt },
    { id: 6, title: 'Encaissements', icon: CreditCard },
    { id: 7, title: 'Validation', icon: CheckCircle2 }
  ];

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-4 font-display">Saisie Terminée</h2>
        <p className="text-slate-500 mb-8 text-lg">Le shift a été enregistré avec succès et les stocks ont été mis à jour.</p>
        <div className="flex justify-center gap-4">
          <button onClick={() => { setIsCompleted(false); setCurrentStep(1); }} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-sm hover:bg-indigo-700 flex items-center gap-2">
            <Plus className="w-5 h-5" /> Saisir un autre shift
          </button>
          <button onClick={onBack} className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 font-display">Saisie de Shift</h1>
          <p className="text-sm text-slate-500 mt-1">Saisie complète et clôture pour une vacation</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-2 relative z-10 group cursor-pointer" onClick={() => setCurrentStep(step.id)}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${currentStep === step.id ? 'bg-indigo-600 text-white shadow-md scale-110' : currentStep > step.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${currentStep === step.id ? 'text-indigo-700' : currentStep > step.id ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {step.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-1 bg-slate-100 mx-2 rounded-full relative overflow-hidden">
                  <div className={`absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-500 ${currentStep > step.id ? 'w-full' : 'w-0'}`}></div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="p-8">
          {/* STEP 1: Infos */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Pompiste</label>
                  <select 
                    value={attendantId}
                    onChange={e => setAttendantId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3"
                  >
                    <option value="">Sélectionner un pompiste</option>
                    {store.attendants.map(a => (
                      <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Vacation</label>
                  <select 
                    value={shiftName}
                    onChange={e => setShiftName(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3"
                  >
                    <option value="Journée">Journée</option>
                    <option value="Matin">Matin</option>
                    <option value="Après-midi">Après-midi</option>
                    <option value="Nuit">Nuit</option>
                  </select>
                </div>
                
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Date Début</label>
                    <input 
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Date Fin</label>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Heure Début</label>
                    <input 
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Heure Fin</label>
                    <input 
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-3"
                    />
                  </div>
                </div>

              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-4">Pompes gérées (Sélectionnez)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {store.pumps.map(pump => {
                    const isSelected = selectedPumps.includes(pump.id);
                    return (
                      <div 
                        key={pump.id}
                        onClick={() => handleTogglePump(pump.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-200'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Fuel className={`w-5 h-5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                          {isSelected && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                        </div>
                        <h4 className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{pump.number}</h4>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Index */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {selectedPumps.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl">
                  Veuillez sélectionner au moins une pompe à l'étape 1.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                      <tr>
                        <th className="p-3">Pompe / Pistolet</th>
                        <th className="p-3 text-right">Index Entrée (Elec / Méc)</th>
                        <th className="p-3 text-right">Index Sortie (Elec / Méc)</th>
                        <th className="p-3 text-right whitespace-nowrap">Vol. Vendu (ELEC)</th>
                        <th className="p-3 text-right whitespace-nowrap">Vol. Vendu (MEC)</th>
                        <th className="p-3 text-right">Prix U.</th>
                        <th className="p-3 text-right">Total (MAD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fuelSalesDetails.details.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{row.nozzle.name}</div>
                            <div className="text-[10px] text-slate-400">{row.nozzle.productName}</div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-4">
                              <div className="flex flex-col items-end">
                                <span className="text-[9px] text-slate-400 font-bold uppercase mb-1">Elec</span>
                                <input 
                                  type="number" 
                                  value={startCounters[row.nozzle.id]?.elec || 0}
                                  onChange={(e) => setStartCounters(prev => ({...prev, [row.nozzle.id]: { ...prev[row.nozzle.id], elec: parseFloat(e.target.value) || 0 }}))}
                                  className="w-32 text-right bg-transparent border-b border-slate-200 font-mono text-slate-500 focus:outline-none focus:border-slate-500"
                                />
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-[9px] text-slate-400 font-bold uppercase mb-1">Méc</span>
                                <input 
                                  type="number" 
                                  value={startCounters[row.nozzle.id]?.mech || 0}
                                  onChange={(e) => setStartCounters(prev => ({...prev, [row.nozzle.id]: { ...prev[row.nozzle.id], mech: parseFloat(e.target.value) || 0 }}))}
                                  className="w-32 text-right bg-transparent border-b border-slate-200 font-mono text-slate-500 focus:outline-none focus:border-slate-500"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3 bg-emerald-50/30">
                            <div className="flex items-center justify-end gap-4">
                              <div className="flex flex-col items-end">
                                <span className="text-[9px] text-emerald-600/60 font-bold uppercase mb-1">Elec</span>
                                <input 
                                  type="number" 
                                  value={endCounters[row.nozzle.id]?.elec !== undefined ? endCounters[row.nozzle.id].elec : ''}
                                  onChange={(e) => setEndCounters(prev => ({...prev, [row.nozzle.id]: { ...prev[row.nozzle.id], elec: e.target.value }}))}
                                  className="w-32 text-right bg-transparent border-b border-emerald-200 font-mono font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-[9px] text-emerald-600/60 font-bold uppercase mb-1">Méc</span>
                                <input 
                                  type="number" 
                                  value={endCounters[row.nozzle.id]?.mech !== undefined ? endCounters[row.nozzle.id].mech : ''}
                                  onChange={(e) => setEndCounters(prev => ({...prev, [row.nozzle.id]: { ...prev[row.nozzle.id], mech: e.target.value }}))}
                                  className="w-32 text-right bg-transparent border-b border-emerald-200 font-mono font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-indigo-600 text-right whitespace-nowrap">{row.qtyElec.toFixed(3)} L</td>
                          <td className="p-3 font-mono font-bold text-emerald-600 text-right whitespace-nowrap">{row.qtyMech.toFixed(3)} L</td>
                          <td className="p-3 font-mono text-slate-500 text-right">{row.price.toFixed(2)}</td>
                          <td className="p-3 font-mono font-black text-slate-800 text-right">{row.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={6} className="p-3 text-right text-slate-500 uppercase text-xs">Total ventes carburants</td>
                        <td className="p-3 font-mono text-lg text-emerald-600 text-right">{fuelSalesDetails.totalFuelAmount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-[2]">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sélectionner Produit</label>
                    <select 
                      id="newProdId"
                      className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500"
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const prod = store.shopProducts.find(p => p.id === selectedId);
                        if (prod) {
                           (document.getElementById('newProdPrice') as HTMLInputElement).value = prod.salePrice.toString();
                        } else {
                           (document.getElementById('newProdPrice') as HTMLInputElement).value = '';
                        }
                      }}
                    >
                      <option value="">Sélectionnez un produit...</option>
                      {store.shopProducts.map(sp => (
                        <option key={sp.id} value={sp.id}>{sp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Qté</label>
                    <input type="number" id="newProdQty" defaultValue="1" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Prix U.</label>
                    <input type="number" id="newProdPrice" placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                  <button onClick={() => {
                    const select = document.getElementById('newProdId') as HTMLSelectElement;
                    const selectedId = select.value;
                    let name = '';
                    let productId = '';
                    if (selectedId) {
                      const prod = store.shopProducts.find(p => p.id === selectedId);
                      if (prod) {
                        name = prod.name;
                        productId = prod.id;
                      }
                    }
                    const qty = parseFloat((document.getElementById('newProdQty') as HTMLInputElement).value) || 0;
                    const price = parseFloat((document.getElementById('newProdPrice') as HTMLInputElement).value) || 0;
                    if(name && qty && price) {
                      setProductSales([...productSales, { id: `prod_${Date.now()}`, shopProductId: productId, name, qty, price, total: qty * price }]);
                      select.value = '';
                      (document.getElementById('newProdQty') as HTMLInputElement).value = '1';
                      (document.getElementById('newProdPrice') as HTMLInputElement).value = '';
                    } else {
                      alert('Veuillez sélectionner un produit et saisir une quantité et un prix valides.');
                    }
                  }} className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg text-sm hover:bg-slate-900 transition-colors h-[38px] mt-[20px]">
                    Ajouter
                  </button>
                </div>
              </div>

              {productSales.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                      <tr>
                        <th className="p-3">Produit</th>
                        <th className="p-3 text-right">Quantité</th>
                        <th className="p-3 text-right">Prix Unitaire (MAD)</th>
                        <th className="p-3 text-right">Total (MAD)</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productSales.map(item => (
                        <tr key={item.id}>
                          <td className="p-3 font-bold text-slate-700">{item.name}</td>
                          <td className="p-3 font-mono font-bold text-indigo-600 text-right whitespace-nowrap">
                            <input type="number" value={item.qty} onChange={e => {
                              const qty = parseFloat(e.target.value) || 0;
                              setProductSales(productSales.map(p => p.id === item.id ? { ...p, qty, total: qty * p.price } : p));
                            }} className="w-16 text-right bg-transparent border-b border-indigo-200 focus:outline-none focus:border-indigo-500" />
                          </td>
                          <td className="p-3 font-mono text-slate-500 text-right">
                            <input type="number" value={item.price} onChange={e => {
                              const price = parseFloat(e.target.value) || 0;
                              setProductSales(productSales.map(p => p.id === item.id ? { ...p, price, total: p.qty * price } : p));
                            }} className="w-20 text-right bg-transparent border-b border-slate-200 focus:outline-none focus:border-slate-500" />
                          </td>
                          <td className="p-3 font-mono font-black text-slate-800 text-right">{item.total.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <button onClick={() => setProductSales(productSales.filter(p => p.id !== item.id))} className="text-rose-400 hover:text-rose-600">
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="p-3 text-right text-slate-500 uppercase text-xs">Total Boutique</td>
                        <td className="p-3 font-mono text-lg text-amber-600 text-right">{totalProductSales.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Aucune vente de produit enregistrée.
                </div>
              )}
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-[2]">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nouveau Service</label>
                    <input type="text" id="newServiceName" placeholder="Ex: Nettoyage Intégral" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Montant (MAD)</label>
                    <input type="number" id="newServiceAmount" placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-cyan-500" />
                  </div>
                  <button onClick={() => {
                    const name = (document.getElementById('newServiceName') as HTMLInputElement).value;
                    const amount = parseFloat((document.getElementById('newServiceAmount') as HTMLInputElement).value) || 0;
                    if(name && amount) {
                      setServiceSales([...serviceSales, { id: `srv_${Date.now()}`, name, total: amount }]);
                      (document.getElementById('newServiceName') as HTMLInputElement).value = '';
                      (document.getElementById('newServiceAmount') as HTMLInputElement).value = '';
                    }
                  }} className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg text-sm hover:bg-slate-900 transition-colors h-[38px]">
                    Ajouter
                  </button>
                </div>
              </div>

              {serviceSales.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                      <tr>
                        <th className="p-3">Service (Lavage, etc.)</th>
                        <th className="p-3 text-right">Total (MAD)</th>
                        <th className="p-3 text-center w-20">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {serviceSales.map(item => (
                        <tr key={item.id}>
                          <td className="p-3 font-bold text-slate-700">{item.name}</td>
                          <td className="p-3 font-mono font-black text-slate-800 text-right">
                            <input type="number" value={item.total} onChange={e => {
                              const total = parseFloat(e.target.value) || 0;
                              setServiceSales(serviceSales.map(s => s.id === item.id ? { ...s, total } : s));
                            }} className="w-32 text-right bg-transparent border-b border-cyan-200 focus:outline-none focus:border-cyan-500 font-bold" />
                          </td>
                          <td className="p-3 text-center">
                            <button onClick={() => setServiceSales(serviceSales.filter(s => s.id !== item.id))} className="text-rose-400 hover:text-rose-600">
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td className="p-3 text-right text-slate-500 uppercase text-xs">Total Services</td>
                        <td className="p-3 font-mono text-lg text-cyan-600 text-right">{totalServiceSales.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Aucun service enregistré.
                </div>
              )}
            </div>
          )}

          {/* STEP 5 */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <form onSubmit={e => {
                e.preventDefault();
                const type = (document.getElementById('expType') as HTMLSelectElement).value;
                const desc = (document.getElementById('expDesc') as HTMLInputElement).value;
                const amount = parseFloat((document.getElementById('expAmount') as HTMLInputElement).value) || 0;
                const method = (document.getElementById('expMethod') as HTMLSelectElement).value;
                
                if (type && desc && amount) {
                  setExpenses([...expenses, { id: `exp_${Date.now()}`, type, description: desc, amount, method }]);
                  (document.getElementById('expDesc') as HTMLInputElement).value = '';
                  (document.getElementById('expAmount') as HTMLInputElement).value = '';
                }
              }} className="bg-rose-50/50 p-5 rounded-xl border border-rose-100 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                  <select id="expType" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-rose-500" required>
                    <option value="avance">Avance Employé</option>
                    <option value="fourniture">Achat Fourniture</option>
                    <option value="repas">Frais de repas</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div className="flex-[2] min-w-[200px]">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                  <input type="text" id="expDesc" placeholder="Motif de la dépense..." className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-rose-500" required />
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Montant</label>
                  <input type="number" id="expAmount" step="any" placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-rose-500" required />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Paiement</label>
                  <select id="expMethod" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-rose-500">
                    <option value="cash">Espèces (Tiroir)</option>
                    <option value="card">Carte Bancaire</option>
                  </select>
                </div>
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white font-bold rounded-lg text-sm hover:bg-rose-700 h-[38px] min-w-[100px]">
                  Ajouter
                </button>
              </form>

              {expenses.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                      <tr>
                        <th className="p-3">Type</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Mode</th>
                        <th className="p-3 text-right">Montant (MAD)</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expenses.map(exp => (
                        <tr key={exp.id}>
                          <td className="p-3 font-semibold text-slate-700 capitalize">{exp.type}</td>
                          <td className="p-3 text-slate-600">{exp.description}</td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${exp.method === 'cash' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                              {exp.method === 'cash' ? 'Espèces' : 'CB'}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-rose-600 text-right">{exp.amount.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <button onClick={() => setExpenses(expenses.filter(e => e.id !== exp.id))} className="text-rose-400 hover:text-rose-600">
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="p-3 text-right text-slate-500 uppercase text-xs">Total Dépenses</td>
                        <td className="p-3 font-mono text-lg text-rose-600 text-right">{totalExpenses.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Aucune dépense signalée.
                </div>
              )}
            </div>
          )}

          {/* STEP 6 */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800 font-display">Encaissement non espèce</h2>
                  <p className="text-sm text-slate-500">Saisissez les montants encaissés via des moyens autres que l'espèce.</p>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Total Ventes</span>
                  <span className="text-xl font-black text-slate-800 font-mono">{grandTotalSales.toFixed(2)} MAD</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
    { key: 'carteSntl', label: 'CARTE SNTL' },
    { key: 'espece', label: 'ESPECE' },
    { key: 'bonCarburantsVivo', label: 'BON CARBURANTS VIVO' },
    { key: 'vignette', label: 'VIGNETTE' },
    { key: 'bonClient', label: 'BON CLIENT' }
  ].map(method => (
                  <div key={method.key} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-bold text-slate-700">{method.label}</label>
                      <button
                        onClick={() => {
                          setNonCashPayments({
                            ...nonCashPayments,
                            [method.key]: [...nonCashPayments[method.key as keyof typeof nonCashPayments], method.key === 'bonClient' ? { amount: 0, clientName: '', date: new Date().toISOString().split('T')[0] } : { amount: 0, clientId: '', date: new Date().toISOString().split('T')[0] }]
                          });
                        }}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded"
                      >
                        <Plus className="w-3 h-3" /> Ajouter
                      </button>
                    </div>
                    <div className="space-y-2">
                      {nonCashPayments[method.key as keyof typeof nonCashPayments].length === 0 && (
                        <div className="text-sm text-slate-400 italic text-center py-4 bg-white rounded-lg border border-dashed border-slate-200">Aucun encaissement {method.label}</div>
                      )}
                      {nonCashPayments[method.key as keyof typeof nonCashPayments].map((entry, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-2 relative p-2 bg-white rounded-lg border border-slate-200 shadow-sm items-center">
                          <div className="flex-1 w-full">
                            <div className="relative">
                              <input
                                type="number"
                                value={entry.amount || ''}
                                onChange={e => {
                                  const newArr = [...nonCashPayments[method.key as keyof typeof nonCashPayments]];
                                  newArr[idx].amount = parseFloat(e.target.value) || 0;
                                  setNonCashPayments({ ...nonCashPayments, [method.key]: newArr });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold font-mono rounded focus:ring-indigo-500 focus:border-indigo-500 block p-2 pr-10"
                                placeholder="0.00"
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400 font-bold text-xs">MAD</div>
                            </div>
                          </div>
                          {method.key === 'carteSntl' && (
                          <div className="w-24 shrink-0">
                              <input
                                type="text"
                                placeholder="STAN"
                                value={(entry as any).stan || ''}
                                onChange={e => {
                                  const newArr = [...nonCashPayments[method.key as keyof typeof nonCashPayments]] as any[];
                                  newArr[idx].stan = e.target.value;
                                  setNonCashPayments({ ...nonCashPayments, [method.key]: newArr });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 block p-2 h-[38px] font-mono"
                              />
                          </div>
                        )}
                        {method.key === 'bonClient' && (
                          <div className="flex-1 w-full">
                              <input
                                type="text"
                                placeholder="Nom du client"
                                value={(entry as any).clientName || ''}
                                onChange={e => {
                                  const newArr = [...nonCashPayments[method.key as keyof typeof nonCashPayments]] as any[];
                                  newArr[idx].clientName = e.target.value;
                                  setNonCashPayments({ ...nonCashPayments, [method.key]: newArr });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 block p-2 h-[38px]"
                              />
                          </div>
                        )}
                          <div className="flex-1 w-full">
                            <input
                              type="date"
                              value={(entry as any).date || ''}
                              onChange={e => {
                                const newArr = [...nonCashPayments[method.key as keyof typeof nonCashPayments]] as any[];
                                newArr[idx].date = e.target.value;
                                setNonCashPayments({ ...nonCashPayments, [method.key]: newArr });
                              }}
                              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 block p-2 h-[38px]"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const newArr = [...nonCashPayments[method.key as keyof typeof nonCashPayments]];
                              newArr.splice(idx, 1);
                              setNonCashPayments({ ...nonCashPayments, [method.key]: newArr });
                            }}
                            className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg shrink-0 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 space-y-2">
                {totalCarteSntl > 0 && (
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-600">Total Carte SNTL</span>
                    <span className="font-bold text-slate-900 font-mono">{totalCarteSntl.toFixed(2)} MAD</span>
                  </div>
                )}
                {totalEspeceClient > 0 && (
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-600">Total Espèce (Client)</span>
                    <span className="font-bold text-slate-900 font-mono">{totalEspeceClient.toFixed(2)} MAD</span>
                  </div>
                )}
                {totalBonVivo > 0 && (
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-600">Total Bon Carburants Vivo</span>
                    <span className="font-bold text-slate-900 font-mono">{totalBonVivo.toFixed(2)} MAD</span>
                  </div>
                )}
                {totalVignette > 0 && (
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-600">Total Vignette</span>
                    <span className="font-bold text-slate-900 font-mono">{totalVignette.toFixed(2)} MAD</span>
                  </div>
                )}
                {totalBonClient > 0 && (
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-600">Total Bon Client</span>
                    <span className="font-bold text-slate-900 font-mono">{totalBonClient.toFixed(2)} MAD</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center">
                <span className="font-bold text-indigo-800">Total Encaissement non espèce :</span>
                <span className="font-black text-xl text-indigo-900 font-mono">
                  {totalNonCashPayments.toFixed(2)} MAD
                </span>
              </div>
            </div>
          )}

          {/* STEP 7: Validation */}
          {currentStep === 7 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 font-display tracking-tight">Rapport de Clôture</h3>
                    <p className="text-xs text-slate-500">Vérifiez les totaux avant validation finale</p>
                  </div>
                </div>

                {(() => {
                  const attendant = store.attendants.find(a => a.id === attendantId);
                  const attendantName = attendant ? `${attendant.firstName} ${attendant.lastName}` : '';
                  const especeARemettre = theoreticalCash;


                  const nozzleRows = fuelSalesDetails.details.map(d => ({
                    nozzleName: d.nozzle.name,
                    productName: d.nozzle.productName,
                    startElec: d.startElec,
                    startMech: d.startMech,
                    endElec: d.endElec,
                    endMech: d.endMech,
                    liters: d.qtyElec,
                    amount: d.total
                  }));

                  const productAggregates: Record<string, { name: string, liters: number, amount: number }> = {};
                  const usedTanks = new Set<string>();

                  fuelSalesDetails.details.forEach(d => {
                    if (d.qtyElec > 0) {
                      usedTanks.add(d.nozzle.tankId);
                      const prodName = d.nozzle.productName || 'Carburant Inconnu';
                      if (!productAggregates[prodName]) {
                        productAggregates[prodName] = { name: prodName, liters: 0, amount: 0 };
                      }
                      productAggregates[prodName].liters += d.qtyElec;
                      productAggregates[prodName].amount += d.total;
                    }
                  });

                  return (
                    <div className="space-y-6">
                      {/* EN TÊTE COMPACT */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div>
                          <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mb-1">Pompiste</div>
                          <div className="font-bold text-slate-800 text-lg uppercase">{attendantName}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mb-1">Période</div>
                          <div className="font-bold text-slate-800">
                            {new Date(date).toLocaleDateString('fr-FR')} {startTime} &rarr; {endDate ? new Date(endDate).toLocaleDateString('fr-FR') : ''} {endTime || 'En cours'}
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

{/* NON-CASH BREAKDOWN IN CLOSING REPORT */}
                      {totalNonCashPayments > 0 && (
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                            Détail des Encaissements Non-Espèces
                          </h4>
                          <div className="rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full text-xs text-left">
                              <tbody className="divide-y divide-slate-100">
                                {totalCarteSntl > 0 && (
                                  <tr>
                                    <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">Carte SNTL</td>
                                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{totalCarteSntl.toFixed(2)} DH</td>
                                  </tr>
                                )}
                                {totalEspeceClient > 0 && (
                                  <tr>
                                    <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">Espèce (Déclaration)</td>
                                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{totalEspeceClient.toFixed(2)} DH</td>
                                  </tr>
                                )}
                                {totalBonVivo > 0 && (
                                  <tr>
                                    <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">Bon Carburants Vivo</td>
                                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{totalBonVivo.toFixed(2)} DH</td>
                                  </tr>
                                )}
                                {totalVignette > 0 && (
                                  <tr>
                                    <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">Vignette</td>
                                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{totalVignette.toFixed(2)} DH</td>
                                  </tr>
                                )}
                                {totalBonClient > 0 && (
                                  <tr>
                                    <td className="px-3 py-2 font-bold text-slate-800 bg-slate-50">Bon Client</td>
                                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{totalBonClient.toFixed(2)} DH</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* FINANCES COMPACTES */}

                      <div>
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                          Bilan Financier
                        </h4>
                        <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50/50">
                          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-200">
                            <div className="p-3">
                              <div className="text-[10px] uppercase text-slate-500 mb-1">Total Ventes</div>
                              <div className="font-mono font-bold text-slate-800">{grandTotalSales.toFixed(2)} DH</div>
                            </div>
                            <div className="p-3">
                              <div className="text-[10px] uppercase text-slate-500 mb-1">Non-Espèces</div>
                              <div className="font-mono font-bold text-rose-600">-{totalNonCashPayments.toFixed(2)} DH</div>
                            </div>
                            <div className="p-3">
                              <div className="text-[10px] uppercase text-slate-500 mb-1">Dépenses</div>
                              <div className="font-mono font-bold text-rose-600">-{cashExpenses.toFixed(2)} DH</div>
                            </div>
                            <div className="p-3 bg-emerald-50">
                              <div className="text-[10px] uppercase text-emerald-600 font-bold mb-1">Espèces à remettre</div>
                              <div className="font-mono font-black text-emerald-700 text-lg">{especeARemettre.toFixed(2)} DH</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );

                })()}
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                <h4 className="font-bold text-indigo-900 mb-2">Confirmation</h4>
                <p className="text-sm text-indigo-700/80 mb-6">En validant cette clôture, les données seront verrouillées, les stocks de cuves mis à jour, et les écritures de caisse générées.</p>
                <button 
                  onClick={handleSaveShift}
                  disabled={!attendantId}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-5 h-5" />
                  Valider et Clôturer le Shift
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button 
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Précédent
          </button>
          
          <div className="flex gap-2">
            {[1,2,3,4,5,6,7].map(step => (
              <div key={step} className={`w-2 h-2 rounded-full ${currentStep === step ? 'bg-indigo-600' : currentStep > step ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            ))}
          </div>

          <button 
            onClick={() => setCurrentStep(Math.min(7, currentStep + 1))}
            disabled={currentStep === 7}
            className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
              currentStep === 7 
                ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
            }`}
          >
            Suivant <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
