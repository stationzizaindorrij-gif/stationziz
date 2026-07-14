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
    const prices: Record<string, { purchasePrice: number, salePrice: number }> = {};
    
    store.products.forEach(p => {
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
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        
        {/* Date selector and Prices at date */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-3xl mx-auto w-full">
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
                <p className="text-sm font-medium text-slate-500">Sélectionnez une date pour voir les prix</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
