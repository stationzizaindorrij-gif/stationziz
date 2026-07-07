import React, { useState, useMemo } from 'react';
import { ERPStoreType } from '../store';
import { 
  BarChart2, TrendingUp, DollarSign, Package, 
  Droplet, Calendar, Filter, PieChart as PieChartIcon 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend 
} from "recharts";
import { format, subDays, startOfWeek, startOfMonth, startOfYear, isWithinInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AnalyticsProps {
  store: ERPStoreType;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics({ store }: AnalyticsProps) {
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Utility to check if a date is within selected range
  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return false;
    const date = parseISO(dateStr.split('T')[0]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let start = new Date();
    let end = new Date();
    
    switch (dateFilter) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'yesterday':
        start = subDays(today, 1);
        end = subDays(today, 1);
        break;
      case 'week':
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = today;
        break;
      case 'month':
        start = startOfMonth(today);
        end = today;
        break;
      case 'year':
        start = startOfYear(today);
        end = today;
        break;
      case 'custom':
        start = parseISO(customStartDate);
        end = parseISO(customEndDate);
        break;
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return isWithinInterval(date, { start, end });
  };

  const metrics = useMemo(() => {
    let fuelSalesAmount = 0;
    let fuelSalesLiters = 0;
    let fuelCogs = 0;

    let productSalesAmount = 0;
    let productCogs = 0;
    let productSalesCount = 0;
    
    let serviceSalesAmount = 0;
    
    let totalExpenses = 0;
    let expensesByCategory: { [key: string]: number } = {};

    let fuelSalesByProduct: { [key: string]: number } = {};
    let shopSalesByProduct: { [key: string]: number } = {};
    
    // Daily evolution
    let dailyData: { [date: string]: { revenue: number, profit: number } } = {};

    // Get current purchase prices for fallback
    const productPrices = store.products.reduce((acc, p) => ({ ...acc, [p.id]: p.purchasePrice }), {} as any);
    const shopPrices = store.shopProducts.reduce((acc, p) => ({ ...acc, [p.id]: p.purchasePrice }), {} as any);

    store.shifts.filter(s => s.status === 'completed' && isDateInRange(s.date)).forEach(shift => {
      const dateKey = shift.date;
      if (!dailyData[dateKey]) dailyData[dateKey] = { revenue: 0, profit: 0 };

      // Fuel Sales
      if (shift.litersSold) {
        Object.entries(shift.litersSold).forEach(([nozzleId, liters]) => {
          const nozzle = store.nozzles.find(n => n.id === nozzleId);
          if (nozzle && Number(liters) > 0) {
            const amount = Number(shift.amountSold?.[nozzleId] || 0);
            fuelSalesAmount += amount;
            fuelSalesLiters += Number(liters);
            
            // COGS Fuel
            const pPrice = productPrices[nozzle.productId] || 0;
            const cogs = Number(liters) * pPrice;
            fuelCogs += cogs;

            // Tracking for pie chart
            fuelSalesByProduct[nozzle.productName] = (fuelSalesByProduct[nozzle.productName] || 0) + Number(liters);

            dailyData[dateKey].revenue += amount;
          }
        });
      }

      // Products Sold
      if (shift.productsSold) {
        shift.productsSold.forEach(p => {
          const amount = Number(p.total || 0);
          productSalesAmount += amount;
          productSalesCount += (p.qty || 0);

          // COGS Products
          const pPrice = shopPrices[p.shopProductId] || 0;
          const cogs = (p.qty || 0) * pPrice;
          productCogs += cogs;

          // Tracking for pie chart
          shopSalesByProduct[p.name] = (shopSalesByProduct[p.name] || 0) + (p.qty || 0);

          dailyData[dateKey].revenue += amount;
        });
      }

      // Services Sold
      if (shift.servicesSold) {
        shift.servicesSold.forEach(s => {
          const amount = Number(s.total || 0);
          serviceSalesAmount += amount;
          dailyData[dateKey].revenue += amount;
        });
      }

      // Expenses
      if (shift.expenses) {
        shift.expenses.forEach(e => {
          const amount = Number(e.amount || 0);
          totalExpenses += amount;
          
          const cat = e.category || 'Autre';
          expensesByCategory[cat] = (expensesByCategory[cat] || 0) + amount;
        });
      }
    });

    const revenue = fuelSalesAmount + productSalesAmount + serviceSalesAmount;
    const cogs = fuelCogs + productCogs;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - totalExpenses;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // Current Stock Value (Independent of date filter)
    let tankStockValue = 0;
    store.tanks.forEach(tank => {
      const pPrice = productPrices[tank.productId] || 0;
      tankStockValue += (tank.currentLevel * pPrice);
    });

    let shopStockValue = 0;
    store.shopProducts.forEach(prod => {
      shopStockValue += (prod.stockQuantity * prod.purchasePrice);
    });
    const totalStockValue = tankStockValue + shopStockValue;

    // Formatting for charts
    const dailyEvolution = Object.keys(dailyData).sort().map(date => {
        return {
            date,
            revenue: dailyData[date].revenue,
            // we will just use the gross margin ratio to estimate daily profit for simplicity if exact daily cogs isn't tracked
            profit: dailyData[date].revenue * (grossMargin / 100)
        };
    });

    return {
      revenue, cogs, fuelCogs, productCogs, grossProfit, netProfit, grossMargin, netMargin, totalExpenses,
      fuelSalesLiters, productSalesCount,
      totalStockValue, tankStockValue, shopStockValue,
      fuelSalesByProduct, shopSalesByProduct, expensesByCategory,
      dailyEvolution
    };
  }, [store.shifts, store.tanks, store.shopProducts, store.products, store.nozzles, dateFilter, customStartDate, customEndDate]);

  // Top products
  const topFuel = Object.entries(metrics.fuelSalesByProduct).sort((a, b) => (b[1] as number) - (a[1] as number))[0] || ['Aucun', 0];
  const topShop = Object.entries(metrics.shopSalesByProduct).sort((a, b) => (b[1] as number) - (a[1] as number))[0] || ['Aucun', 0];

  // Prepare chart data
  const expensesChartData = Object.entries(metrics.expensesByCategory).map(([name, value]) => ({ name, value: value as number })).sort((a,b)=>b.value-a.value);
  const salesBreakdown = [
    { name: 'Carburants', value: metrics.revenue - (metrics.revenue - (metrics.fuelSalesLiters * 10)) }, // approximation for chart if we didn't save amounts separately
  ]; // Will fix this to exact amounts below

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <BarChart2 className="w-7 h-7 text-indigo-600" />
            Analyse Financière & Rentabilité
          </h2>
          <p className="text-slate-500 mt-1">Tableau de bord analytique en lecture seule.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="today">Aujourd'hui</option>
              <option value="yesterday">Hier</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="year">Cette année</option>
              <option value="custom">Période personnalisée</option>
            </select>
          </div>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <input 
                type="date" 
                value={customStartDate} 
                onChange={e => setCustomStartDate(e.target.value)}
                className="px-2 py-1 text-sm bg-transparent focus:outline-none font-medium text-slate-700"
              />
              <span className="text-slate-300">-</span>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={e => setCustomEndDate(e.target.value)}
                className="px-2 py-1 text-sm bg-transparent focus:outline-none font-medium text-slate-700"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Chiffre d'Affaires */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chiffre d'Affaires</div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 ml-2">
              <DollarSign className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-800 truncate">
            {metrics.revenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-500 font-medium">MAD</span>
          </div>
        </div>

        {/* Coût d'achat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Coût Marchandises</div>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 ml-2">
              <Package className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-800 truncate">
            {metrics.cogs.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-500 font-medium">MAD</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex justify-between">
            <span>C: {(metrics.fuelCogs/1000).toFixed(1)}k</span>
            <span>B: {(metrics.productCogs/1000).toFixed(1)}k</span>
          </div>
        </div>

        {/* Dépenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dépenses</div>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0 ml-2">
              <TrendingUp className="w-4 h-4 text-rose-600 rotate-180" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-800 truncate">
            {metrics.totalExpenses.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-500 font-medium">MAD</span>
          </div>
        </div>

        {/* Valeur du Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valeur du Stock</div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 ml-2">
              <Package className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-800 truncate">
            {metrics.totalStockValue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-500 font-medium">MAD</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex justify-between">
            <span>C: {(metrics.tankStockValue/1000).toFixed(1)}k</span>
            <span>B: {(metrics.shopStockValue/1000).toFixed(1)}k</span>
          </div>
        </div>

        {/* Bénéfice Net */}
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Bénéfice Net</div>
            <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shrink-0 ml-2 shadow-sm">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-900 truncate relative z-10">
            {metrics.netProfit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs text-emerald-700 font-medium">MAD</span>
          </div>
          <div className="mt-2 text-xs font-bold text-emerald-800 bg-white/50 inline-block px-2 py-1 rounded-md relative z-10">
            Marge: {metrics.netMargin.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Additional Stats */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-sm">
            <h3 className="font-bold text-slate-400 mb-4 uppercase text-xs tracking-wider">Performances des Ventes</h3>
            
            <div className="space-y-5">
              <div>
                <div className="text-slate-400 text-sm mb-1">Carburant vendu</div>
                <div className="text-xl font-bold flex items-end gap-2">
                  {metrics.fuelSalesLiters.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} <span className="text-sm text-slate-500 mb-1">Litres</span>
                </div>
              </div>
              
              <div>
                <div className="text-slate-400 text-sm mb-1">Produits vendus (Boutique)</div>
                <div className="text-xl font-bold flex items-end gap-2">
                  {metrics.productSalesCount.toLocaleString('fr-FR')} <span className="text-sm text-slate-500 mb-1">Unités</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="text-slate-400 text-sm mb-1">Top Carburant</div>
                <div className="font-bold text-indigo-400 flex justify-between items-center">
                  <span>{topFuel[0]}</span>
                  <span className="text-xs bg-indigo-500/20 px-2 py-1 rounded text-indigo-300">{Number(topFuel[1]).toLocaleString('fr-FR')} L</span>
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-sm mb-1">Top Produit</div>
                <div className="font-bold text-emerald-400 flex justify-between items-center">
                  <span>{topShop[0]}</span>
                  <span className="text-xs bg-emerald-500/20 px-2 py-1 rounded text-emerald-300">{Number(topShop[1]).toLocaleString('fr-FR')} u</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-4 text-sm">Rentabilité (Marge Brute)</h3>
             <div className="flex justify-between items-center mb-2">
               <span className="text-slate-500 text-sm">Chiffre d'Affaires</span>
               <span className="font-bold">{metrics.revenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
             </div>
             <div className="flex justify-between items-center mb-1">
               <span className="text-slate-500 text-sm">Coût total des Marchandises</span>
               <span className="font-bold text-rose-600">-{metrics.cogs.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
             </div>
             <div className="flex justify-between items-center mb-1 pl-4">
               <span className="text-slate-400 text-xs">└ Coût d'achat carburants vendus</span>
               <span className="text-rose-500 text-xs">-{metrics.fuelCogs.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
             </div>
             <div className="flex justify-between items-center mb-2 pl-4">
               <span className="text-slate-400 text-xs">└ Coût d'achat produits vendus</span>
               <span className="text-rose-500 text-xs">-{metrics.productCogs.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
             </div>
             <div className="h-px bg-slate-100 my-3"></div>
             <div className="flex justify-between items-center">
               <span className="text-slate-800 font-bold">Bénéfice Brut</span>
               <span className="font-black text-indigo-600">{metrics.grossProfit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
             </div>
          </div>
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Évolution Financière
            </h3>
            <div className="h-64">
              {metrics.dailyEvolution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.dailyEvolution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                    <RechartsTooltip formatter={(value: number) => [`${value.toLocaleString('fr-FR')} MAD`]} />
                    <Legend />
                    <Area type="monotone" name="Chiffre d'Affaires" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" name="Bénéfice (Est.)" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">Aucune donnée disponible</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-500" />
                Répartition des Dépenses
              </h3>
            <div className="h-64">
              {expensesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expensesChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => [`${value.toLocaleString('fr-FR')} MAD`, 'Montant']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  Aucune dépense sur cette période
                </div>
              )}
            </div>
          </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-500" />
                Répartition des Ventes (Carburant)
              </h3>
              <div className="h-64">
                {Object.keys(metrics.fuelSalesByProduct).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(metrics.fuelSalesByProduct).map(([name, value]) => ({name, value}))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {Object.entries(metrics.fuelSalesByProduct).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => [`${value.toLocaleString('fr-FR')} Litres`]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">Aucune vente enregistrée</div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
