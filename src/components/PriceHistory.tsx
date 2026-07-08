import React, { useState, useMemo } from 'react';
import { ERPStoreType } from '../store';
import { History, TrendingUp, TrendingDown, Calendar, Search, Tag, ArrowRight } from 'lucide-react';

interface PriceHistoryProps {
  store: ERPStoreType;
}

export default function PriceHistory({ store }: PriceHistoryProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Sort changes by date descending
  const sortedChanges = useMemo(() => {
    return [...(store.priceChanges || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [store.priceChanges]);

  // Determine the prices of each product on the selected date
  const pricesAtDate = useMemo(() => {
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
        // If no changes exist before the date, use current price as fallback (though ideally we'd track original price)
        prices[p.id] = {
          purchasePrice: p.purchasePrice,
          salePrice: p.salePrice
        };
      }
    });
    
    return prices;
  }, [store.products, sortedChanges, selectedDate]);

  
  const getPriceDifference = (oldPrice: number, newPrice: number) => {
    const diff = newPrice - oldPrice;
    if (diff === 0) return null;
    
    const isIncrease = diff > 0;
    return (
      <span className={`flex items-center text-xs font-bold ${isIncrease ? 'text-rose-500' : 'text-emerald-500'}`}>
        {isIncrease ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {Math.abs(diff).toFixed(2)} Dh
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <History className="w-7 h-7 text-indigo-600" />
            Historique des Prix
          </h2>
          <p className="text-slate-500 mt-1">Consultez l'évolution des prix d'achat et de vente de vos carburants.</p>
        </div>
      </div>

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
          </div>
        </div>

        {/* Right Column: History Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full min-h-[500px]">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Journal des modifications
            </h3>

            {sortedChanges.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <History className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="font-bold text-slate-700 mb-1">Aucun historique</h4>
                <p className="text-sm text-slate-500 max-w-sm">
                  Les changements de prix commenceront à s'afficher ici une fois que vous aurez modifié les prix des carburants.
                </p>
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {sortedChanges.map((change, idx) => {
                  const product = store.products.find(p => p.id === change.productId);
                  const isDateHeader = idx === 0 || sortedChanges[idx - 1].date.split('T')[0] !== change.date.split('T')[0];
                  
                  // Try to find the previous price from the change history, or assume it was the same if not found
                  const previousChangeForProduct = sortedChanges.slice(idx + 1).find(c => c.productId === change.productId);
                  
                  // For UI display
                  const oldPurchase = previousChangeForProduct ? previousChangeForProduct.purchasePrice : change.purchasePrice;
                  const oldSale = previousChangeForProduct ? previousChangeForProduct.salePrice : change.salePrice;
                  
                  return (
                    <div key={change.id}>
                      {isDateHeader && (
                        <div className="relative flex items-center justify-center mb-6">
                          <div className="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 z-10">
                            {new Date(change.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        </div>
                      )}
                      
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-6">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-100 text-indigo-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <Tag className="w-4 h-4" />
                        </div>
                        
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-800">{product ? product.name : 'Produit inconnu'}</span>
                            <span className="text-xs text-slate-400 font-mono">{new Date(change.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Achat</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm line-through text-slate-400">{oldPurchase.toFixed(2)}</span>
                                <ArrowRight className="w-3 h-3 text-slate-300" />
                                <span className="font-mono font-bold text-slate-700">{change.purchasePrice.toFixed(2)} Dh</span>
                              </div>
                              <div className="mt-1">
                                {getPriceDifference(oldPurchase, change.purchasePrice)}
                              </div>
                            </div>
                            <div>
                              <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Vente</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm line-through text-slate-400">{oldSale.toFixed(2)}</span>
                                <ArrowRight className="w-3 h-3 text-slate-300" />
                                <span className="font-mono font-bold text-indigo-600">{change.salePrice.toFixed(2)} Dh</span>
                              </div>
                              <div className="mt-1">
                                {getPriceDifference(oldSale, change.salePrice)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
