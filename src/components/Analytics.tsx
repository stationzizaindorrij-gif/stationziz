
import React, { useState, useMemo } from 'react';
import { ERPStoreType } from '../store';
import { 
  TrendingUp, BarChart2, Zap, Archive, Banknote, FileText, 
  User, Activity, Fuel, Wallet, Gauge, ArrowRight
, Calendar, MinusCircle, List, ArrowDownRight, TrendingDown } from 'lucide-react';
import { parseISO } from 'date-fns';

interface AnalyticsProps {
  store: ERPStoreType;
}

export default function Analytics({ store }: AnalyticsProps) {
  // Report state
  const [selectedShiftId, setSelectedShiftId] = useState<string>('all');
    const [reportAttendant, setReportAttendant] = useState<string>('all');
  const [expandedPumpProduct, setExpandedPumpProduct] = useState<string | null>(null);

  const availableShifts = useMemo(() => {
    const shifts = store.shifts.filter(s => s.status === 'completed' || s.status === 'ready_to_close');
    return shifts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [store.shifts]);


  const getHistoricalPrice = React.useCallback((productId: string, date: string) => {
    // Sort price changes descending
    const sortedChanges = [...(store.priceChanges || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const changesBeforeDate = sortedChanges.filter(c => c.productId === productId && c.date.split('T')[0] <= date.split('T')[0]);
    
    if (changesBeforeDate.length > 0) {
      return {
        purchasePrice: changesBeforeDate[0].purchasePrice,
        salePrice: changesBeforeDate[0].salePrice
      };
    }
    
    // Fallback if no history exists BEFORE this date
    // Look for the OLDEST price change for this product to get the original prices
    const allChangesForProduct = sortedChanges.filter(c => c.productId === productId);
    if (allChangesForProduct.length > 0) {
      // The last element in the descending sorted array is the oldest change
      const oldestChange = allChangesForProduct[allChangesForProduct.length - 1];
      if (oldestChange.oldPurchasePrice !== undefined && oldestChange.oldSalePrice !== undefined) {
        return {
          purchasePrice: oldestChange.oldPurchasePrice,
          salePrice: oldestChange.oldSalePrice
        };
      }
    }
    
    const currentProd = store.products.find(p => p.id === productId);
    return {
      purchasePrice: currentProd?.purchasePrice || 0,
      salePrice: currentProd?.salePrice || 0
    };
  }, [store.priceChanges, store.products]);

  // --- REPORT CALCULATIONS ---
  const selectedEndDateObj = useMemo(() => {
    let selectedEndDate = (new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
    if (selectedShiftId !== 'all') {
      const selectedShift = store.shifts.find(s => s.id === selectedShiftId);
      if (selectedShift) {
        selectedEndDate = selectedShift.endDate || selectedShift.date;
      }
    }
    return selectedEndDate;
  }, [store.shifts, selectedShiftId]);

  const reportData = useMemo(() => {
    let shifts = store.shifts.filter(s => s.status === 'completed' || s.status === 'ready_to_close');
    
    let selectedEndDate = selectedEndDateObj;
    
    // Filter by selected shift
    if (selectedShiftId !== 'all') {
      shifts = shifts.filter(s => s.id === selectedShiftId);
    }
    
    // Filter by attendant
    if (reportAttendant !== 'all') {
      shifts = shifts.filter(s => s.attendantId === reportAttendant);
    }

    let totalEspece = 0;
    let totalBons = 0;
    let totalExpenses = 0;
    const expensesList: Array<any> = [];
    const profitByDate: Record<string, { mechMargin: number, elecMargin: number, expenses: number }> = {};

    const mechStats: Record<string, { liters: number, purchase: number, sale: number }> = {};
    const elecStats: Record<string, { liters: number, purchase: number, sale: number }> = {};
    store.products.forEach(p => {
      mechStats[p.id] = { liters: 0, purchase: 0, sale: 0 };
      elecStats[p.id] = { liters: 0, purchase: 0, sale: 0 };
    });
    


    shifts.forEach(shift => {
      totalEspece += (shift.realCashReceived || 0);
      
      const dateKey = shift.date;
      if (!profitByDate[dateKey]) profitByDate[dateKey] = { mechMargin: 0, elecMargin: 0, expenses: 0 };
      
      if (shift.expenses) {
        shift.expenses.forEach(e => {
          totalExpenses += e.amount;
          profitByDate[dateKey].expenses += e.amount;
          expensesList.push({
            id: e.id || Math.random().toString(),
            date: shift.date,
            shiftName: shift.shiftName,
            type: e.type,
            description: e.description,
            amount: e.amount,
            method: e.method
          });
        });
      }
      
      const ncp = shift.nonCashPayments;
      if (ncp) {
        totalBons += (ncp.bonClient || []).reduce((sum, b) => sum + (parseFloat(b.amount as any) || 0), 0);
        totalBons += (ncp.carteSntl || []).reduce((sum, b) => sum + (parseFloat(b.amount as any) || 0), 0);
        totalBons += (ncp.bonCarburantsVivo || []).reduce((sum, b) => sum + (parseFloat(b.amount as any) || 0), 0);
        totalBons += (ncp.vignette || []).reduce((sum, b) => sum + (parseFloat(b.amount as any) || 0), 0);
        totalEspece += (ncp.espece || []).reduce((sum, b) => sum + (parseFloat(b.amount as any) || 0), 0);
      }

      if (shift.startCounters && shift.endCounters) {
        Object.keys(shift.startCounters).forEach(nozId => {
          const start = shift.startCounters[nozId];
          const end = shift.endCounters![nozId];
          if (start && end) {
            const qtyMech = Math.max(0, (parseFloat(end.mech as any) || 0) - (parseFloat(start.mech as any) || 0));
            const qtyElec = Math.max(0, (parseFloat(end.elec as any) || 0) - (parseFloat(start.elec as any) || 0));
            
            const nozzle = store.nozzles.find(n => n.id === nozId);
            if (nozzle) {
              const tank = store.tanks.find(t => t.id === nozzle.tankId);
              if (tank) {
                const product = store.products.find(p => p.id === tank.productId);
                if (product) {
                  const prices = getHistoricalPrice(product.id, shift.date);
                  
                  if (!mechStats[product.id]) mechStats[product.id] = { liters: 0, purchase: 0, sale: 0 };
                  const mechSale = qtyMech * prices.salePrice;
                  const mechPurchase = qtyMech * prices.purchasePrice;
                  mechStats[product.id].liters += qtyMech;
                  mechStats[product.id].purchase += mechPurchase;
                  mechStats[product.id].sale += mechSale;
                  profitByDate[dateKey].mechMargin += (mechSale - mechPurchase);
                  
                  if (!elecStats[product.id]) elecStats[product.id] = { liters: 0, purchase: 0, sale: 0 };
                  const elecSale = qtyElec * prices.salePrice;
                  const elecPurchase = qtyElec * prices.purchasePrice;
                  elecStats[product.id].liters += qtyElec;
                  elecStats[product.id].purchase += elecPurchase;
                  elecStats[product.id].sale += elecSale;
                  profitByDate[dateKey].elecMargin += (elecSale - elecPurchase);
                }
              }
            }
          }
        });
      }
    });

    const getProductInfo = (type: string) => {
      const prod = store.products.find(p => p.type === type);
      return { pAchat: prod ? getHistoricalPrice(prod.id, selectedEndDateObj).purchasePrice : 0, pVente: prod ? getHistoricalPrice(prod.id, selectedEndDateObj).salePrice : 0 };
    };

    let totalMechBenefice = 0;
    let totalMechAchat = 0;
    
    Object.keys(mechStats).forEach(type => {
      totalMechBenefice += (mechStats[type].sale - mechStats[type].purchase);
      totalMechAchat += mechStats[type].purchase;
    });

    let totalElecBenefice = 0;
    let totalElecAchat = 0;

    Object.keys(elecStats).forEach(type => {
      totalElecBenefice += (elecStats[type].sale - elecStats[type].purchase);
      totalElecAchat += elecStats[type].purchase;
    });

    const mechMargin = totalMechAchat > 0 ? (totalMechBenefice / totalMechAchat) * 100 : 0;
    const elecMargin = totalElecAchat > 0 ? (totalElecBenefice / totalElecAchat) * 100 : 0;

    const stockReste: Record<string, { liters: number, purchase: number, montant: number, historyPump: any[] }> = {};
    
    // We will calculate the PUMP (Prix Unitaire Moyen Pondéré) for each product chronologically
    store.products.forEach(p => {
      // Find all events for this product up to the selected date
      const pSales = store.sales.filter(s => s.productId === p.id && s.date.split('T')[0] <= selectedEndDateObj).map(s => ({ type: 'sale', date: s.date.split('T')[0], time: (s as any).time || (s.date.includes('T') ? s.date.split('T')[1].substring(0,8) : '00:00:00'), qty: s.qty, price: s.price }));
      const pSupplies = store.supplies.filter(s => s.productId === p.id && s.date.split('T')[0] <= selectedEndDateObj).map(s => ({ type: 'supply', date: s.date.split('T')[0], time: (s as any).time || (s.date.includes('T') ? s.date.split('T')[1].substring(0,8) : '00:00:00'), qty: s.qtyDelivered, price: s.purchasePrice }));
      const pCorrections = (store.stockCorrections || []).filter((c: any) => {
         const tank = store.tanks.find(t => t.id === c.tankId);
         return tank && tank.productId === p.id && c.date.split('T')[0] <= selectedEndDateObj;
      }).map(c => ({ type: 'correction', date: c.date.split('T')[0], time: (c as any).time || (c.date.includes('T') ? c.date.split('T')[1].substring(0,8) : '00:00:00'), qty: c.qtyAfter - c.qtyBefore, price: 0 }));
      
      const allEvents = [...pSales, ...pSupplies, ...pCorrections].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
      
      // Determine the very first purchase price in the system for this product
      // We will look at priceChanges for the oldest entry
      const priceChangesForP = (store.priceChanges || []).filter(pc => pc.productId === p.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // The user specified that the system starts on the 3rd with an initial price
      const initialPrice = priceChangesForP.length > 0 ? priceChangesForP[0].oldPurchasePrice ?? priceChangesForP[0].purchasePrice : p.purchasePrice;
      
      // To find the initial stock at the beginning of time, we do:
      // Initial Stock = Current Stock (now) - Net Change (from all time)
      let actualCurrentStock = 0;
      store.tanks.filter(t => t.productId === p.id).forEach(t => actualCurrentStock += t.currentLevel);
      
      // We need ALL events from all time to find the true initial stock
      const allTimeSales = store.sales.filter(s => s.productId === p.id).reduce((sum, s) => sum + s.qty, 0);
      const allTimeSupplies = store.supplies.filter(s => s.productId === p.id).reduce((sum, s) => sum + s.qtyDelivered, 0);
      const allTimeCorrections = (store.stockCorrections || []).filter(c => {
         const tank = store.tanks.find(t => t.id === c.tankId);
         return tank && tank.productId === p.id;
      }).reduce((sum, c) => sum + (c.qtyAfter - c.qtyBefore), 0);
      
      const netChangeAllTime = allTimeSupplies + allTimeCorrections - allTimeSales;
      const initialStock = actualCurrentStock - netChangeAllTime;
      
      let runningStock = Math.max(0, initialStock);
      let currentPump = initialPrice;
      const historyPump = [];
      
      if (runningStock > 0) {
          historyPump.push({ date: 'Initial', type: 'initial', stockBefore: 0, qty: runningStock, price: initialPrice, stockAfter: runningStock, newPump: currentPump });
      }

      allEvents.forEach(e => {
         const stockBefore = runningStock;
         if (e.type === 'supply') {
            const newStock = runningStock + e.qty;
            if (newStock > 0) {
               currentPump = ((runningStock * currentPump) + (e.qty * e.price)) / newStock;
            } else {
               currentPump = e.price;
            }
            runningStock = newStock;
            historyPump.push({ date: e.date, type: 'supply', stockBefore, qty: e.qty, price: e.price, stockAfter: runningStock, newPump: currentPump });
         } else if (e.type === 'sale') {
            runningStock -= e.qty;
         } else if (e.type === 'correction') {
            runningStock += e.qty;
         }
      });
      
      // Store the final calculated PUMP
      stockReste[p.id] = { liters: 0, purchase: currentPump, montant: 0, historyPump };
    });

    let totalStockLiters = 0;
    let totalStockMontant = 0;

    store.tanks.forEach(tank => {
      const product = store.products.find(p => p.id === tank.productId);
      if (product) {
        if (!stockReste[product.id]) {
          stockReste[product.id] = { liters: 0, purchase: getHistoricalPrice(product.id, selectedEndDateObj).purchasePrice, montant: 0, historyPump: [] };
        }
        stockReste[product.id].liters += tank.currentLevel;
        totalStockLiters += tank.currentLevel;
      }
    });

    // Revert changes that happened AFTER the selected period to reconstruct past stock
    let targetTimestamp = new Date().getTime(); // Default to now
    let targetDateStr = selectedEndDateObj;

    if (selectedShiftId !== 'all') {
       const selectedShift = store.shifts.find(s => s.id === selectedShiftId);
       if (selectedShift) {
          const dStr = selectedShift.endDate || selectedShift.date;
          const tStr = selectedShift.endTime || '23:59:59';
          targetTimestamp = new Date(`${dStr}T${tStr}`).getTime();
          targetDateStr = dStr;
       }
    }

    // 1. Revert sales from shifts that occurred strictly AFTER the target timestamp
    const shiftsAfter = store.shifts.filter(s => {
        if (s.status !== 'completed' && s.status !== 'ready_to_close') return false;
        const dStr = s.endDate || s.date;
        const tStr = s.endTime || '23:59:59';
        return new Date(`${dStr}T${tStr}`).getTime() > targetTimestamp;
    }).map(s => s.id);

    const salesAfter = store.sales.filter(s => shiftsAfter.includes(s.shiftId));
    salesAfter.forEach(s => {
      if (stockReste[s.productId]) {
         stockReste[s.productId].liters += s.qty;
         totalStockLiters += s.qty;
      }
    });

    // Also add back shop products sales if needed? But this block only concerns fuel (tanks).
    // The previous code only added back s.qty (liters).

    // 2. Subtract supplies that occurred strictly AFTER the target date
    const suppliesAfter = store.supplies.filter(s => {
        return s.date.split('T')[0] > targetDateStr;
    });
    suppliesAfter.forEach(s => {
      if (stockReste[s.productId]) {
         stockReste[s.productId].liters -= s.qtyDelivered;
         totalStockLiters -= s.qtyDelivered;
      }
    });

    // 3. Revert stock corrections that occurred strictly AFTER the target date
    const correctionsAfter = (store.stockCorrections || []).filter(c => c.date.split('T')[0] > targetDateStr);
    correctionsAfter.forEach(c => {
       const tank = store.tanks.find(t => t.id === c.tankId);
       if (tank && stockReste[tank.productId]) {
          const diff = c.qtyAfter - c.qtyBefore;
          stockReste[tank.productId].liters -= diff;
          totalStockLiters -= diff;
       }
    });


    Object.keys(stockReste).forEach(type => {
      stockReste[type].montant = stockReste[type].liters * stockReste[type].purchase;
      totalStockMontant += stockReste[type].montant;
    });

    return {
      totalEspece,
      totalBons,
      totalGlobal: totalEspece + totalBons,
      mechStats,
      elecStats,
      totalMechBenefice,
      mechMargin,
      totalElecBenefice,
      elecMargin,
      stockReste,
      totalStockLiters,
      totalStockMontant,
      totalExpenses,
      expensesList: expensesList.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      historicalProfits: Object.entries(profitByDate).map(([date, data]) => ({
        date,
        ...data,
        netProfit: (data.mechMargin + data.elecMargin) - data.expenses
      })).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  }, [store.shifts, store.nozzles, store.tanks, store.products, store.supplies, selectedShiftId, reportAttendant]);

  const fuelThemes: Record<string, { label: string, bg: string, border: string, text: string, icon: string, light: string }> = {
    'gazoil': { label: 'Gasoil', bg: 'bg-indigo-600', border: 'border-indigo-200', text: 'text-indigo-700', icon: 'text-indigo-600', light: 'bg-indigo-50' },
    'sans_plomb': { label: 'Sans Plomb', bg: 'bg-emerald-600', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-600', light: 'bg-emerald-50' },
    'melange': { label: 'Mélange', bg: 'bg-amber-500', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-600', light: 'bg-amber-50' }
  };

  const renderFuelCard = (stats: any, productId: string) => {
    const data = stats[productId];
    const product = store.products.find(p => p.id === productId);
    if (!product || !data) return null;
    const theme = fuelThemes[product.type] || { label: product.name, bg: 'bg-slate-600', border: 'border-slate-200', text: 'text-slate-700', icon: 'text-slate-600', light: 'bg-slate-50' };
    const info = product;
    
    return (
      <div className={`flex-1 min-w-[240px] rounded-xl border ${theme.border} bg-white overflow-hidden flex flex-col`}>
        <div className={`${theme.light} px-4 py-3 flex items-center justify-between border-b ${theme.border}`}>
          <div className="flex items-center gap-2">
            <Fuel className={`w-4 h-4 ${theme.icon}`} />
            <h4 className={`font-bold ${theme.text} uppercase tracking-wide text-xs`}>{info.name || theme.label}</h4>
          </div>
          <span className="font-mono text-xs font-bold text-slate-500">{data.liters.toFixed(2)} L</span>
        </div>
        
        <div className="p-4 flex-1 flex flex-col justify-center space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Chiffre d'Affaires</span>
            <span className="font-mono font-bold text-slate-800">{data.sale.toFixed(2)} Dh</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Coût d'Achat</span>
            <span className="font-mono font-bold text-rose-600">-{data.purchase.toFixed(2)} Dh</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-800 uppercase">Bénéfice</span>
            <span className={`font-mono text-sm font-black ${theme.text}`}>{(data.sale - data.purchase).toFixed(2)} Dh</span>
          </div>
        </div>
        
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex justify-between text-[10px] text-slate-500">
          <span>Achat: {getHistoricalPrice(info.id, selectedEndDateObj).purchasePrice.toFixed(2)} Dh/L</span>
          <span>Vente: {getHistoricalPrice(info.id, selectedEndDateObj).salePrice.toFixed(2)} Dh/L</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <BarChart2 className="w-7 h-7 text-indigo-600" />
            Analyse & Rentabilité
          </h2>
          <p className="text-slate-500 mt-1">Évaluation de la performance et de la marge brute d'exploitation.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Opérateur (Pompiste)</label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={reportAttendant}
              onChange={e => setReportAttendant(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            >
              <option value="all">Tous les opérateurs</option>
              {store.attendants.map(a => (
                <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex-1 min-w-[300px] lg:col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Période (Shift)</label>
          <select 
            value={selectedShiftId}
            onChange={e => setSelectedShiftId(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow appearance-none"
          >
            <option value="all">Toutes les périodes</option>
            {availableShifts.map(shift => {
              const startDateStr = new Date(shift.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
              let label = '';
              if (shift.endDate && shift.date !== shift.endDate) {
                const endDateStr = new Date(shift.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
                label = `Du ${startDateStr} au ${endDateStr} (${shift.shiftName || 'Shift'})`;
              } else {
                label = `Le ${startDateStr} (${shift.shiftName || 'Shift'})`;
              }
              return (
                <option key={shift.id} value={shift.id}>{label}</option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Global Revenues Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-50 rounded-full blur-2xl"></div>
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-xl">
            <Banknote className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase mb-1">Encaissements Espèces</p>
            <h3 className="text-2xl font-black text-slate-800">{reportData.totalEspece.toFixed(2)} <span className="text-lg text-slate-400 font-medium">MAD</span></h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-50 rounded-full blur-2xl"></div>
          <div className="p-4 bg-amber-100 text-amber-600 rounded-xl">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase mb-1">Règlements par Bons</p>
            <h3 className="text-2xl font-black text-slate-800">{reportData.totalBons.toFixed(2)} <span className="text-lg text-slate-400 font-medium">MAD</span></h3>
          </div>
        </div>

        <div className="bg-indigo-600 p-6 rounded-2xl shadow-sm border border-indigo-500 flex items-center gap-4 relative overflow-hidden text-white">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500 rounded-full blur-2xl"></div>
          <div className="p-4 bg-indigo-500 text-white rounded-xl">
            <Wallet className="w-8 h-8" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-indigo-200 uppercase mb-1">Chiffre d'Affaires Total</p>
            <h3 className="text-2xl font-black">{reportData.totalGlobal.toFixed(2)} <span className="text-lg text-indigo-300 font-medium">MAD</span></h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Totals summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Gauge className="w-24 h-24" />
             </div>
             <div className="relative z-10">
               <div className="flex items-center gap-2 text-indigo-400 mb-6">
                 <Gauge className="w-5 h-5" />
                 <h3 className="font-bold uppercase tracking-wider text-sm">Compteurs Mécaniques</h3>
               </div>
               
               <div className="space-y-4">
                 <div>
                   <p className="text-slate-400 text-xs font-bold uppercase mb-1">Marge Brute</p>
                   <div className="text-3xl font-black text-white">{reportData.totalMechBenefice.toFixed(2)} <span className="text-lg font-medium text-slate-500">Dh</span></div>
                   
                   <div className="mt-4 pt-4 border-t border-slate-800">
                     <p className="text-slate-400 text-xs font-bold uppercase mb-1 flex justify-between"><span>Dépenses</span> <span className="text-rose-400">-{reportData.totalExpenses.toFixed(2)} Dh</span></p>
                     <p className="text-indigo-300 text-xs font-bold uppercase mb-1 mt-2">Bénéfice Net Réel</p>
                     <div className="text-2xl font-black text-indigo-400">{(reportData.totalMechBenefice - reportData.totalExpenses).toFixed(2)} <span className="text-sm font-medium text-indigo-500">Dh</span></div>
                   </div>
                 </div>
                 
                 <div className="pt-4 border-t border-slate-800">
                   <div className="flex justify-between items-center">
                     <span className="text-slate-400 text-sm">Taux de marge</span>
                     <span className="font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">{reportData.mechMargin.toFixed(2)}%</span>
                   </div>
                 </div>
               </div>
             </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Zap className="w-24 h-24" />
             </div>
             <div className="relative z-10">
               <div className="flex items-center gap-2 text-amber-400 mb-6">
                 <Zap className="w-5 h-5" />
                 <h3 className="font-bold uppercase tracking-wider text-sm">Compteurs Électroniques</h3>
               </div>
               
               <div className="space-y-4">
                 <div>
                   <p className="text-slate-400 text-xs font-bold uppercase mb-1">Marge Brute</p>
                   <div className="text-3xl font-black text-white">{reportData.totalElecBenefice.toFixed(2)} <span className="text-lg font-medium text-slate-500">Dh</span></div>
                   
                   <div className="mt-4 pt-4 border-t border-slate-800">
                     <p className="text-slate-400 text-xs font-bold uppercase mb-1 flex justify-between"><span>Dépenses</span> <span className="text-rose-400">-{reportData.totalExpenses.toFixed(2)} Dh</span></p>
                     <p className="text-amber-300 text-xs font-bold uppercase mb-1 mt-2">Bénéfice Net Réel</p>
                     <div className="text-2xl font-black text-amber-400">{(reportData.totalElecBenefice - reportData.totalExpenses).toFixed(2)} <span className="text-sm font-medium text-amber-500">Dh</span></div>
                   </div>
                 </div>
                 
                 <div className="pt-4 border-t border-slate-800">
                   <div className="flex justify-between items-center">
                     <span className="text-slate-400 text-sm">Taux de marge</span>
                     <span className="font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">{reportData.elecMargin.toFixed(2)}%</span>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Right Column: Detailed blocks */}
        <div className="lg:col-span-3 space-y-6">
          
          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-indigo-600" />
              Détails par Carburant (Mécanique)
            </h3>
            <div className="flex flex-wrap gap-4">
              {store.products.map(p => <React.Fragment key={p.id}>{renderFuelCard(reportData.mechStats, p.id)}</React.Fragment>)}
            </div>
          </div>

          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Détails par Carburant (Électronique)
            </h3>
            <div className="flex flex-wrap gap-4">
              {store.products.map(p => <React.Fragment key={p.id}>{renderFuelCard(reportData.elecStats, p.id)}</React.Fragment>)}
            </div>
          </div>

        </div>
      </div>

      {/* Stock Reste Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <Archive className="w-6 h-6 text-indigo-600" />
          <div>
            <h3 className="font-bold text-slate-800">Valorisation du Stock Restant</h3>
            <p className="text-xs text-slate-500">Estimation de la valeur marchande du stock actuel en cuves.</p>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Progress / Chart side */}
          <div className="md:col-span-1 space-y-4 flex flex-col justify-center">
            <div className="text-center mb-4">
               <div className="text-slate-500 text-xs font-bold uppercase mb-1">Volume Total</div>
               <div className="text-2xl font-black text-slate-800">{reportData.totalStockLiters.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} L</div>
            </div>
            
            {store.products.map(product => {
              const theme = fuelThemes[product.type] || { label: product.name, bg: 'bg-slate-600', border: 'border-slate-200', text: 'text-slate-700', icon: 'text-slate-600', light: 'bg-slate-50' };
              const info = product;
              const pct = reportData.totalStockLiters > 0 
                ? ((reportData.stockReste[product.id]?.liters || 0) / reportData.totalStockLiters) * 100 
                : 0;
              return (
                <div key={product.id}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600">{info.name || theme.label}</span>
                    <span className={theme.text}>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${theme.bg} rounded-full`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table side */}
          <div className="md:col-span-3 flex items-center">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 text-left font-bold text-slate-500">Produit</th>
                    <th className="py-3 text-right font-bold text-slate-500">Volume</th>
                    <th className="py-3 text-right font-bold text-slate-500">Prix Moyen d'Achat</th>
                    <th className="py-3 text-right font-bold text-slate-500">Valeur Totale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {store.products.map(product => {
              const theme = fuelThemes[product.type] || { label: product.name, bg: 'bg-slate-600', border: 'border-slate-200', text: 'text-slate-700', icon: 'text-slate-600', light: 'bg-slate-50' };
              const info = product;
              const data = reportData.stockReste[product.id];
              if (!data) return null;
                    return (
                      <React.Fragment key={product.id}>
                        <tr className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setExpandedPumpProduct(expandedPumpProduct === product.id ? null : product.id)}>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${theme.bg}`}></div>
                              <span className="font-bold text-slate-700">{info.name || theme.label}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-2">Détails PUMP</span>
                            </div>
                          </td>
                          <td className="py-4 text-right font-mono text-slate-600">{data.liters.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} L</td>
                          <td className="py-4 text-right font-mono text-slate-500">x {data.purchase.toFixed(2)} MAD</td>
                          <td className="py-4 text-right font-mono font-bold text-slate-800">{data.montant.toLocaleString('fr-FR', {minimumFractionDigits: 2})} MAD</td>
                        </tr>
                        {expandedPumpProduct === product.id && data.historyPump && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={4} className="p-0 border-b border-slate-100">
                              <div className="p-4 pl-8 border-l-2 border-indigo-500 m-2 rounded-r-lg bg-white shadow-sm overflow-x-auto">
                                <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Historique PUMP (Prix Unitaire Moyen Pondéré)</h4>
                                <table className="w-full text-xs text-left">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-slate-400">
                                      <th className="pb-2 font-medium">Date</th>
                                      <th className="pb-2 font-medium">Événement</th>
                                      <th className="pb-2 text-right font-medium">Stock Avant (L)</th>
                                      <th className="pb-2 text-right font-medium">Qté Livrée (L)</th>
                                      <th className="pb-2 text-right font-medium">Prix Achat (MAD)</th>
                                      <th className="pb-2 text-right font-medium">Nouveau Stock (L)</th>
                                      <th className="pb-2 text-right font-medium text-indigo-600">Nouveau PUMP (MAD)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {data.historyPump.map((h, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-2 text-slate-600">{h.date === 'Initial' ? 'Stock Initial (03/07)' : new Date(h.date).toLocaleDateString('fr-FR')}</td>
                                        <td className="py-2">
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${h.type === 'initial' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {h.type === 'initial' ? 'Initialisation' : 'Livraison'}
                                          </span>
                                        </td>
                                        <td className="py-2 text-right font-mono text-slate-500">{h.stockBefore.toLocaleString('fr-FR', {minimumFractionDigits: 2})}</td>
                                        <td className="py-2 text-right font-mono text-slate-700">+{h.qty.toLocaleString('fr-FR', {minimumFractionDigits: 2})}</td>
                                        <td className="py-2 text-right font-mono text-slate-700">{h.price.toFixed(2)}</td>
                                        <td className="py-2 text-right font-mono text-slate-800 font-medium">{h.stockAfter.toLocaleString('fr-FR', {minimumFractionDigits: 2})}</td>
                                        <td className="py-2 text-right font-mono font-bold text-indigo-600">{h.newPump.toFixed(2)}</td>
                                      </tr>
                                    ))}
                                    {data.historyPump.length === 0 && (
                                      <tr>
                                        <td colSpan={7} className="py-4 text-center text-slate-400 italic">Aucune donnée historique de livraison pour calculer le PUMP.</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/50">
                    <td colSpan={3} className="py-4 text-right font-bold text-slate-600 uppercase text-xs tracking-wider">
                      Valorisation Totale du Stock
                    </td>
                    <td className="py-4 text-right font-black text-indigo-700 text-lg">
                      {reportData.totalStockMontant.toLocaleString('fr-FR', {minimumFractionDigits: 2})} MAD
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
      

      {/* Historique et Dépenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Historique des Bénéfices */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">Historique des Bénéfices (Journalier)</h3>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 border-b border-slate-100 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold text-right">Marge (Méc.)</th>
                  <th className="p-4 font-bold text-right">Marge (Élec.)</th>
                  <th className="p-4 font-bold text-right">Dépenses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.historicalProfits.length > 0 ? (
                  reportData.historicalProfits.map((day) => (
                    <tr key={day.date} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-700">{new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}</td>
                      <td className="p-4 text-right text-slate-600 font-mono">{day.mechMargin.toFixed(2)}</td>
                      <td className="p-4 text-right text-slate-600 font-mono">{day.elecMargin.toFixed(2)}</td>
                      <td className="p-4 text-right text-rose-500 font-mono">-{day.expenses.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">Aucun historique disponible sur cette période</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Détail des Dépenses */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
            <MinusCircle className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-800">Détail des Dépenses</h3>
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 border-b border-slate-100 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="p-4 font-bold">Date / Shift</th>
                  <th className="p-4 font-bold">Type</th>
                  <th className="p-4 font-bold">Description</th>
                  <th className="p-4 font-bold text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.expensesList.length > 0 ? (
                  reportData.expensesList.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-700">{new Date(exp.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{exp.shiftName}</div>
                      </td>
                      <td className="p-4 text-slate-600 capitalize">
                        {exp.type}
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-slate-100 text-slate-500">{exp.method}</span>
                      </td>
                      <td className="p-4 text-slate-500 text-xs">{exp.description}</td>
                      <td className="p-4 text-right font-bold text-rose-600 font-mono">-{exp.amount.toFixed(2)} MAD</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">Aucune dépense enregistrée sur cette période</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
