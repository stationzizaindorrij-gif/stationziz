import React, { useState, useMemo } from 'react';
import { ERPStoreType } from '../store';
import { History, TrendingUp, TrendingDown, Calendar, Search, Tag, ArrowRight, Clock } from 'lucide-react';

interface PriceHistoryProps {
  store: ERPStoreType;
}

export default function PriceHistory({ store }: PriceHistoryProps) {
  const [selectedDate, setSelectedDate] = useState('');
  
  // Sort changes by date descending
  const sortedChanges = useMemo(() => {
    return [...(store.priceChanges || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [store.priceChanges]);

  // Determine the prices of each product on the selected date
  const pricesAtDate = useMemo(() => {
    const prices: Record<string, { purchasePrice: number, salePrice: number }> = {};
    
    // Check if selectedDate is today or in the future
    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const isTodayOrFuture = selectedDate >= todayStr;
    
    store.products.forEach(p => {
      // If the selected date is today, the most accurate price is the current one in the products table!
      if (isTodayOrFuture) {
          prices[p.id] = {
              purchasePrice: p.purchasePrice,
              salePrice: p.salePrice
          };
          return;
      }
      
      // Find the most recent price change for this product that is ON or BEFORE the selected date
      const changesOnOrBefore = sortedChanges.filter(c => {
        const localDate = new Date(c.date);
        const localDateString = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        return c.productId === p.id && localDateString <= selectedDate;
      });
      
      if (changesOnOrBefore.length > 0) {
        // The most recent change on or before this date is the FIRST one in the descending array
        prices[p.id] = {
          purchasePrice: changesOnOrBefore[0].purchasePrice,
          salePrice: changesOnOrBefore[0].salePrice
        };
      } else {
        // If there are no changes on or before the selected date,
        // we take the old price of the oldest recorded change for this product.
        const allChangesForProduct = sortedChanges.filter(c => c.productId === p.id);
        if (allChangesForProduct.length > 0) {
          const oldestChange = allChangesForProduct[allChangesForProduct.length - 1];
          prices[p.id] = {
            purchasePrice: oldestChange.oldPurchasePrice !== undefined ? oldestChange.oldPurchasePrice : p.purchasePrice,
            salePrice: oldestChange.oldSalePrice !== undefined ? oldestChange.oldSalePrice : p.salePrice
          };
        } else {
          // No history at all, just return the current price
          prices[p.id] = {
            purchasePrice: p.purchasePrice,
            salePrice: p.salePrice
          };
        }
      }
    });
    
    return prices;
  }, [store.products, sortedChanges, selectedDate]);
  
  const changesToDisplay = useMemo(() => {
    if (!selectedDate) return sortedChanges;
    return sortedChanges.filter(c => {
      const localDate = new Date(c.date);
      const localDateString = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      return localDateString === selectedDate;
    });
  }, [sortedChanges, selectedDate]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Date selector and Prices at date */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 w-full">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Prix en vigueur à cette date
            </h3>
            
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Sélectionnez une date</label>
              <input 
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            {selectedDate ? (
            <div className="space-y-4">
              {store.products.map(p => {
                const prices = pricesAtDate[p.id];
                if (!prices) return null;
                
                return (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">{p.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">Prix Achat</span>
                        <span className="font-mono font-bold text-slate-700">{prices.purchasePrice.toFixed(2)} Dh</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">Prix Vente</span>
                        <span className="font-mono font-bold text-indigo-700">{prices.salePrice.toFixed(2)} Dh</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-500">Sélectionnez une date pour voir les prix appliqués</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline of changes */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 w-full">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            {selectedDate ? `Changements effectués le ${selectedDate.split('-').reverse().join('/')}` : 'Historique complet des changements'}
          </h3>
          
          <div className="space-y-4">
            {changesToDisplay.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <History className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-500">Aucun changement de prix {selectedDate ? 'à cette date' : 'enregistré'}</p>
              </div>
            ) : (
              changesToDisplay.map((change) => {
                const product = store.products.find(p => p.id === change.productId);
                if (!product) return null;
                const changeDate = new Date(change.date);
                
                const purchaseDiff = change.purchasePrice - (change.oldPurchasePrice || 0);
                const saleDiff = change.salePrice - (change.oldSalePrice || 0);
                
                return (
                  <div key={change.id} className="p-4 border border-slate-100 rounded-xl hover:shadow-md transition-shadow bg-slate-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="font-bold text-slate-800 block">{product.name}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {changeDate.toLocaleDateString('fr-FR')} à {changeDate.toLocaleTimeString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {change.oldPurchasePrice !== change.purchasePrice && (
                        <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Achat</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500 line-through">{(change.oldPurchasePrice || 0).toFixed(2)}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="text-sm font-bold text-slate-700">{change.purchasePrice.toFixed(2)}</span>
                            {purchaseDiff > 0 ? (
                              <TrendingUp className="w-3 h-3 text-rose-500 ml-auto" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-emerald-500 ml-auto" />
                            )}
                          </div>
                        </div>
                      )}
                      
                      {change.oldSalePrice !== change.salePrice && (
                        <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                          <span className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Vente</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500 line-through">{(change.oldSalePrice || 0).toFixed(2)}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="text-sm font-bold text-indigo-600">{change.salePrice.toFixed(2)}</span>
                            {saleDiff > 0 ? (
                              <TrendingUp className="w-3 h-3 text-emerald-500 ml-auto" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-rose-500 ml-auto" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
