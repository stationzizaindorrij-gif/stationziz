import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import { 
  DollarSign, Droplets, ShoppingCart, Users, Fuel, AlertTriangle, 
  Activity, TrendingUp, Award, ArrowUpRight, ArrowDownRight, Zap 
} from 'lucide-react';
import { ERPStoreType } from '../store';

interface DashboardProps {
  store: ERPStoreType;
  setView: (v: string) => void;
}

export default function Dashboard({ store, setView }: DashboardProps) {
  const [chartPeriod, setChartPeriod] = React.useState<'day' | 'month' | 'year'>('day');
  const [statsPeriod, setStatsPeriod] = React.useState<'day' | 'month' | 'year'>('day');
  const { 
    sales, attendants, tanks, pumps, nozzles, supplies, cashRegistry, alerts, products 
  } = store;

  // Calculs financiers pour la période sélectionnée
  const completedShifts = store.shifts.filter(s => s.status === 'completed' || s.status === 'ready_to_close');
  const targetDateStr = new Date().toISOString().split('T')[0];
  const currentYear = targetDateStr.substring(0, 4);
  const currentMonth = targetDateStr.substring(0, 7);
  
  const statsShifts = completedShifts.filter(s => {
    if (statsPeriod === 'day') return s.date === targetDateStr;
    if (statsPeriod === 'month') return s.date.startsWith(currentMonth);
    if (statsPeriod === 'year') return s.date.startsWith(currentYear);
    return false;
  });
  
  const totalRevenueStats = statsShifts.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const totalLitersStats = statsShifts.reduce((acc, s) => acc + (s.totalLiters || 0), 0);
  const totalVentesCountStats = statsShifts.length;

  const getHistoricalPrice = (productId: string, date: string) => {
    const sortedChanges = [...(store.priceChanges || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const changesBeforeDate = sortedChanges.filter(c => c.productId === productId && c.date.split('T')[0] <= date.split('T')[0]);
    if (changesBeforeDate.length > 0) return changesBeforeDate[0].purchasePrice;
    const currentProd = products.find(p => p.id === productId);
    return currentProd ? currentProd.purchasePrice : 1.45;
  };

  // Calcul des bénéfices
  let totalProfitStats = 0;
  statsShifts.forEach(shift => {
    if (shift.litersSold) {
      Object.entries(shift.litersSold).forEach(([nozzleId, litersVal]) => {
        const liters = Number(litersVal);
        if (liters > 0) {
          const nozzle = store.nozzles.find(n => n.id === nozzleId);
          if (nozzle) {
            const pump = store.pumps.find(p => p.id === nozzle.pumpId);
            if (pump) {
              const tank = store.tanks.find(t => t.id === nozzle.tankId);
              if (tank) {
                const product = store.products.find(p => p.id === tank.productId);
                if (product) {
                  const purchaseCost = getHistoricalPrice(product.id, shift.date);
                  // Pour trouver le prix de vente, on peut utiliser amountSold / litersSold
                  // ou le currentProd.price. amountSold / litersSold est plus précis pour ce shift
                  let unitPrice = product.salePrice;
                  if (shift.amountSold && shift.amountSold[nozzleId]) {
                      unitPrice = shift.amountSold[nozzleId] / liters;
                  }
                  const margin = unitPrice - purchaseCost;
                  totalProfitStats += (liters * margin);
                }
              }
            }
          }
        }
      });
    }
  });

  // Stock total restant
  const totalCurrentStock = tanks.reduce((acc, t) => acc + t.currentLevel, 0);
  const totalStockCapacity = tanks.reduce((acc, t) => acc + t.capacity, 0);
  const stockPercentage = Math.round((totalCurrentStock / totalStockCapacity) * 100);

  // Alertes actives non lues
  const activeAlertsCount = alerts.filter(a => !a.isRead).length;

  // Pompes actives
  const activePumpsCount = pumps.filter(p => p.status === 'active').length;

  // Pompistes actifs
  const activeAttendantsCount = attendants.filter(a => a.status === 'active').length;

  // Total achats carburant (Approvisionnements)
  const totalPurchasesAmount = supplies.reduce((acc, s) => acc + (s.qtyDelivered * s.purchasePrice), 0);

  // Produit le plus vendu
  const productSalesMap: { [key: string]: { qty: number; total: number; name: string } } = {};
  sales.forEach(s => {
    if (!productSalesMap[s.productId]) {
      productSalesMap[s.productId] = { qty: 0, total: 0, name: s.productName };
    }
    productSalesMap[s.productId].qty += s.qty;
    productSalesMap[s.productId].total += s.total;
  });

  let topProduct = "Aucun";
  let maxProductQty = 0;
  Object.values(productSalesMap).forEach(p => {
    if (p.qty > maxProductQty) {
      maxProductQty = p.qty;
      topProduct = p.name;
    }
  });

  // Meilleur pompiste (Chiffre d'affaires)
  const attendantSalesMap: { [key: string]: { total: number; name: string } } = {};
  sales.forEach(s => {
    if (!attendantSalesMap[s.attendantId]) {
      attendantSalesMap[s.attendantId] = { total: 0, name: s.attendantName };
    }
    attendantSalesMap[s.attendantId].total += s.total;
  });

  let topAttendant = "Aucun";
  let maxAttendantTotal = 0;
  Object.values(attendantSalesMap).forEach(a => {
    if (a.total > maxAttendantTotal) {
      maxAttendantTotal = a.total;
      topAttendant = a.name;
    }
  });


  // Graphique d'activité lié aux shifts
  const chartData = React.useMemo(() => {
    const completedShifts = store.shifts.filter(s => s.status === 'completed' || s.status === 'ready_to_close');
    
    // Trier par date
    completedShifts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const aggregated: Record<string, { label: string, ventes: number, litres: number }> = {};
    
    completedShifts.forEach(shift => {
      let key = shift.date;
      let label = shift.date;
      
      const dateObj = new Date(shift.date);
      
      if (chartPeriod === 'month') {
        key = shift.date.substring(0, 7); // YYYY-MM
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        label = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
      } else if (chartPeriod === 'year') {
        key = shift.date.substring(0, 4); // YYYY
        label = key;
      } else {
        // day (agréger par jour)
        key = shift.date; // YYYY-MM-DD
        const startDateStr = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        label = `Le ${startDateStr}`;
      }
      
      if (!aggregated[key]) {
        aggregated[key] = { label, ventes: 0, litres: 0 };
      }
      
      aggregated[key].ventes += (shift.totalAmount || 0);
      aggregated[key].litres += (shift.totalLiters || 0);
    });
    
    let result = Object.values(aggregated);
    
    // To bring bars closer together when there are very few of them, we pad the array
    if (result.length > 0 && result.length < 7) {
      const paddingNeeded = 7 - result.length;
      const leftPad = Math.floor(paddingNeeded / 2);
      const rightPad = paddingNeeded - leftPad;
      
      for (let i = 0; i < leftPad; i++) {
        result.unshift({ label: ' '.repeat(i + 1), ventes: 0, litres: 0 }); // Spaces to keep label unique
      }
      for (let i = 0; i < rightPad; i++) {
        result.push({ label: ' '.repeat(leftPad + i + 1), ventes: 0, litres: 0 });
      }
    }
    
    return result;
  }, [store.shifts, chartPeriod]);

  // Graphique de distribution par produit
  const productPieData = Object.values(productSalesMap).map(p => ({
    name: p.name,
    value: Math.round(p.qty),
    revenue: Math.round(p.total)
  }));

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6" id="dashboard-view">
      {/* En-tête du Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Tableau de Bord Général</h1>
          <p className="text-sm text-slate-500">Supervision en temps réel de l'activité de la station-service.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Connexion IoT Active
          </span>
          <span className="text-xs text-slate-400">Dernière synchro: à l'instant</span>
        </div>
      </div>

      {/* Options de période pour les statistiques */}
      <div className="flex justify-end mt-4 mb-2">
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
          <button 
            onClick={() => setStatsPeriod('day')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${statsPeriod === 'day' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Aujourd'hui
          </button>
          <button 
            onClick={() => setStatsPeriod('month')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${statsPeriod === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Ce mois
          </button>
          <button 
            onClick={() => setStatsPeriod('year')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${statsPeriod === 'year' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Cette année
          </button>
        </div>
      </div>

      {/* Grid des statistiques clés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Chiffre d'affaires du jour */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chiffre d'affaires</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono">{totalRevenueStats.toFixed(2)}</h3>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            <span className="text-emerald-600 font-medium inline-flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
            </span>
            <span className="text-slate-400">vs hier à la même heure</span>
          </div>
        </div>

        {/* Litres vendus aujourd'hui */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Carburant vendu</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono">{totalLitersStats.toFixed(2)} L</h3>
            </div>
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            <span className="text-emerald-600 font-medium inline-flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +8.5%
            </span>
            <span className="text-slate-400">volumes distribués</span>
          </div>
        </div>



        {/* État des Stocks de Carburant */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Global Cuves</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900 font-mono">{stockPercentage}%</span>
                <span className="text-xs text-slate-500">({(totalCurrentStock / 1000).toFixed(2)}k / {(totalStockCapacity / 1000).toFixed(2)}k L)</span>
              </div>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <Fuel className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${stockPercentage < 30 ? 'bg-rose-500' : stockPercentage < 60 ? 'bg-amber-500' : 'bg-sky-500'}`}
                style={{ width: `${stockPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>



      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-6">
        {/* Ventes par tranche horaire */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 font-display">Courbe d'activité</h3>
              <p className="text-xs text-slate-400">Volume (Litres) cumulé</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setChartPeriod('day')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${chartPeriod === 'day' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Jour
                </button>
                <button 
                  onClick={() => setChartPeriod('month')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${chartPeriod === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Mois
                </button>
                <button 
                  onClick={() => setChartPeriod('year')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${chartPeriod === 'year' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Année
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold hidden sm:flex">
                <span className="flex items-center gap-1 text-blue-500"><span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span> Volume (L)</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(value) => Math.round(Number(value)).toString()} width={60} />
                <Tooltip formatter={(value: any) => [`${Number(value).toFixed(2)} L`, "Volume (L)"]} />
                <Bar dataKey="litres" name="Volume (L)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Raccourcis tactiques & alertes critiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Résumé des alertes critiques non résolues */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 font-display">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Alertes & Anomalies Actives
            </h3>
            <button onClick={() => setView('alerts')} className="text-xs text-blue-600 hover:underline font-semibold">
              Consulter tout
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
            {alerts.filter(a => !a.isRead).length > 0 ? (
              alerts.filter(a => !a.isRead).map((alert, index) => (
                <div key={alert.id || `alert-${index}`} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    <span className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${alert.severity === 'danger' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                    <p className="text-slate-600 font-medium leading-relaxed">{alert.message}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {new Date(alert.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400">
                <p className="text-xs">Aucune alerte critique active. Toutes les installations fonctionnent nominalement.</p>
              </div>
            )}
          </div>
        </div>

        {/* Liens de navigation rapide / État opérationnel des cuves */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2 font-display">
              <Zap className="w-5 h-5 text-sky-500" />
              Raccourcis & Actions Métier Rapides
            </h3>
            <p className="text-xs text-slate-400 mb-4">Accès immédiat aux tâches fréquentes de la station.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setView('shifts')} 
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="block text-xs font-bold text-slate-700">Nouveau Shift</span>
                <span className="block text-[10px] text-slate-400 font-medium">Prendre le service</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>
            <button 
              onClick={() => setView('clients')} 
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="block text-xs font-bold text-slate-700">Gestion Clients</span>
                <span className="block text-[10px] text-slate-400 font-medium">Gérer les clients</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>
            <button 
              onClick={() => setView('tanks')} 
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="block text-xs font-bold text-slate-700">Remplir Cuve</span>
                <span className="block text-[10px] text-slate-400 font-medium">Réceptionner du stock</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>
            <button 
              onClick={() => setView('assets')} 
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="block text-xs font-bold text-slate-700">Modifier Prix</span>
                <span className="block text-[10px] text-slate-400 font-medium">Mettre à jour les tarifs</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
