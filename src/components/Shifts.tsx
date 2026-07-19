import SharedShiftReport from "./SharedShiftReport";
import React, { useState, useEffect } from 'react';
import {
  Database, Droplet,  
  ClipboardList, Plus, Play, CheckCircle2, AlertTriangle, ArrowRight, 
  Fuel, ShieldAlert, FileSpreadsheet, Calendar, User, Info, Clock, CheckCircle, X, Check 
, Download , Edit, Trash2, ChevronLeft, ChevronRight , Wallet, Package, Wrench, ChevronDown, ChevronUp, CreditCard , Settings, Printer } from 'lucide-react';
import { useRef } from 'react';
import { ERPStoreType } from '../store';
import { Shift, Nozzle } from '../types';
import ShiftWizard from './ShiftWizard';

function parseOklch(l: number, c: number, h: number, a: number = 1): string {
  if (c < 0.015) {
    const val = Math.round(l * 255);
    return `rgba(${val}, ${val}, ${val}, ${a})`;
  }
  let r = 0, g = 0, b = 0;
  if (h >= 340 || h < 20) {
    r = 239; g = 68; b = 68;
  } else if (h >= 20 && h < 50) {
    r = 249; g = 115; b = 22;
  } else if (h >= 50 && h < 90) {
    r = 245; g = 158; b = 11;
  } else if (h >= 90 && h < 165) {
    r = 34; g = 197; b = 94;
  } else if (h >= 165 && h < 200) {
    r = 20; g = 184; b = 166;
  } else if (h >= 200 && h < 280) {
    r = 59; g = 130; b = 246;
  } else {
    r = 168; g = 85; b = 247;
  }
  if (l > 0.5) {
    const factor = (l - 0.5) * 2;
    r = Math.round(r + (255 - r) * factor);
    g = Math.round(g + (255 - g) * factor);
    b = Math.round(b + (255 - b) * factor);
  } else {
    const factor = l * 2;
    r = Math.round(r * factor);
    g = Math.round(g * factor);
    b = Math.round(b * factor);
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function parseOklab(l: number, a: number, b: number, alpha: number = 1): string {
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return parseOklch(l, c, h, alpha);
}

function safeParseFloat(val: string, fallback = 0): number {
  if (!val || val.trim().toLowerCase() === 'none') return 0;
  const num = parseFloat(val);
  return isNaN(num) ? fallback : num;
}

function convertOklchOklabToRgb(val: string): string {
  let result = val.replace(/oklch\(([^)]+)\)/gi, (_, inner) => {
    try {
      const parts = inner.trim().split(/[\s,/]+/);
      if (parts.length >= 3) {
        const lVal = parts[0];
        const cVal = parts[1];
        const hVal = parts[2];
        const aVal = parts[3];

        const l = lVal.endsWith('%') ? safeParseFloat(lVal) / 100 : safeParseFloat(lVal);
        const c = cVal.endsWith('%') ? (safeParseFloat(cVal) / 100) * 0.4 : safeParseFloat(cVal);
        const h = hVal.endsWith('deg') ? safeParseFloat(hVal.slice(0, -3)) : safeParseFloat(hVal);
        
        let alpha = 1;
        if (aVal) {
          alpha = aVal.endsWith('%') ? safeParseFloat(aVal) / 100 : safeParseFloat(aVal);
        }
        return parseOklch(l, c, h, alpha);
      }
    } catch (e) {}
    return 'rgba(100, 116, 139, 1)';
  });

  result = result.replace(/oklab\(([^)]+)\)/gi, (_, inner) => {
    try {
      const parts = inner.trim().split(/[\s,/]+/);
      if (parts.length >= 3) {
        const lVal = parts[0];
        const aVal = parts[1];
        const bVal = parts[2];
        const alphaVal = parts[3];

        const l = lVal.endsWith('%') ? safeParseFloat(lVal) / 100 : safeParseFloat(lVal);
        const a = aVal.endsWith('%') ? (safeParseFloat(aVal) / 100) * 0.4 : safeParseFloat(aVal);
        const b = bVal.endsWith('%') ? (safeParseFloat(bVal) / 100) * 0.4 : safeParseFloat(bVal);
        
        let alpha = 1;
        if (alphaVal) {
          alpha = alphaVal.endsWith('%') ? safeParseFloat(alphaVal) / 100 : safeParseFloat(alphaVal);
        }
        return parseOklab(l, a, b, alpha);
      }
    } catch (e) {}
    return 'rgba(100, 116, 139, 1)';
  });

  return result;
}

interface ShiftsProps {
  store: ERPStoreType;
}

const printStyles = `
  @media print {
    body > :not(.print-only-container) {
      display: none !important;
    }
    .print-only-container {
      display: block !important;
      position: absolute;
      left: 0;
      top: 0;
      width: 100% !important;
      background: white !important;
      color: #0f172a !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      background: white !important;
      color: #0f172a !important;
    }
    @page {
      size: A4;
      margin: 15mm 12mm 15mm 12mm;
    }
    #shift-report-content {
      overflow: visible !important;
      height: auto !important;
      max-height: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    .print-avoid-break {
      break-inside: avoid !important;
      -webkit-column-break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  }
  @media screen {
    .print-only-container {
      display: none !important;
    }
  }
`;

const formatToDMY = (dateStr: string): string => {
  if (!dateStr) return 'JJ/MM/AAAA';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

interface DatePickerProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  id?: string;
  size?: 'sm' | 'md';
}

const DatePickerWrapper = ({ value, onChange, className = '', id, size = 'md' }: DatePickerProps) => {
  const isSm = size === 'sm';
  return (
    <div className="relative w-full">
      <input 
        type="date"
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
      />
      <div className={`w-full border border-slate-200 text-slate-900 rounded flex justify-between items-center pointer-events-none select-none transition-colors
        ${isSm ? 'bg-slate-50 text-xs p-1 h-[28px]' : 'bg-white text-sm p-3 min-h-[46px]'}
        ${className}`}
      >
        <span className="font-medium text-slate-700">{formatToDMY(value)}</span>
        <Calendar className={`${isSm ? 'w-3 h-3' : 'w-4 h-4'} text-slate-400`} />
      </div>
    </div>
  );
};

export default function Shifts({ store }: ShiftsProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    const element = contentRef.current;
    if (!element) return;
    setIsPrinting(true);

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setIsPrinting(false);
        alert("Veuillez autoriser les fenêtres contextuelles (pop-ups) pour imprimer le rapport.");
        return;
      }

      // Clone the content element
      const clone = element.cloneNode(true) as HTMLDivElement;
      clone.style.overflow = 'visible';
      clone.style.height = 'auto';
      clone.style.maxHeight = 'none';
      clone.style.padding = '20px';
      clone.style.margin = '0 auto';
      clone.style.backgroundColor = 'white';
      clone.style.color = '#0f172a';

      // We should also convert OKLCH/OKLAB in the clone's inline styles
      const allCloneElements = clone.querySelectorAll('*');
      allCloneElements.forEach((el) => {
        const styleAttr = el.getAttribute('style');
        if (styleAttr && (/oklch/i.test(styleAttr) || /oklab/i.test(styleAttr))) {
          el.setAttribute('style', convertOklchOklabToRgb(styleAttr));
        }
      });

      // Grab existing stylesheets and style tags, translating oklch/oklab to rgb
      let stylesHtml = '';
      Array.from(window.document.querySelectorAll('link[rel="stylesheet"], style')).forEach((el) => {
        try {
          if (el.tagName.toLowerCase() === 'style') {
            const content = el.textContent || '';
            stylesHtml += `<style>${convertOklchOklabToRgb(content)}</style>\n`;
          } else if (el.tagName.toLowerCase() === 'link') {
            stylesHtml += el.outerHTML + '\n';
          }
        } catch (e) {
          console.warn("Failed to copy stylesheet element", e);
        }
      });

      printWindow.document.write(`
        <html>
          <head>
            <title>Rapport de Shift - ${selectedDetailShift?.attendantName || 'Report'}</title>
            ${stylesHtml}
            <style>
              @page {
                size: A4;
                margin: 10mm !important;
              }
              @media print {
                body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background-color: white !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body > * {
                  display: block !important;
                }
                .no-print { display: none !important; }
              }
              body {
                background-color: white !important;
                color: #0f172a !important;
                margin: 0;
                padding: 10px;
                font-family: system-ui, -apple-system, sans-serif;
              }
            </style>
          </head>
          <body>
            <div class="print-only-container" style="width: 100%; max-width: 800px; margin: 0 auto;">
              ${clone.outerHTML}
            </div>
            <script>
              window.addEventListener('load', () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 800);
              });
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
      setIsPrinting(false);
    } catch (err) {
      console.error("Native printing failed:", err);
      setIsPrinting(false);
    }
  };

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

  const [localPrices, setLocalPrices] = useState<{ [id: string]: { purchase: number, sale: number } }>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const prices: { [id: string]: { purchase: number, sale: number } } = {};
    store.products.forEach(p => {
      if (['gazoil', 'sans_plomb', 'melange'].includes(p.type)) {
        prices[p.id] = { purchase: p.purchasePrice, sale: p.salePrice };
      }
    });
    setLocalPrices(prev => {
      if (Object.keys(prev).length === 0) {
        return prices;
      }
      return prev;
    });
  }, [store.products]);

  const handleSavePrices = () => {
    const bulkUpdates = Object.keys(localPrices).map(id => {
      const { purchase, sale } = localPrices[id];
      return { id, updates: { purchasePrice: purchase, salePrice: sale } };
    });
    
    if (store.updateProductsBulk) {
      store.updateProductsBulk(bulkUpdates, 'Directeur ERP');
    } else {
      bulkUpdates.forEach(({ id, updates }) => {
        if (store.updateProduct) {
          store.updateProduct(id, updates, 'Directeur ERP');
        }
      });
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const downloadPDF = () => {
    handlePrint();
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
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
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
                  <span className="text-xs text-slate-500 shrink-0">Du:</span>
                  <DatePickerWrapper 
                    value={filterStartDate} 
                    onChange={(val) => { setFilterStartDate(val); setCurrentPage(1); }} 
                    size="sm"
                    className="w-28"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 shrink-0">Au:</span>
                  <DatePickerWrapper 
                    value={filterEndDate} 
                    onChange={(val) => { setFilterEndDate(val); setCurrentPage(1); }} 
                    size="sm"
                    className="w-28"
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
                      <th className="p-3.5">Dépenses / Manquant</th>
                      
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
                            const carburantsTotal = s.totalAmount || 0;
                            const produitsTotal = s.productsSold?.reduce((sum, item) => sum + item.total, 0) || 0;
                            const servicesTotal = s.servicesSold?.reduce((sum, item) => sum + item.total, 0) || 0;
                            const totalSales = carburantsTotal + produitsTotal + servicesTotal;
                            return totalSales.toFixed(2);
                          })()} MAD
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">
                          {(() => {
                            const carteSntl = s.nonCashPayments?.carteSntl?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const espece = s.nonCashPayments?.espece?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const vignette = s.nonCashPayments?.vignette?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const bonClient = s.nonCashPayments?.bonClient?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const bonCarburantsVivo = s.nonCashPayments?.bonCarburantsVivo?.reduce((sum: any, item: any) => sum + item.amount, 0) || 0;
                            const tpe = s.nonCashPayments?.tpe?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const cheque = s.nonCashPayments?.cheque?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const virement = s.nonCashPayments?.virement?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const autre = s.nonCashPayments?.autre?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const nonCashTotal = carteSntl + espece + bonCarburantsVivo + vignette + bonClient + tpe + cheque + virement + autre;
                            const expensesTotal = s.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
                            return (nonCashTotal + expensesTotal).toFixed(2);
                          })()} MAD
                        </td>
                        <td className="p-3.5 font-mono font-semibold">
                          {(() => {
                            const carteSntl = s.nonCashPayments?.carteSntl?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const espece = s.nonCashPayments?.espece?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const vignette = s.nonCashPayments?.vignette?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const bonClient = s.nonCashPayments?.bonClient?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const bonCarburantsVivo = s.nonCashPayments?.bonCarburantsVivo?.reduce((sum: any, item: any) => sum + item.amount, 0) || 0;
                            const tpe = s.nonCashPayments?.tpe?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const cheque = s.nonCashPayments?.cheque?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const virement = s.nonCashPayments?.virement?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const autre = s.nonCashPayments?.autre?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const nonCashTotal = carteSntl + espece + bonCarburantsVivo + vignette + bonClient + tpe + cheque + virement + autre;
                            const expensesTotal = s.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
                            const encaissements = nonCashTotal + expensesTotal;
                            
                            const carburantsTotal = s.totalAmount || 0;
                            const produitsTotal = s.productsSold?.reduce((sum, item) => sum + item.total, 0) || 0;
                            const servicesTotal = s.servicesSold?.reduce((sum, item) => sum + item.total, 0) || 0;
                            const totalSales = carburantsTotal + produitsTotal + servicesTotal;
                            
                            const ecart = totalSales - encaissements;
                            const surplus = ecart < 0;
                            return (
                                <span className={surplus ? "text-emerald-600" : ecart > 0 ? "text-rose-600" : "text-slate-600"}>
                                  {ecart > 0 ? "-" : ecart < 0 ? "+" : ""}{Math.abs(ecart).toFixed(2)} MAD
                                </span>
                            );
                          })()}
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

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-lg shadow-xs">
                  <span className="text-[11px] text-slate-500 font-medium">Grille des tarifs réglementés de distribution de carburant.</span>
                  <button 
                    type="button"
                    onClick={handleSavePrices}
                    className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${saveSuccess ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  >
                    {saveSuccess ? <CheckCircle className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    {saveSuccess ? 'Enregistré' : 'Mettre à jour'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {store.products.filter(p => p.status === 'active').map(prod => (
                    <div key={prod.id} className="bg-white border rounded-xl overflow-hidden p-4 shadow-xs flex flex-col justify-between border-slate-200">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                            <Fuel className="w-4 h-4" />
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                            En vente
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 font-display text-sm">{prod.name}</h3>
                          <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">Taxe (TVA): {prod.vatRate}%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs font-mono">
                          <div className="bg-slate-50 p-2 rounded text-center border border-slate-100">
                            <span className="text-[9px] text-slate-400 font-sans block mb-1">Achat (MAD/L)</span>
                            <input 
                              type="number" 
                              step="any"
                              value={localPrices[prod.id]?.purchase !== undefined ? localPrices[prod.id].purchase : (prod.purchasePrice || 0)}
                              onChange={e => setLocalPrices(prev => ({ ...prev, [prod.id]: { ...prev[prod.id], purchase: parseFloat(e.target.value) || 0, sale: prev[prod.id]?.sale ?? prod.salePrice } }))}
                              className="w-full text-center bg-white border border-slate-200 rounded p-1 font-bold text-slate-700 focus:outline-none focus:border-indigo-500" 
                            />
                          </div>
                          <div className="bg-slate-50 p-2 rounded text-center border border-slate-100">
                            <span className="text-[9px] text-slate-400 font-sans block mb-1">Vente Pompe</span>
                            <input 
                              type="number" 
                              step="any"
                              value={localPrices[prod.id]?.sale !== undefined ? localPrices[prod.id].sale : (prod.salePrice || 0)}
                              onChange={e => setLocalPrices(prev => ({ ...prev, [prod.id]: { ...prev[prod.id], sale: parseFloat(e.target.value) || 0, purchase: prev[prod.id]?.purchase ?? prod.purchasePrice } }))}
                              className="w-full text-center bg-white border border-slate-200 rounded p-1 font-bold text-indigo-600 focus:outline-none focus:border-indigo-500" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                            <div>
                              <h4 className={`font-bold text-sm ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>{pump.number}</h4>
                              {pump.serialNumber && <p className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-blue-600/80' : 'text-slate-500'}`}>S/N: {pump.serialNumber}</p>}
                            </div>
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
                <div><strong>Pompes affectées :</strong> {selectedPumps.map(pId => {
                  const p = pumps.find(p => p.id === pId);
                  return p ? `${p.number}${p.serialNumber ? ` (S/N: ${p.serialNumber})` : ''}` : '';
                }).join(', ')}</div>
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
              <SharedShiftReport shift={selectedDetailShift} store={store} />

            </div>

            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 shrink-0 flex justify-end gap-3 rounded-b-xl hide-in-pdf">
              <button 
                onClick={() => setSelectedDetailShift(null)}
                className="px-4 py-2 rounded-lg font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 text-sm"
              >
                Fermer
              </button>
              <button 
                onClick={handlePrint}
                disabled={isPrinting}
                className={`px-4 py-2 rounded-lg font-bold text-white flex items-center gap-2 text-sm transition-colors ${
                  isPrinting 
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isPrinting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Génération...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    Imprimer
                  </>
                )}
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