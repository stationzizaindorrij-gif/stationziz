import React, { useState, useMemo } from 'react';
import { 
  Calculator, Calendar, Fuel, TrendingDown, TrendingUp, 
  Printer, Download, Info, ArrowUpRight, ArrowDownRight, 
  FileText, BarChart3, Filter, RefreshCw, CheckCircle2, Layers
} from 'lucide-react';
import { ERPStoreType } from '../store';
import { Product, Supply, Tank, Nozzle } from '../types';

interface StockCalcProps {
  store: ERPStoreType;
}

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

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

export default function StockCalc({ store }: StockCalcProps) {
  const { products, supplies = [], shifts = [], tanks = [], nozzles = [], config } = store;

  // Selected period state
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [selectedDay, setSelectedDay] = useState<string>(getTodayStr());
  const [selectedWeekDate, setSelectedWeekDate] = useState<string>(getTodayStr());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customStartDate, setCustomStartDate] = useState<string>(getTodayStr());
  const [customEndDate, setCustomEndDate] = useState<string>(getTodayStr());

  // Active view tab inside module
  const [activeTab, setActiveTab] = useState<'summary' | 'achats_detail' | 'sorties_detail'>('summary');

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

  // Helper matchers
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

  // 1. Filter supplies within period
  const filteredSupplies = useMemo(() => {
    return supplies.filter(supply => {
      const dateStr = (supply.date || '').split('T')[0];
      return dateStr >= startDate && dateStr <= endDate;
    });
  }, [supplies, startDate, endDate]);

  // 2. Filter shifts with counters within period
  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      const shiftDate = (shift.date || '').split('T')[0];
      const isInPeriod = shiftDate >= startDate && shiftDate <= endDate;
      const hasCounters = shift.startCounters && shift.endCounters;
      return isInPeriod && hasCounters;
    });
  }, [shifts, startDate, endDate]);

  // 3. Compute totals per fuel product
  const calculationResults = useMemo(() => {
    return products.map(product => {
      // Total Purchases (Achats de carburant)
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

  // Totaux Généraux
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

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12" id="calcul-stock-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
                Calcul de Stock
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Calcul automatique du stock théorique (Achats de carburant - Sorties des compteurs électroniques).
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Selector of Analysis Period */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Période d'analyse du stock
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
  );
}
