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
  const [mainTab, setMainTab] = useState<MainTab>('simulation_entrees_sorties');

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
  const [selectedSimPumpKeys, setSelectedSimPumpKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('station_erp_sim_pump_keys');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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
      localStorage.setItem('station_erp_sim_pump_keys', JSON.stringify(selectedSimPumpKeys));
    } catch (e) {}
  }, [selectedSimPumpKeys]);

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

  // Helper to normalize any date string format (YYYY-MM-DD, DD/MM/YYYY, DD/MM/YY, ISO string) to YYYY-MM-DD
  const parseToYMD = (dateStr?: string): string => {
    if (!dateStr) return '';
    const clean = dateStr.trim().split('T')[0];
    if (!clean) return '';
    if (clean.includes('/')) {
      const parts = clean.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else {
          let [d, m, y] = parts;
          if (y.length === 2) y = '20' + y;
          return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      }
    }
    if (clean.includes('-')) {
      const parts = clean.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else {
          let [d, m, y] = parts;
          if (y.length === 2) y = '20' + y;
          return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      }
    }
    return clean;
  };

  // Helper matchers for Stock Théorique
  const isSupplyForProduct = (supply: Supply, product: Product): boolean => {
    if (supply.productId && supply.productId === product.id) return true;
    const sProdName = (supply.productName || '').trim().toLowerCase();
    const pName = (product.name || '').trim().toLowerCase();
    const pType = (product.type || '').trim().toLowerCase();
    if (sProdName && (sProdName === pName || sProdName.includes(pName) || pName.includes(sProdName) || sProdName.includes(pType))) return true;
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
    const normStart = parseToYMD(startDate);
    const normEnd = parseToYMD(endDate);
    return supplies.filter(supply => {
      const sDate = parseToYMD(supply.date);
      if (!sDate) return false;
      return sDate >= normStart && sDate <= normEnd;
    });
  }, [supplies, startDate, endDate]);

  // Filter shifts with counters within period
  const filteredShifts = useMemo(() => {
    const normStart = parseToYMD(startDate);
    const normEnd = parseToYMD(endDate);
    return shifts.filter(shift => {
      const shiftDate = parseToYMD(shift.date);
      const isInPeriod = shiftDate >= normStart && shiftDate <= normEnd;
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
  // Group nozzles by pump for Pompe selection and pump-level simulation
  const groupedPumps = useMemo(() => {
    if (pumps && pumps.length > 0) {
      return pumps.map(p => {
        const pNozzles = nozzles.filter(n => {
          if (n.pumpId && p.id && n.pumpId === p.id) return true;
          if (n.pumpNumber && p.number) {
            const pNumNorm = p.number.trim().toLowerCase().replace(/^pompe\s*/, '');
            const nNumNorm = n.pumpNumber.trim().toLowerCase().replace(/^pompe\s*/, '');
            if (pNumNorm === nNumNorm && pNumNorm !== '') return true;
          }
          if (n.pumpNumber && p.id && n.pumpNumber.trim() === p.id.trim()) return true;
          return false;
        });

        const pNum = p.number || p.id;
        const name = pNum.trim().toLowerCase().startsWith('pompe')
          ? pNum.trim()
          : `Pompe ${pNum.trim()}`;

        return {
          key: p.id,
          pumpNumber: p.number || p.id,
          name: name,
          nozzleIds: pNozzles.map(n => n.id),
          nozzles: pNozzles
        };
      });
    }

    // Fallback if no pumps are configured in store
    const map = new Map<string, { key: string; pumpNumber: string; name: string; nozzleIds: string[]; nozzles: typeof nozzles }>();
    nozzles.forEach(nozzle => {
      const pKey = String(nozzle.pumpId || nozzle.pumpNumber || '1');
      if (!map.has(pKey)) {
        map.set(pKey, {
          key: pKey,
          pumpNumber: nozzle.pumpNumber || pKey,
          name: nozzle.pumpNumber ? (nozzle.pumpNumber.trim().toLowerCase().startsWith('pompe') ? nozzle.pumpNumber.trim() : `Pompe ${nozzle.pumpNumber.trim()}`) : `Pompe ${pKey}`,
          nozzleIds: [],
          nozzles: []
        });
      }
      const item = map.get(pKey)!;
      item.nozzleIds.push(nozzle.id);
      item.nozzles.push(nozzle);
    });

    return Array.from(map.values());
  }, [pumps, nozzles]);

  // Auto-select all pumps on load if selectedSimPumpKeys is empty
  useEffect(() => {
    if (groupedPumps.length > 0) {
      setSelectedSimPumpKeys(prev => {
        if (prev.length === 0) return groupedPumps.map(p => p.key);
        const validKeys = prev.filter(k => groupedPumps.some(gp => gp.key === k));
        return validKeys.length > 0 ? validKeys : groupedPumps.map(p => p.key);
      });
    }
  }, [groupedPumps]);

  // Compute Pump-Level Simulation Results (distributing delivery quantities equally among selected matching pumps)
  const pumpSimulationResults = useMemo(() => {
    // Helper for safe string trimming
    const strTrimLower = (val: any) => typeof val === 'string' ? val.trim().toLowerCase() : '';

    // Extract tank digit helper: e.g. "CITERNE N:5 20T G" -> "5" (ONLY matches strings with citerne/tank)
    const getTankDigit = (str?: string): string | null => {
      if (!str) return null;
      const match = str.match(/(?:citerne|tank)\s*(?:n[°:#]?)?\s*(\d+)/i);
      return match ? match[1] : null;
    };

    // 1. Prepare base metadata & simulation inputs per pump
    const pumpMetaList = groupedPumps.map(pump => {
      const pNozzles = pump.nozzles;
      const primaryNozzle = pNozzles[0];

      let product = products.find(p => p.id === primaryNozzle?.productId) || 
                    products.find(p => p.name.trim().toLowerCase() === (primaryNozzle?.productName || '').trim().toLowerCase());

      if (!product) {
        const pNameLower = pump.name.toLowerCase();
        product = products.find(p => pNameLower.includes(p.name.toLowerCase()) || pNameLower.includes(p.type.toLowerCase()));
      }

      const productNamesList = Array.from(new Set(pNozzles.map(n => n.productName).filter(Boolean)));
      const productName = productNamesList.length > 0 ? productNamesList.join(', ') : (product?.name || 'Carburant');
      const defaultPrice = product?.purchasePrice && product.purchasePrice > 0 ? product.purchasePrice : 1.00;
      const salePrice = product?.salePrice || 0;

      // Find tank directly connected to this pump/nozzles
      const pumpTank = tanks.find(t => pNozzles.some(n => n.tankId === t.id)) ||
        tanks.find(t => pNozzles.some(n => {
          const nTankStr = (n as any).tankNumber;
          if (!nTankStr) return false;
          const nDigit = getTankDigit(nTankStr);
          const tDigit = getTankDigit(t.number) || getTankDigit(t.name) || getTankDigit(t.id);
          return nDigit && tDigit && nDigit === tDigit;
        })) ||
        tanks.find(t => t.connectedPumpIds && (t.connectedPumpIds.includes(pump.key) || t.connectedPumpIds.includes(pump.pumpNumber))) ||
        tanks.find(t => product && t.productId === product.id);

      const tankName = pumpTank ? (pumpTank.name || `Citerne N°${pumpTank.number}`) : '';
      const pTankDigit = getTankDigit(pumpTank?.number) || getTankDigit(pumpTank?.name) || getTankDigit(pumpTank?.id) || getTankDigit(pNozzles[0]?.tankNumber);

      // Inputs for this pump (keyed by pump.key or fallback)
      const pumpInput = simInputs[pump.key];
      let entries = 0;
      let exits = 0;
      let purchasePrice = defaultPrice;

      if (pumpInput) {
        entries = Number(pumpInput.entries) || 0;
        exits = Number(pumpInput.exits) || 0;
        purchasePrice = pumpInput.purchasePrice !== undefined ? Number(pumpInput.purchasePrice) || 0 : defaultPrice;
      } else {
        entries = pump.nozzleIds.reduce((acc, id) => acc + (Number(simInputs[id]?.entries) || 0), 0);
        exits = pump.nozzleIds.reduce((acc, id) => acc + (Number(simInputs[id]?.exits) || 0), 0);
        const pNozzlePrice = simInputs[pump.nozzleIds[0]]?.purchasePrice;
        purchasePrice = pNozzlePrice !== undefined ? Number(pNozzlePrice) || 0 : defaultPrice;
      }

      // Quantité consommée = Sortie - Entrée
      const quantiteConsommee = exits - entries;

      // Coût total = Quantité consommée * Prix d'achat
      const costTotal = quantiteConsommee * purchasePrice;

      return {
        pumpKey: pump.key,
        pumpNumber: pump.pumpNumber,
        pumpName: pump.name,
        pNozzles,
        pump,
        product,
        productName,
        pumpTank,
        tankName,
        pTankDigit,
        entries,
        exits,
        quantiteConsommee,
        purchasePrice,
        costTotal,
        salePrice,
        achatsReels: 0,
        achatsReelsMontant: 0,
      };
    });

    // 2. Distribute delivery quantities & costs equally among matching SELECTED pumps
    filteredSupplies.forEach(s => {
      const sTankDigit = getTankDigit(s.tankNumber) || getTankDigit(s.tankId);
      const sTankId = s.tankId;
      const sTankStr = strTrimLower(s.tankNumber || '');

      const matchingSelectedPumps = pumpMetaList.filter(pMeta => {
        if (!selectedSimPumpKeys.includes(pMeta.pumpKey)) return false;

        let isMatch = false;

        // 1. Direct ID match
        if (sTankId) {
          if (pMeta.pumpTank && pMeta.pumpTank.id === sTankId) isMatch = true;
          else if (pMeta.pNozzles.some(n => n.tankId === sTankId)) isMatch = true;
        }

        // 2. Direct Tank Digit match (e.g. Supply "CITERNE N:7" vs Pump's Tank "CITERNE N:7")
        if (!isMatch && sTankDigit) {
          if (pMeta.pTankDigit && pMeta.pTankDigit === sTankDigit) {
            isMatch = true;
          }
        }

        // 3. String name containment match
        if (!isMatch && sTankStr && pMeta.pumpTank) {
          const tName = strTrimLower(pMeta.pumpTank.name);
          const tNum = strTrimLower(pMeta.pumpTank.number);
          if ((tName && sTankStr.includes(tName)) || (tNum && sTankStr.includes(tNum))) {
            isMatch = true;
          }
        }

        // 4. Fallback ONLY if supply has NO tank specified at all
        if (!isMatch && !sTankDigit && !sTankId && !sTankStr && pMeta.product) {
          const sProdName = strTrimLower(s.productName || '');
          const pProdName = strTrimLower(pMeta.productName || '');
          const pName = strTrimLower(pMeta.product.name || '');
          const pType = strTrimLower(pMeta.product.type || '');

          if (s.productId === pMeta.product.id || (sProdName && (sProdName === pProdName || sProdName === pName || sProdName === pType || sProdName.includes(pProdName) || pProdName.includes(sProdName)))) {
            isMatch = true;
          }
        }

        return isMatch;
      });

      if (matchingSelectedPumps.length > 0) {
        const qtyDelivered = Number(s.qtyDelivered) || 0;
        const splitQty = qtyDelivered / matchingSelectedPumps.length;

        matchingSelectedPumps.forEach(pMeta => {
          const pPrice = Number(s.purchasePrice) > 0 ? Number(s.purchasePrice) : pMeta.purchasePrice;
          const splitCost = splitQty * pPrice;
          pMeta.achatsReels += splitQty;
          pMeta.achatsReelsMontant += splitCost;
        });
      }
    });

    // 3. Construct final result objects
    return pumpMetaList.map(item => {
      const caReel = item.achatsReels * item.salePrice;
      const ecartLitres = item.quantiteConsommee - item.achatsReels;
      const ecartFinancier = caReel - item.costTotal;

      return {
        pumpKey: item.pumpKey,
        pumpNumber: item.pumpNumber,
        pumpName: item.pumpName,
        nozzles: item.pNozzles,
        nozzleIds: item.pump.nozzleIds,
        product: item.product,
        productName: item.productName,
        tankName: item.tankName,
        tankId: item.pumpTank?.id,
        entries: item.entries,
        exits: item.exits,
        quantiteConsommee: item.quantiteConsommee,
        purchasePrice: item.purchasePrice,
        costTotal: item.costTotal,
        achatsReels: item.achatsReels,
        achatsReelsMontant: item.achatsReelsMontant > 0 ? item.achatsReelsMontant : (item.achatsReels * item.purchasePrice),
        ventesReelles: item.achatsReels,
        salePrice: item.salePrice,
        caReel,
        ecartLitres,
        ecartFinancier
      };
    });
  }, [groupedPumps, products, tanks, filteredSupplies, simInputs, selectedSimPumpKeys]);

  const selectedSimulationResults = useMemo(() => {
    return pumpSimulationResults.filter(item => selectedSimPumpKeys.includes(item.pumpKey));
  }, [pumpSimulationResults, selectedSimPumpKeys]);

  const totalsSimulation = useMemo(() => {
    const totalEntrees = selectedSimulationResults.reduce((acc, r) => acc + r.entries, 0);
    const totalSorties = selectedSimulationResults.reduce((acc, r) => acc + r.exits, 0);
    const quantiteConsommeeTotal = selectedSimulationResults.reduce((acc, r) => acc + r.quantiteConsommee, 0);
    
    const totalAchatsReels = selectedSimulationResults.reduce((acc, r) => acc + r.achatsReels, 0);
    const totalAchatsReelsMontant = selectedSimulationResults.reduce((acc, r) => acc + (r.achatsReelsMontant || 0), 0);

    const ecartLitresTotal = quantiteConsommeeTotal - totalAchatsReels;
    const coutTotalSimule = selectedSimulationResults.reduce((acc, r) => acc + r.costTotal, 0);
    const chiffreAffairesReel = selectedSimulationResults.reduce((acc, r) => acc + r.caReel, 0);
    const ecartFinancierTotal = chiffreAffairesReel - coutTotalSimule;

    return {
      totalEntrees,
      totalSorties,
      quantiteConsommeeTotal,
      totalAchatsReels,
      totalAchatsReelsMontant,
      totalVentesReelles: totalAchatsReels,
      ecartLitresTotal,
      coutTotalSimule,
      chiffreAffairesReel,
      ecartFinancierTotal,
      countPumps: selectedSimulationResults.length
    };
  }, [selectedSimulationResults]);

  const handleSimInputChange = (pumpKey: string, field: 'entries' | 'exits' | 'purchasePrice', value: number) => {
    setSimInputs(prev => ({
      ...prev,
      [pumpKey]: {
        ...(prev[pumpKey] || { entries: 0, exits: 0, purchasePrice: 1.0 }),
        [field]: value
      }
    }));
  };

  const handleToggleSimPump = (key: string) => {
    setSelectedSimPumpKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleToggleSimSelectAllPumps = () => {
    if (selectedSimPumpKeys.length === groupedPumps.length) {
      setSelectedSimPumpKeys([]);
    } else {
      setSelectedSimPumpKeys(groupedPumps.map(p => p.key));
    }
  };

  const handleToggleSimSelectAllNozzles = handleToggleSimSelectAllPumps;
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

      {/* Selector of Analysis Period */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Période d'analyse
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

      {/* Simulation des Entrées et Sorties */}
      <div className="space-y-6">
          {/* Step 1: Pump Selection Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Étape 1 : Sélection des Pompes ({selectedSimPumpKeys.length} / {groupedPumps.length} pompes sélectionnées)
                </h3>
              </div>

              <button
                onClick={handleToggleSimSelectAllPumps}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {selectedSimPumpKeys.length === groupedPumps.length ? (
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {groupedPumps.map(pump => {
                const isSelected = selectedSimPumpKeys.includes(pump.key);
                const productsList = Array.from(new Set(pump.nozzles.map(n => n.productName || 'Carburant'))).join(', ');

                return (
                  <div
                    key={pump.key}
                    onClick={() => handleToggleSimPump(pump.key)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border transition-all ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <div>
                        <span className="block font-black text-sm text-slate-900">
                          {pump.name}
                        </span>
                        <span className="block text-[11px] text-slate-500 mt-0.5 font-medium">
                          {pump.nozzles.length} pistolet(s) {productsList ? `• ${productsList}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                  Saisissez les entrées/sorties et prix d'achat pour visualiser les écarts avec les livraisons d'achats réels de la citerne.
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
                    <th className="py-2.5 px-3">Pompe</th>
                    <th className="py-2.5 px-2 text-center w-28">Prix Achat/L</th>
                    <th className="py-2.5 px-2 text-center w-36">Entrée (L)</th>
                    <th className="py-2.5 px-2 text-center w-36">Sortie (L)</th>
                    <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Consommé (L)</th>
                    <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Coût Total</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Achat Réel (L / DH)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedSimulationResults.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        Aucune pompe sélectionnée pour la simulation. Veuillez en sélectionner au moins une ci-dessus.
                      </td>
                    </tr>
                  ) : (
                    selectedSimulationResults.map((item) => (
                      <tr key={item.pumpKey} className="hover:bg-slate-50 transition-colors">
                        {/* Pompe & Product / Tank */}
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm">{item.pumpName}</span>
                            <span className="text-xs font-medium text-slate-500">
                              {item.productName} {item.tankName ? <span className="text-indigo-600 font-semibold">• {item.tankName}</span> : ''}
                            </span>
                          </div>
                        </td>

                        {/* Prix Achat / L Input */}
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.purchasePrice || ''}
                            onChange={e => handleSimInputChange(item.pumpKey, 'purchasePrice', Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder="1.00"
                            className="w-24 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </td>

                        {/* Entrée Manual Input */}
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.entries || ''}
                            onChange={e => handleSimInputChange(item.pumpKey, 'entries', Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder="0,00"
                            className="w-32 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center text-emerald-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </td>

                        {/* Sortie Manual Input */}
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.exits || ''}
                            onChange={e => handleSimInputChange(item.pumpKey, 'exits', Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder="0,00"
                            className="w-32 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center text-amber-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </td>

                        {/* Quantité consommée */}
                        <td className="py-2.5 px-2.5 text-right font-mono font-bold text-indigo-700 whitespace-nowrap">
                          {formatLiters(item.quantiteConsommee)}
                        </td>

                        {/* Coût Total */}
                        <td className="py-2.5 px-2.5 text-right font-mono font-bold text-amber-800 whitespace-nowrap">
                          {formatDH(item.costTotal)}
                        </td>

                        {/* Achat Réel */}
                        <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                          <span className="font-bold text-blue-700 block text-sm">
                            {formatLiters(item.achatsReels)}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600 block mt-0.5">
                            {formatDH(item.achatsReelsMontant)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Totaux Généraux */}
                <tfoot>
                  <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-black text-slate-900 text-sm">
                    <td className="py-2.5 px-3 text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      Totaux ({totalsSimulation.countPumps} pompes)
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-400 text-xs">
                      -
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-emerald-700">
                      {formatLiters(totalsSimulation.totalEntrees)}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-amber-700">
                      {formatLiters(totalsSimulation.totalSorties)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-indigo-700 whitespace-nowrap">
                      {formatLiters(totalsSimulation.quantiteConsommeeTotal)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-amber-800 whitespace-nowrap">
                      {formatDH(totalsSimulation.coutTotalSimule)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                      <span className="font-black text-blue-700 block text-sm">
                        {formatLiters(totalsSimulation.totalAchatsReels)}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700 block mt-0.5">
                        {formatDH(totalsSimulation.totalAchatsReelsMontant)}
                      </span>
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
    </div>
  );
}
