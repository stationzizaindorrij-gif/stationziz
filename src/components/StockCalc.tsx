import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, Fuel, TrendingDown, TrendingUp, 
  Printer, Info, BarChart3, Filter, CheckCircle2, Layers,
  DollarSign, CheckSquare, Square, PieChart, ArrowUpRight, ArrowDownRight, Tag, RefreshCw,
  Scale, AlertCircle, Save, Database, Trash2, FolderOpen, History
} from 'lucide-react';
import { ERPStoreType } from '../store';
import { Product, Supply, Tank, Nozzle, SimulationRecord } from '../types';

interface StockCalcProps {
  store: ERPStoreType;
}

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';
type MainTab = 'stock_theorique' | 'simulation_entrees_sorties';

// Date utility functions
function getTodayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateFR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function getWeekRange(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0 is Sunday
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diffToMonday);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const da = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  };

  return { start: fmt(monday), end: fmt(sunday) };
}

function getMonthRange(year: number, month: number): { start: string; end: string } {
  const mStr = String(month + 1).padStart(2, '0');
  const start = `${year}-${mStr}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${mStr}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

function getYearRange(year: number): { start: string; end: string } {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

function formatLiters(num: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num) + ' L';
}

function formatDH(num: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num) + ' DH';
}

export default function StockCalc({ store }: StockCalcProps) {
  const { products, supplies = [], shifts = [], tanks = [], nozzles = [], pumps = [] } = store;

  // Main Module View Mode Tab
  const [mainTab, setMainTab] = useState<MainTab>('stock_theorique');

  // Selected period state (shared for both calculations)
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [selectedDay, setSelectedDay] = useState<string>(getTodayStr());
  const [selectedWeekDate, setSelectedWeekDate] = useState<string>(getTodayStr());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customStartDate, setCustomStartDate] = useState<string>(getTodayStr());
  const [customEndDate, setCustomEndDate] = useState<string>(getTodayStr());

  // Active view tab inside "Stock Théorique" sub-view
  const [activeTab, setActiveTab] = useState<'summary' | 'achats_detail' | 'sorties_detail'>('summary');

  // --- State for "Rentabilité par Pompe" ---
  // Manual purchase price per product ID (or per fuel name)
  const [manualPurchasePrices, setManualPurchasePrices] = useState<Record<string, number>>({});

  // Selected nozzle IDs for profitability calculation
  const [selectedNozzleIds, setSelectedNozzleIds] = useState<string[]>([]);

  // Initialize manual purchase prices from products
  useEffect(() => {
    setManualPurchasePrices(prev => {
      const next = { ...prev };
      products.forEach(p => {
        if (next[p.id] === undefined) {
          next[p.id] = p.purchasePrice && p.purchasePrice > 0 ? p.purchasePrice : 1.00;
        }
      });
      return next;
    });
  }, [products]);

  // Initialize selected nozzles to select all by default
  useEffect(() => {
    if (nozzles.length > 0 && selectedNozzleIds.length === 0) {
      setSelectedNozzleIds(nozzles.map(n => n.id));
    }
  }, [nozzles]);

  // --- State for "Simulation des Entrées et Sorties" ---
  const [simNozzleIds, setSimNozzleIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('station_erp_sim_nozzle_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [simInputs, setSimInputs] = useState<Record<string, { entries: number; exits: number; purchasePrice: number }>>(() => {
    try {
      const saved = localStorage.getItem('station_erp_sim_inputs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [simTitle, setSimTitle] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Persist live draft changes automatically
  useEffect(() => {
    try {
      localStorage.setItem('station_erp_sim_nozzle_ids', JSON.stringify(simNozzleIds));
    } catch (e) {}
  }, [simNozzleIds]);

  useEffect(() => {
    try {
      localStorage.setItem('station_erp_sim_inputs', JSON.stringify(simInputs));
    } catch (e) {}
  }, [simInputs]);

  // Initialize simulation inputs from nozzles and products
  useEffect(() => {
    setSimInputs(prev => {
      const next = { ...prev };
      nozzles.forEach(nozzle => {
        const product = products.find(p => p.id === nozzle.productId) || 
                        products.find(p => p.name.trim().toLowerCase() === (nozzle.productName || '').trim().toLowerCase());
        const defaultPrice = product?.purchasePrice && product.purchasePrice > 0 ? product.purchasePrice : 1.00;
        if (!next[nozzle.id]) {
          next[nozzle.id] = {
            entries: 0,
            exits: 0,
            purchasePrice: defaultPrice
          };
        }
      });
      return next;
    });
  }, [nozzles, products]);

  const handleSaveSimulationToDatabase = () => {
    const defaultTitle = `Simulation du ${formatDateFR(getTodayStr())} (${periodLabel})`;
    const titleToSave = simTitle.trim() || defaultTitle;

    if (store.addSimulationRecord) {
      store.addSimulationRecord({
        date: new Date().toISOString(),
        title: titleToSave,
        periodLabel,
        nozzleIds: simNozzleIds,
        inputs: simInputs,
        totals: totalsSimulation
      }, 'ADMIN');
    }

    setSaveSuccessMsg(`Simulation "${titleToSave}" enregistrée dans la base de données !`);
    setSimTitle('');
    setTimeout(() => setSaveSuccessMsg(''), 5000);
  };

  const handleLoadSimulation = (rec: SimulationRecord) => {
    if (rec.nozzleIds) setSimNozzleIds(rec.nozzleIds);
    if (rec.inputs) setSimInputs(rec.inputs);
    setSaveSuccessMsg(`Simulation "${rec.title}" chargée dans le simulateur.`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleDeleteSimulation = (id: string) => {
    if (store.deleteSimulationRecord) {
      store.deleteSimulationRecord(id, 'ADMIN');
    }
  };

  // Compute effective start and end dates based on period selection
  const { startDate, endDate, periodLabel } = useMemo(() => {
    let start = '';
    let end = '';
    let label = '';

    if (periodType === 'day') {
      start = selectedDay;
      end = selectedDay;
      label = `Journée du ${formatDateFR(selectedDay)}`;
    } else if (periodType === 'week') {
      const range = getWeekRange(selectedWeekDate);
      start = range.start;
      end = range.end;
      label = `Semaine du ${formatDateFR(start)} au ${formatDateFR(end)}`;
    } else if (periodType === 'month') {
      const range = getMonthRange(selectedYear, selectedMonth);
      start = range.start;
      end = range.end;
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];
      label = `${monthNames[selectedMonth]} ${selectedYear} (${formatDateFR(start)} - ${formatDateFR(end)})`;
    } else if (periodType === 'year') {
      const range = getYearRange(selectedYear);
      start = range.start;
      end = range.end;
      label = `Année ${selectedYear} (${formatDateFR(start)} - ${formatDateFR(end)})`;
    } else {
      start = customStartDate || getTodayStr();
      end = customEndDate || getTodayStr();
      label = `Du ${formatDateFR(start)} au ${formatDateFR(end)}`;
    }

    return { startDate: start, endDate: end, periodLabel: label };
  }, [
    periodType, selectedDay, selectedWeekDate, selectedMonth, 
    selectedYear, customStartDate, customEndDate
  ]);

  // Helper matchers for Stock Théorique
  const isSupplyForProduct = (supply: Supply, product: Product): boolean => {
    if (supply.productId && supply.productId === product.id) return true;
    if (supply.productName && supply.productName.trim().toLowerCase() === product.name.trim().toLowerCase()) return true;
    if (supply.tankId) {
      const tank = tanks.find(t => t.id === supply.tankId);
      if (tank) {
        if (tank.productId === product.id) return true;
        if (tank.productName && tank.productName.trim().toLowerCase() === product.name.trim().toLowerCase()) return true;
      }
    }
    return false;
  };

  const isNozzleForProduct = (nozId: string, product: Product): boolean => {
    const nozzle = nozzles.find(n => n.id === nozId);
    if (!nozzle) return false;
    if (nozzle.productId && nozzle.productId === product.id) return true;
    if (nozzle.productName && nozzle.productName.trim().toLowerCase() === product.name.trim().toLowerCase()) return true;
    if (nozzle.tankId) {
      const tank = tanks.find(t => t.id === nozzle.tankId);
      if (tank) {
        if (tank.productId === product.id) return true;
        if (tank.productName && tank.productName.trim().toLowerCase() === product.name.trim().toLowerCase()) return true;
      }
    }
    return false;
  };

  // Filter supplies within period
  const filteredSupplies = useMemo(() => {
    return supplies.filter(supply => {
      const dateStr = (supply.date || '').split('T')[0];
      return dateStr >= startDate && dateStr <= endDate;
    });
  }, [supplies, startDate, endDate]);

  // Filter shifts with counters within period
  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      const shiftDate = (shift.date || '').split('T')[0];
      const isInPeriod = shiftDate >= startDate && shiftDate <= endDate;
      const hasCounters = shift.startCounters && shift.endCounters;
      return isInPeriod && hasCounters;
    });
  }, [shifts, startDate, endDate]);

  // Compute stock theoretical totals per fuel product
  const calculationResults = useMemo(() => {
    return products.map(product => {
      // Total Purchases
      const productSupplies = filteredSupplies.filter(s => isSupplyForProduct(s, product));
      const totalAchats = productSupplies.reduce((acc, s) => acc + (Number(s.qtyDelivered) || 0), 0);

      // Total Electronic Counter Sorties
      let totalSortiesElec = 0;
      let shiftsCount = 0;

      filteredShifts.forEach(shift => {
        let shiftHasNozzleForProduct = false;
        if (shift.startCounters && shift.endCounters) {
          Object.keys(shift.startCounters).forEach(nozId => {
            if (isNozzleForProduct(nozId, product)) {
              const start = shift.startCounters[nozId];
              const end = shift.endCounters![nozId];
              if (start && end) {
                const startElec = Number(start.elec) || 0;
                const endElec = Number(end.elec) || 0;
                const qtyElec = Math.max(0, endElec - startElec);
                totalSortiesElec += qtyElec;
                if (qtyElec > 0) shiftHasNozzleForProduct = true;
              }
            }
          });
        }
        if (shiftHasNozzleForProduct) shiftsCount++;
      });

      // Stock Théorique Restant = Total Achats - Total Sorties
      const stockTheorique = totalAchats - totalSortiesElec;

      return {
        product,
        totalAchats,
        totalSortiesElec,
        stockTheorique,
        achatsCount: productSupplies.length,
        shiftsCount
      };
    });
  }, [products, filteredSupplies, filteredShifts, tanks, nozzles]);

  // Totaux Généraux Stock Théorique
  const totalsGeneral = useMemo(() => {
    const totalAchats = calculationResults.reduce((acc, r) => acc + r.totalAchats, 0);
    const totalSorties = calculationResults.reduce((acc, r) => acc + r.totalSortiesElec, 0);
    const stockTheoriqueTotal = totalAchats - totalSorties;
    return {
      totalAchats,
      totalSorties,
      stockTheoriqueTotal
    };
  }, [calculationResults]);

  // --- COMPUTATIONS FOR "Calcul de Rentabilité par Pompe" ---
  const pumpProfitabilityResults = useMemo(() => {
    return nozzles.map(nozzle => {
      const product = products.find(p => p.id === nozzle.productId) || 
                      products.find(p => p.name.trim().toLowerCase() === (nozzle.productName || '').trim().toLowerCase());
      
      const prodId = product?.id || nozzle.productId || 'default';
      const purchasePrice = manualPurchasePrices[prodId] !== undefined 
        ? manualPurchasePrices[prodId] 
        : (product?.purchasePrice && product.purchasePrice > 0 ? product.purchasePrice : 1.00);

      const salePrice = product?.salePrice || 0;

      // Volume sold from electronic counters for this nozzle during filteredShifts
      let volumeElec = 0;
      let shiftCount = 0;

      filteredShifts.forEach(shift => {
        if (shift.startCounters && shift.endCounters && shift.startCounters[nozzle.id] && shift.endCounters[nozzle.id]) {
          const start = Number(shift.startCounters[nozzle.id].elec) || 0;
          const end = Number(shift.endCounters[nozzle.id].elec) || 0;
          const diff = Math.max(0, end - start);
          volumeElec += diff;
          if (diff > 0) shiftCount++;
        }
      });

      const costTotal = volumeElec * purchasePrice;
      const revenueTotal = volumeElec * salePrice;
      const marginTotal = revenueTotal - costTotal;
      const marginPerLiter = salePrice - purchasePrice;
      const marginPercent = costTotal > 0 ? (marginTotal / costTotal) * 100 : (revenueTotal > 0 ? 100 : 0);

      return {
        nozzle,
        product,
        productName: nozzle.productName || product?.name || 'Carburant',
        pumpNumber: nozzle.pumpNumber || '1',
        volumeElec,
        purchasePrice,
        salePrice,
        costTotal,
        revenueTotal,
        marginTotal,
        marginPerLiter,
        marginPercent,
        shiftCount
      };
    });
  }, [nozzles, products, filteredShifts, manualPurchasePrices]);

  // Filtered by user selected nozzles
  const selectedPumpProfitability = useMemo(() => {
    return pumpProfitabilityResults.filter(item => selectedNozzleIds.includes(item.nozzle.id));
  }, [pumpProfitabilityResults, selectedNozzleIds]);

  // Totaux Généraux Rentabilité par Pompe
  const totalsRentabilite = useMemo(() => {
    const totalVolume = selectedPumpProfitability.reduce((acc, r) => acc + r.volumeElec, 0);
    const totalCost = selectedPumpProfitability.reduce((acc, r) => acc + r.costTotal, 0);
    const totalRevenue = selectedPumpProfitability.reduce((acc, r) => acc + r.revenueTotal, 0);
    const totalMargin = totalRevenue - totalCost;
    const countPumpsAnalyzed = selectedPumpProfitability.length;

    return {
      totalVolume,
      totalCost,
      totalRevenue,
      totalMargin,
      countPumpsAnalyzed
    };
  }, [selectedPumpProfitability]);

  // Selection toggle handlers
  const handleToggleSelectAllNozzles = () => {
    if (selectedNozzleIds.length === nozzles.length) {
      setSelectedNozzleIds([]);
    } else {
      setSelectedNozzleIds(nozzles.map(n => n.id));
    }
  };

  const handleToggleNozzle = (id: string) => {
    setSelectedNozzleIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // --- COMPUTATIONS FOR "Simulation des Entrées et Sorties" ---
  const simulationResults = useMemo(() => {
    return nozzles.map(nozzle => {
      const product = products.find(p => p.id === nozzle.productId) || 
                      products.find(p => p.name.trim().toLowerCase() === (nozzle.productName || '').trim().toLowerCase());
      
      const defaultPrice = product?.purchasePrice && product.purchasePrice > 0 ? product.purchasePrice : 1.00;
      const salePrice = product?.salePrice || 0;

      const inp = simInputs[nozzle.id] || { entries: 0, exits: 0, purchasePrice: defaultPrice };
      const entries = Number(inp.entries) || 0;
      const exits = Number(inp.exits) || 0;
      const purchasePrice = inp.purchasePrice !== undefined ? Number(inp.purchasePrice) || 0 : defaultPrice;

      // Quantité consommée = Sortie - Entrée
      const quantiteConsommee = exits - entries;

      // Coût total = Quantité consommée * Prix d'achat
      const costTotal = quantiteConsommee * purchasePrice;

      // Ventes réelles pendant la période sélectionnée pour ce pistolet
      let ventesReelles = 0;
      filteredShifts.forEach(shift => {
        if (shift.startCounters && shift.endCounters && shift.startCounters[nozzle.id] && shift.endCounters[nozzle.id]) {
          const start = Number(shift.startCounters[nozzle.id].elec) || 0;
          const end = Number(shift.endCounters[nozzle.id].elec) || 0;
          const diff = Math.max(0, end - start);
          ventesReelles += diff;
        }
      });

      // Chiffre d'affaires réel = Ventes réelles * Prix de vente
      const caReel = ventesReelles * salePrice;

      // Écart en litres = Quantité consommée - Ventes réelles
      const ecartLitres = quantiteConsommee - ventesReelles;

      // Écart financier = Chiffre d'affaires réel - Coût total
      const ecartFinancier = caReel - costTotal;

      return {
        nozzle,
        product,
        productName: nozzle.productName || product?.name || 'Carburant',
        pumpNumber: nozzle.pumpNumber || '1',
        entries,
        exits,
        quantiteConsommee,
        purchasePrice,
        costTotal,
        ventesReelles,
        salePrice,
        caReel,
        ecartLitres,
        ecartFinancier
      };
    });
  }, [nozzles, products, filteredShifts, simInputs]);

  const selectedSimulationResults = useMemo(() => {
    return simulationResults.filter(item => simNozzleIds.includes(item.nozzle.id));
  }, [simulationResults, simNozzleIds]);

  const totalsSimulation = useMemo(() => {
    const totalEntrees = selectedSimulationResults.reduce((acc, r) => acc + r.entries, 0);
    const totalSorties = selectedSimulationResults.reduce((acc, r) => acc + r.exits, 0);
    const quantiteConsommeeTotal = selectedSimulationResults.reduce((acc, r) => acc + r.quantiteConsommee, 0);
    const totalVentesReelles = selectedSimulationResults.reduce((acc, r) => acc + r.ventesReelles, 0);
    const ecartLitresTotal = quantiteConsommeeTotal - totalVentesReelles;
    const coutTotalSimule = selectedSimulationResults.reduce((acc, r) => acc + r.costTotal, 0);
    const chiffreAffairesReel = selectedSimulationResults.reduce((acc, r) => acc + r.caReel, 0);
    const ecartFinancierTotal = chiffreAffairesReel - coutTotalSimule;

    return {
      totalEntrees,
      totalSorties,
      quantiteConsommeeTotal,
      totalVentesReelles,
      ecartLitresTotal,
      coutTotalSimule,
      chiffreAffairesReel,
      ecartFinancierTotal,
      countPumps: selectedSimulationResults.length
    };
  }, [selectedSimulationResults]);

  const handleSimInputChange = (nozzleId: string, field: 'entries' | 'exits' | 'purchasePrice', value: number) => {
    setSimInputs(prev => ({
      ...prev,
      [nozzleId]: {
        ...(prev[nozzleId] || { entries: 0, exits: 0, purchasePrice: 1.00 }),
        [field]: value
      }
    }));
  };

  const handleToggleSimSelectAllNozzles = () => {
    if (simNozzleIds.length === nozzles.length) {
      setSimNozzleIds([]);
    } else {
      setSimNozzleIds(nozzles.map(n => n.id));
    }
  };

  const handleToggleSimNozzle = (id: string) => {
    setSimNozzleIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handlePriceChange = (productId: string, val: number) => {
    setManualPurchasePrices(prev => ({
      ...prev,
      [productId]: val
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12" id="calcul-stock-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                Calcul de Stock & Rentabilité
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Gestion indépendante du stock théorique et analyse financière par pompe.
              </p>
            </div>
          </div>
        </div>

        {/* Print button */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimer l'Analyse
          </button>
        </div>
      </div>

      {/* Main Feature Navigation Tabs */}
      <div className="flex bg-slate-200/70 p-1.5 rounded-2xl gap-1 max-w-2xl print:hidden">
        <button
          onClick={() => setMainTab('stock_theorique')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'stock_theorique'
              ? 'bg-white text-indigo-700 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          Calcul de Stock Théorique
        </button>
        <button
          onClick={() => setMainTab('simulation_entrees_sorties')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'simulation_entrees_sorties'
              ? 'bg-white text-indigo-700 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          Simulation Entrées & Sorties
        </button>
      </div>

      {/* Selector of Analysis Period (Shared across all sub-features) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Période d'analyse ({
                mainTab === 'stock_theorique' ? 'Stock Théorique' : 'Simulation Entrées & Sorties'
              })
            </h3>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
            {periodLabel}
          </span>
        </div>

        {/* Period type selector buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            onClick={() => setPeriodType('day')}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              periodType === 'day' 
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Par jour
          </button>
          <button
            onClick={() => setPeriodType('week')}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              periodType === 'week' 
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Par semaine
          </button>
          <button
            onClick={() => setPeriodType('month')}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              periodType === 'month' 
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Par mois
          </button>
          <button
            onClick={() => setPeriodType('year')}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              periodType === 'year' 
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Par année
          </button>
          <button
            onClick={() => setPeriodType('custom')}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1 ${
              periodType === 'custom' 
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Personnalisée
          </button>
        </div>

        {/* Dynamic Controls based on Period Type */}
        <div className="pt-2">
          {periodType === 'day' && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="text-xs font-bold text-slate-500">Choisir la date :</label>
              <input 
                type="date" 
                value={selectedDay}
                onChange={e => setSelectedDay(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
              />
            </div>
          )}

          {periodType === 'week' && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="text-xs font-bold text-slate-500">Sélectionner une date dans la semaine :</label>
              <input 
                type="date" 
                value={selectedWeekDate}
                onChange={e => setSelectedWeekDate(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
              />
            </div>
          )}

          {periodType === 'month' && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-bold text-slate-500">Mois :</label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
              >
                {[
                  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
                ].map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>

              <label className="text-xs font-bold text-slate-500 ml-2">Année :</label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
              >
                {[2024, 2025, 2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {periodType === 'year' && (
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-500">Année :</label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
              >
                {[2024, 2025, 2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {periodType === 'custom' && (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-xs font-bold text-slate-500 shrink-0">Date début :</label>
                <input 
                  type="date" 
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 w-full"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-xs font-bold text-slate-500 shrink-0">Date fin :</label>
                <input 
                  type="date" 
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== FEATURE 1: CALCUL DE STOCK THÉORIQUE ==================== */}
      {mainTab === 'stock_theorique' && (
        <div className="space-y-6">
          {/* KPI Cards Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Achats */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Achats de Carburant
                </span>
                <Fuel className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {formatLiters(totalsGeneral.totalAchats)}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Entrées enregistrées ({filteredSupplies.length} livraisons)
                </p>
              </div>
            </div>

            {/* Sorties Compteurs */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" /> Sorties Compteurs Électroniques
                </span>
                <BarChart3 className="w-5 h-5 text-amber-500" />
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {formatLiters(totalsGeneral.totalSorties)}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Ventes au pistolet ({filteredShifts.length} relevés de shifts)
                </p>
              </div>
            </div>

            {/* Stock Théorique */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5" /> Stock Théorique Restant
                </span>
                <Layers className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="mt-3">
                <h3 className={`text-2xl font-black font-mono tracking-tight ${
                  totalsGeneral.stockTheoriqueTotal < 0 ? 'text-rose-600' : 'text-indigo-600'
                }`}>
                  {formatLiters(totalsGeneral.stockTheoriqueTotal)}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Formule : Total Achats - Total Sorties
                </p>
              </div>
            </div>
          </div>

          {/* Main Results Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Header / Subtabs */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 font-display flex items-center gap-2 text-base">
                  <Calculator className="w-5 h-5 text-indigo-600" /> 
                  Résultats du Calcul de Stock par Carburant
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Période d'analyse : <strong className="text-slate-700">{periodLabel}</strong>
                </p>
              </div>

              <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-white shrink-0 print:hidden">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'summary' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tableau de Synthèse
                </button>
                <button
                  onClick={() => setActiveTab('achats_detail')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'achats_detail' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Détail Achats ({filteredSupplies.length})
                </button>
                <button
                  onClick={() => setActiveTab('sorties_detail')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'sorties_detail' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Détail Shifts ({filteredShifts.length})
                </button>
              </div>
            </div>

            {/* Tab 1: Synthèse */}
            {activeTab === 'summary' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <th className="p-4">Carburant</th>
                      <th className="p-4 text-right">Total des Achats</th>
                      <th className="p-4 text-right">Total Sorties (Compteurs)</th>
                      <th className="p-4 text-right">Stock Théorique</th>
                      <th className="p-4 text-center">Période Analysée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calculationResults.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                          Aucun produit de carburant configuré.
                        </td>
                      </tr>
                    ) : (
                      calculationResults.map((item) => (
                        <tr key={item.product.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                            {item.product.name}
                          </td>

                          {/* Total Achats */}
                          <td className="p-4 text-right font-mono font-bold text-emerald-700">
                            {formatLiters(item.totalAchats)}
                          </td>

                          {/* Total Sorties Compteurs */}
                          <td className="p-4 text-right font-mono font-bold text-amber-700">
                            {formatLiters(item.totalSortiesElec)}
                          </td>

                          {/* Stock Théorique */}
                          <td className={`p-4 text-right font-mono font-black ${
                            item.stockTheorique < 0 ? 'text-rose-600' : 'text-indigo-600'
                          }`}>
                            {formatLiters(item.stockTheorique)}
                          </td>

                          {/* Période Analysée */}
                          <td className="p-4 text-center text-xs text-slate-500 font-medium">
                            {periodLabel}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                  {/* Ligne Totaux Généraux */}
                  <tfoot>
                    <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-black text-slate-900 text-sm">
                      <td className="p-4 text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        Totaux Généraux
                      </td>
                      <td className="p-4 text-right font-mono text-emerald-700 text-base">
                        {formatLiters(totalsGeneral.totalAchats)}
                      </td>
                      <td className="p-4 text-right font-mono text-amber-700 text-base">
                        {formatLiters(totalsGeneral.totalSorties)}
                      </td>
                      <td className={`p-4 text-right font-mono text-base ${
                        totalsGeneral.stockTheoriqueTotal < 0 ? 'text-rose-600' : 'text-indigo-600'
                      }`}>
                        {formatLiters(totalsGeneral.stockTheoriqueTotal)}
                      </td>
                      <td className="p-4 text-center text-xs text-slate-600 font-bold">
                        {periodLabel}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Tab 2: Detail Achats */}
            {activeTab === 'achats_detail' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <th className="p-3">Date</th>
                      <th className="p-3">Fournisseur / N° BL</th>
                      <th className="p-3">Carburant</th>
                      <th className="p-3">Citerne</th>
                      <th className="p-3 text-right">Quantité Reçue</th>
                      <th className="p-3 text-right">Prix Achat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSupplies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                          Aucun achat enregistré durant cette période.
                        </td>
                      </tr>
                    ) : (
                      filteredSupplies.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-medium text-slate-700">
                            {formatDateFR(s.date)}
                          </td>
                          <td className="p-3 text-slate-900 font-bold">
                            {s.supplier} {s.invoiceNumber ? `(BL: ${s.invoiceNumber})` : ''}
                          </td>
                          <td className="p-3 font-semibold text-slate-800">
                            {s.productName || 'Carburant'}
                          </td>
                          <td className="p-3 text-slate-600">
                            {s.tankNumber || '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">
                            {formatLiters(s.qtyDelivered)}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-600">
                            {s.purchasePrice ? `${s.purchasePrice.toFixed(2)} DH` : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 3: Detail Sorties Compteurs */}
            {activeTab === 'sorties_detail' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <th className="p-3">Date</th>
                      <th className="p-3">Pompiste / Shift</th>
                      <th className="p-3">Pistolet / PISTE</th>
                      <th className="p-3 text-right">Index Début</th>
                      <th className="p-3 text-right">Index Fin</th>
                      <th className="p-3 text-right">Sortie Électronique</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredShifts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                          Aucun relevé de shift trouvé pour cette période.
                        </td>
                      </tr>
                    ) : (
                      filteredShifts.flatMap(shift => {
                        if (!shift.startCounters || !shift.endCounters) return [];
                        return Object.keys(shift.startCounters).map(nozId => {
                          const start = shift.startCounters[nozId];
                          const end = shift.endCounters![nozId];
                          if (!start || !end) return null;

                          const startElec = Number(start.elec) || 0;
                          const endElec = Number(end.elec) || 0;
                          const qty = Math.max(0, endElec - startElec);
                          const nozzle = nozzles.find(n => n.id === nozId);

                          return (
                            <tr key={`${shift.id}_${nozId}`} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-medium text-slate-700">
                                {formatDateFR(shift.date)}
                              </td>
                              <td className="p-3 font-bold text-slate-900">
                                {shift.attendantName} <span className="text-xs font-normal text-slate-500">({shift.shiftName})</span>
                              </td>
                              <td className="p-3 text-slate-800 font-semibold">
                                {nozzle ? `${nozzle.name} (${nozzle.productName || 'Carburant'})` : nozId}
                              </td>
                              <td className="p-3 text-right font-mono text-slate-600">
                                {startElec.toFixed(2)}
                              </td>
                              <td className="p-3 text-right font-mono text-slate-600">
                                {endElec.toFixed(2)}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-amber-600">
                                {formatLiters(qty)}
                              </td>
                            </tr>
                          );
                        }).filter(Boolean);
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== FEATURE 3: SIMULATION DES ENTRÉES ET SORTIES ==================== */}
      {mainTab === 'simulation_entrees_sorties' && (
        <div className="space-y-6">
          {/* Informational Disclaimer Banner */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-amber-900 print:hidden">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Outil d'Analyse et de Simulation Temporaire
              </h4>
              <p className="text-xs mt-1 text-amber-800 font-medium leading-relaxed">
                Les valeurs saisies ci-dessous sont utilisées exclusivement pour ce calcul comparatif et ne modifient en aucun cas les enregistrements ou l'historique de la base de données.
              </p>
            </div>
          </div>

          {/* Step 1: Pump / Nozzle Selection Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Étape 1 : Sélection des Pompes ({simNozzleIds.length} / {nozzles.length} sélectionnées)
                </h3>
              </div>

              <button
                onClick={handleToggleSimSelectAllNozzles}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {simNozzleIds.length === nozzles.length ? (
                  <>
                    <Square className="w-3.5 h-3.5" /> Tout Désélectionner
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" /> Tout Sélectionner
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {nozzles.map(nozzle => {
                const isSelected = simNozzleIds.includes(nozzle.id);
                return (
                  <label
                    key={nozzle.id}
                    onClick={() => handleToggleSimNozzle(nozzle.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <div>
                        <span className="block font-bold text-slate-900">
                          {nozzle.name} <span className="text-slate-500 font-normal">(Pompe {nozzle.pumpNumber || '1'})</span>
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          {nozzle.productName || 'Carburant'}
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 8 KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* KPI 1: Total Entrées */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total des Entrées</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-emerald-700 font-mono mt-2 tracking-tight">
                {formatLiters(totalsSimulation.totalEntrees)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Saisie manuelle</p>
            </div>

            {/* KPI 2: Total Sorties */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total des Sorties</span>
                <TrendingDown className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-xl font-black text-amber-700 font-mono mt-2 tracking-tight">
                {formatLiters(totalsSimulation.totalSorties)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Saisie manuelle</p>
            </div>

            {/* KPI 3: Quantité Consommée */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Quantité Consommée</span>
                <Scale className="w-4 h-4 text-indigo-500" />
              </div>
              <h3 className="text-xl font-black text-indigo-700 font-mono mt-2 tracking-tight">
                {formatLiters(totalsSimulation.quantiteConsommeeTotal)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Sorties - Entrées</p>
            </div>

            {/* KPI 4: Total Ventes Réelles */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Ventes Réelles</span>
                <BarChart3 className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="text-xl font-black text-blue-700 font-mono mt-2 tracking-tight">
                {formatLiters(totalsSimulation.totalVentesReelles)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Relevés compteurs période</p>
            </div>

            {/* KPI 5: Écart en Litres */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Écart en Litres</span>
                <RefreshCw className="w-4 h-4 text-purple-500" />
              </div>
              <h3 className={`text-xl font-black font-mono mt-2 tracking-tight ${
                Math.abs(totalsSimulation.ecartLitresTotal) < 0.01 
                  ? 'text-slate-700' 
                  : totalsSimulation.ecartLitresTotal > 0 
                  ? 'text-rose-600' 
                  : 'text-emerald-600'
              }`}>
                {totalsSimulation.ecartLitresTotal > 0 ? '+' : ''}{formatLiters(totalsSimulation.ecartLitresTotal)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Consommé - Ventes Réelles</p>
            </div>

            {/* KPI 6: Coût Total */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Coût Total</span>
                <Tag className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-xl font-black text-amber-800 font-mono mt-2 tracking-tight">
                {formatDH(totalsSimulation.coutTotalSimule)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Consommé × Prix Achat</p>
            </div>

            {/* KPI 7: Chiffre d'Affaires */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Chiffre d'Affaires</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-emerald-800 font-mono mt-2 tracking-tight">
                {formatDH(totalsSimulation.chiffreAffairesReel)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Ventes Réelles × Prix Vente</p>
            </div>

            {/* KPI 8: Écart Financier */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Écart Financier</span>
                <Calculator className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className={`text-xl font-black font-mono mt-2 tracking-tight ${
                totalsSimulation.ecartFinancierTotal >= 0 ? 'text-indigo-600' : 'text-rose-600'
              }`}>
                {totalsSimulation.ecartFinancierTotal >= 0 ? '+' : ''}{formatDH(totalsSimulation.ecartFinancierTotal)}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Chiffre d'Affaires - Coût Total</p>
            </div>
          </div>

          {/* Step 2: Input & Comparison Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 font-display flex items-center gap-2 text-base">
                  <RefreshCw className="w-5 h-5 text-indigo-600" /> 
                  Étape 2 : Tableau de Saisie Manuelle et Comparaison Comparative
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Saisissez les entrées/sorties et prix d'achat pour visualiser les écarts avec les enregistrements réels.
                </p>
              </div>

              <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                {periodLabel}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="p-3">Pompe / Pistolet</th>
                    <th className="p-3 text-center">Entrée (L)</th>
                    <th className="p-3 text-center">Sortie (L)</th>
                    <th className="p-3 text-right">Consommé (L)</th>
                    <th className="p-3 text-right">Ventes Réelles</th>
                    <th className="p-3 text-right">Écart (L)</th>
                    <th className="p-3 text-center">Prix Achat/L</th>
                    <th className="p-3 text-right">Coût Total</th>
                    <th className="p-3 text-right">CA Réel</th>
                    <th className="p-3 text-right">Écart Financier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedSimulationResults.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 font-medium">
                        Aucune pompe sélectionnée pour la simulation. Veuillez en sélectionner au moins une ci-dessus.
                      </td>
                    </tr>
                  ) : (
                    selectedSimulationResults.map((item) => (
                      <tr key={item.nozzle.id} className="hover:bg-slate-50 transition-colors">
                        {/* Name & Product */}
                        <td className="p-3 font-bold text-slate-900">
                          <div className="flex flex-col">
                            <span>{item.nozzle.name} <span className="text-xs text-slate-500 font-normal">(Pompe {item.pumpNumber})</span></span>
                            <span className="text-xs font-medium text-slate-500">{item.productName}</span>
                          </div>
                        </td>

                        {/* Entrée Manual Input */}
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.entries || ''}
                            onChange={e => handleSimInputChange(item.nozzle.id, 'entries', Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder="0"
                            className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center text-emerald-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </td>

                        {/* Sortie Manual Input */}
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.exits || ''}
                            onChange={e => handleSimInputChange(item.nozzle.id, 'exits', Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder="0"
                            className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center text-amber-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </td>

                        {/* Quantité consommée */}
                        <td className="p-3 text-right font-mono font-bold text-indigo-700">
                          {formatLiters(item.quantiteConsommee)}
                        </td>

                        {/* Ventes réelles */}
                        <td className="p-3 text-right font-mono font-bold text-blue-700">
                          {formatLiters(item.ventesReelles)}
                        </td>

                        {/* Écart en Litres */}
                        <td className="p-3 text-right font-mono text-xs font-bold">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${
                            Math.abs(item.ecartLitres) < 0.01 
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : item.ecartLitres > 0 
                              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.ecartLitres > 0 ? '+' : ''}{formatLiters(item.ecartLitres)}
                          </span>
                        </td>

                        {/* Prix Achat / L Input */}
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.purchasePrice || ''}
                            onChange={e => handleSimInputChange(item.nozzle.id, 'purchasePrice', Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder="1.00"
                            className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </td>

                        {/* Coût Total */}
                        <td className="p-3 text-right font-mono font-bold text-amber-800">
                          {formatDH(item.costTotal)}
                        </td>

                        {/* CA Réel */}
                        <td className="p-3 text-right font-mono font-bold text-emerald-800">
                          {formatDH(item.caReel)}
                        </td>

                        {/* Écart Financier */}
                        <td className={`p-3 text-right font-mono font-black ${
                          item.ecartFinancier >= 0 ? 'text-indigo-600' : 'text-rose-600'
                        }`}>
                          {item.ecartFinancier >= 0 ? '+' : ''}{formatDH(item.ecartFinancier)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Totaux Généraux */}
                <tfoot>
                  <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-black text-slate-900 text-sm">
                    <td className="p-3 text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      Totaux ({totalsSimulation.countPumps} pompes)
                    </td>
                    <td className="p-3 text-center font-mono text-emerald-700">
                      {formatLiters(totalsSimulation.totalEntrees)}
                    </td>
                    <td className="p-3 text-center font-mono text-amber-700">
                      {formatLiters(totalsSimulation.totalSorties)}
                    </td>
                    <td className="p-3 text-right font-mono text-indigo-700">
                      {formatLiters(totalsSimulation.quantiteConsommeeTotal)}
                    </td>
                    <td className="p-3 text-right font-mono text-blue-700">
                      {formatLiters(totalsSimulation.totalVentesReelles)}
                    </td>
                    <td className={`p-3 text-right font-mono text-xs ${
                      totalsSimulation.ecartLitresTotal > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {totalsSimulation.ecartLitresTotal > 0 ? '+' : ''}{formatLiters(totalsSimulation.ecartLitresTotal)}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-400 text-xs">
                      -
                    </td>
                    <td className="p-3 text-right font-mono text-amber-800">
                      {formatDH(totalsSimulation.coutTotalSimule)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-800">
                      {formatDH(totalsSimulation.chiffreAffairesReel)}
                    </td>
                    <td className={`p-3 text-right font-mono ${
                      totalsSimulation.ecartFinancierTotal >= 0 ? 'text-indigo-600' : 'text-rose-600'
                    }`}>
                      {totalsSimulation.ecartFinancierTotal >= 0 ? '+' : ''}{formatDH(totalsSimulation.ecartFinancierTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 5: Save Simulation to Database */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-indigo-700 space-y-4 print:hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-700/60 pb-3">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-display">
                    Enregistrer cette Simulation dans la Base de Données
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Sauvegardez vos saisies d'entrées/sorties et vos marges pour les consulter ou recharger à tout moment.
                  </p>
                </div>
              </div>

              {saveSuccessMsg && (
                <div className="px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {saveSuccessMsg}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full relative">
                <input
                  type="text"
                  value={simTitle}
                  onChange={e => setSimTitle(e.target.value)}
                  placeholder={`Nom de la simulation (ex: Simulation ${periodLabel} du ${formatDateFR(getTodayStr())})`}
                  className="w-full px-4 py-2.5 bg-white/10 border border-indigo-400/40 rounded-xl text-xs text-white placeholder-indigo-300/60 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all font-medium"
                />
              </div>

              <button
                onClick={handleSaveSimulationToDatabase}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Save className="w-4 h-4" />
                Enregistrer dans la Base de Données
              </button>
            </div>
          </div>

          {/* Section 6: Historical Saved Simulations from Database */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-900 font-display text-base">
                    Historique des Simulations Enregistrées dans la Base de Données
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Consultez, rechargez ou supprimez vos simulations sauvegardées ({(store.simulationRecords || []).length} enregistrements)
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="p-3.5">Titre de la Simulation</th>
                    <th className="p-3.5">Période</th>
                    <th className="p-3.5">Date Sauvegarde</th>
                    <th className="p-3.5 text-right">Vol. Consommé</th>
                    <th className="p-3.5 text-right">CA Réel</th>
                    <th className="p-3.5 text-right">Écart Financier</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!store.simulationRecords || store.simulationRecords.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        Aucune simulation enregistrée pour le moment dans la base de données.
                      </td>
                    </tr>
                  ) : (
                    store.simulationRecords.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">
                          {rec.title}
                          <span className="text-xs font-normal text-slate-400 block mt-0.5">
                            Créé par {rec.author || 'ADMIN'}
                          </span>
                        </td>
                        <td className="p-3.5 text-xs text-slate-600 font-medium">
                          {rec.periodLabel}
                        </td>
                        <td className="p-3.5 text-xs font-mono text-slate-500">
                          {rec.date ? new Date(rec.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-indigo-700">
                          {formatLiters(rec.totals?.quantiteConsommeeTotal || 0)}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                          {formatDH(rec.totals?.chiffreAffairesReel || 0)}
                        </td>
                        <td className={`p-3.5 text-right font-mono font-black ${
                          (rec.totals?.ecartFinancierTotal || 0) >= 0 ? 'text-indigo-600' : 'text-rose-600'
                        }`}>
                          {(rec.totals?.ecartFinancierTotal || 0) >= 0 ? '+' : ''}{formatDH(rec.totals?.ecartFinancierTotal || 0)}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleLoadSimulation(rec)}
                              title="Charger dans le simulateur"
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <FolderOpen className="w-3.5 h-3.5" /> Charger
                            </button>
                            <button
                              onClick={() => handleDeleteSimulation(rec.id)}
                              title="Supprimer la simulation"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
