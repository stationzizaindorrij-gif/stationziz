import React, { useState, useMemo } from 'react';
import { ERPStoreType } from '../store';
import { History, TrendingUp, TrendingDown, Calendar, Search, Tag, ArrowRight } from 'lucide-react';

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
    console.log("selectedDate", selectedDate);
    console.log("sortedChanges", sortedChanges);
    const prices: Record<string, { purchasePrice: number, salePrice: number }> = {};
    
    store.products.forEach(p => {
      // Find the most recent price change for this product that is ON or BEFORE the selected date
      const changesForProduct = sortedChanges.filter(c => c.productId === p.id && c.date.split('T')[0] <= selectedDate);
      
      if (changesForProduct.length > 0) {
        // Since sortedChanges is descending, the first one is the most recent
        prices[p.id] = {
          purchasePrice: changesForProduct[0].purchasePrice,
          salePrice: changesForProduct[0].salePrice
        };
      } else {
        // Fallback if no history exists BEFORE this date
        const allChangesForProduct = sortedChanges.filter(c => c.productId === p.id);
        if (allChangesForProduct.length > 0) {
          const oldestChange = allChangesForProduct[allChangesForProduct.length - 1];
          prices[p.id] = {
            purchasePrice: oldestChange.oldPurchasePrice !== undefined ? oldestChange.oldPurchasePrice : p.purchasePrice,
            salePrice: oldestChange.oldSalePrice !== undefined ? oldestChange.oldSalePrice : p.salePrice
          };
        } else {
          prices[p.id] = {
            purchasePrice: p.purchasePrice,
            salePrice: p.salePrice
          };
        }
      }
    });
    
    return prices;
  }, [store.products, sortedChanges, selectedDate]);

  
  const getPriceDifference = (oldPrice: number, newPrice: number, type: 'purchase' | 'sale') => {
    const diff = newPrice - oldPrice;
    if (diff === 0) return null;
    
    const isIncrease = diff > 0;
    const colorClass = type === 'purchase' 
      ? (isIncrease ? 'text-rose-500' : 'text-emerald-500') 
      : (isIncrease ? 'text-emerald-500' : 'text-rose-500');

    return (
      <span className={`flex items-center text-xs font-bold ${colorClass}`}>
        {isIncrease ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {isIncrease ? '+' : '-'}{Math.abs(diff).toFixed(2)} Dh
      </span>
    );
  };

  return (
    <div className="space-y-6">


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Date selector and Prices at date */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Prix à une date précise
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
                    <div className="grid grid-cols-1 gap-4">
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
                <p className="text-sm font-medium text-slate-500">Sélectionnez une date pour voir les prix</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: History Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full min-h-[500px]">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Journal des modifications {selectedDate && `(${new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })})`}
            </h3>

            {(() => {
              if (!selectedDate) {
                return (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="w-8 h-8 text-slate-300" />
                    </div>
                    <h4 className="font-bold text-slate-700 mb-1">En attente</h4>
                    <p className="text-sm text-slate-500 max-w-sm">
                      Sélectionnez une date pour afficher l'historique des modifications.
                    </p>
                  </div>
                );
              }
              const filteredChanges = sortedChanges.filter(c => c.date.split('T')[0] === selectedDate);
              
              if (filteredChanges.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <History className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="font-bold text-slate-700 mb-1">Aucune modification</h4>
                    <p className="text-sm text-slate-500 max-w-sm">
                      Aucun changement de prix n'a été enregistré à cette date.
                    </p>
                  </div>
                );
              }
              
              return (
                <div className="space-y-4">
                  {filteredChanges.map((change) => {
                    const product = store.products.find(p => p.id === change.productId);
                    const previousChangeForProduct = sortedChanges.find(c => c.productId === change.productId && c.date < change.date);
                    
                    const oldSale = change.oldSalePrice !== undefined ? change.oldSalePrice : (previousChangeForProduct ? previousChangeForProduct.salePrice : change.salePrice);
                    
                    return (
                      <div key={change.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-300 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                            <Tag className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-base">{product ? product.name : 'Produit inconnu'}</h4>
                            <span className="text-xs text-slate-500 font-mono font-medium">{new Date(change.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 bg-slate-50 px-4 py-3 rounded-lg border border-slate-100">
                          <div className="flex flex-col min-w-[120px]">
                            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Prix de Vente</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs line-through text-slate-400">{oldSale.toFixed(2)}</span>
                              <ArrowRight className="w-3 h-3 text-slate-300" />
                              <span className="font-mono font-bold text-indigo-600">{change.salePrice.toFixed(2)} Dh</span>
                            </div>
                            <div className="mt-1">
                              {getPriceDifference(oldSale, change.salePrice, 'sale')}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
