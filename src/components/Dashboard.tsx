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
  const { 
    sales, attendants, tanks, pumps, nozzles, supplies, cashRegistry, alerts, products 
  } = store;

  // Calculs financiers pour aujourd'hui
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date === todayStr);
  const totalRevenueToday = todaySales.reduce((acc, s) => acc + s.total, 0);
  const totalLitersToday = todaySales.reduce((acc, s) => acc + s.qty, 0);
  const totalVentesCountToday = todaySales.length;

  // Calcul des bénéfices d'aujourd'hui (Prix de vente - Prix d'achat)
  const totalProfitToday = todaySales.reduce((acc, s) => {
    const prod = products.find(p => p.id === s.productId);
    const purchaseCost = prod ? prod.purchasePrice : 1.45;
    const margin = s.price - purchaseCost;
    return acc + (s.qty * margin);
  }, 0);

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

  // Graphique des ventes journalières (heures)
  // On regroupe les ventes par tranches d'heures pour aujourd'hui et hier
  const hourlyData = [
    { hour: '06h-08h', ventes: 0, litres: 0 },
    { hour: '08h-10h', ventes: 0, litres: 0 },
    { hour: '10h-12h', ventes: 0, litres: 0 },
    { hour: '12h-14h', ventes: 0, litres: 0 },
    { hour: '14h-16h', ventes: 0, litres: 0 },
    { hour: '16h-18h', ventes: 0, litres: 0 },
    { hour: '18h-20h', ventes: 0, litres: 0 },
    { hour: '20h-22h', ventes: 0, litres: 0 },
  ];

  sales.forEach(s => {
    const hourInt = parseInt(s.time.split(':')[0]);
    let index = 0;
    if (hourInt >= 6 && hourInt < 8) index = 0;
    else if (hourInt >= 8 && hourInt < 10) index = 1;
    else if (hourInt >= 10 && hourInt < 12) index = 2;
    else if (hourInt >= 12 && hourInt < 14) index = 3;
    else if (hourInt >= 14 && hourInt < 16) index = 4;
    else if (hourInt >= 16 && hourInt < 18) index = 5;
    else if (hourInt >= 18 && hourInt < 20) index = 6;
    else if (hourInt >= 20 && hourInt <= 22) index = 7;
    else return;

    hourlyData[index].ventes += s.total;
    hourlyData[index].litres += s.qty;
  });

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

      {/* Grid des statistiques clés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chiffre d'affaires du jour */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chiffre d'affaires (Jour)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono">{totalRevenueToday.toFixed(2)}</h3>
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
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Carburant vendu (Jour)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono">{totalLitersToday} L</h3>
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

        {/* Recettes & Bénéfices */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bénéfices Estimés (Jour)</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1 font-mono">+{totalProfitToday.toFixed(2)}</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            <span className="text-slate-500 font-medium">Marge brute moyenne:</span>
            <span className="text-slate-700 font-semibold">{( (totalProfitToday / (totalRevenueToday || 1)) * 100 ).toFixed(1)}%</span>
          </div>
        </div>

        {/* État des Stocks de Carburant */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Global Cuves</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900 font-mono">{stockPercentage}%</span>
                <span className="text-xs text-slate-500">({Math.round(totalCurrentStock / 1000)}k / {Math.round(totalStockCapacity / 1000)}k L)</span>
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

      {/* Grid intermédiaires : Pompes, Alertes, etc. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase">Ventes du jour</p>
          <p className="text-xl font-bold text-slate-800 mt-1 font-mono">{totalVentesCountToday}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase">Pompistes Actifs</p>
          <p className="text-xl font-bold text-slate-800 mt-1 font-mono">{activeAttendantsCount}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase">Pompes Distribuantes</p>
          <p className="text-xl font-bold text-slate-800 mt-1 font-mono">{activePumpsCount} / {pumps.length}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center cursor-pointer hover:bg-rose-50" onClick={() => setView('alerts')}>
          <p className="text-xs font-semibold text-slate-400 uppercase">Alertes Actives</p>
          <p className={`text-xl font-bold mt-1 font-mono ${activeAlertsCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
            {activeAlertsCount}
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase">Produit Vedette</p>
          <p className="text-sm font-bold text-slate-800 mt-1.5 truncate" title={topProduct}>{topProduct.split(' ')[0]}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase">Top Pompiste</p>
          <p className="text-sm font-bold text-slate-800 mt-1.5 truncate" title={topAttendant}>{topAttendant.split(' ')[0]}</p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ventes par tranche horaire */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 lg:col-span-2 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 font-display">Courbe d'activité aujourd'hui</h3>
              <p className="text-xs text-slate-400">Volume (Litres) et chiffre d'affaires cumulés par tranche horaire</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1 text-sky-500"><span className="w-2.5 h-2.5 bg-sky-500 rounded-sm"></span> Ventes (MAD)</span>
              <span className="flex items-center gap-1 text-blue-500"><span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span> Volume (L)</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLiters" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="ventes" name="Recettes (MAD)" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorVentes)" />
                <Area type="monotone" dataKey="litres" name="Volume (L)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorLiters)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition par Carburant */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 font-display">Répartition par carburant</h3>
            <p className="text-xs text-slate-400 mb-4">Volume total distribué par type de produit</p>
          </div>
          <div className="h-44 relative flex items-center justify-center">
            {productPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {productPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} L`, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">Aucune vente enregistrée.</p>
            )}
            <div className="absolute text-center">
              <span className="block text-xl font-bold font-mono text-slate-700">{totalLitersToday}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Litres Totaux</span>
            </div>
          </div>
          <div className="space-y-1.5 mt-2">
            {productPieData.map((entry, index) => (
              <div key={`product-${index}`}  className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  {entry.name}
                </span>
                <span className="font-mono text-slate-500 font-medium">
                  {entry.value} L ({entry.revenue} MAD)
                </span>
              </div>
            ))}
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
              onClick={() => setView('registry')} 
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="block text-xs font-bold text-slate-700">Gestion Caisse</span>
                <span className="block text-[10px] text-slate-400 font-medium">Saisir un flux</span>
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
              onClick={() => setView('reports')} 
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="block text-xs font-bold text-slate-700">Générer Rapports</span>
                <span className="block text-[10px] text-slate-400 font-medium">Bilan comptable & PDF</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
