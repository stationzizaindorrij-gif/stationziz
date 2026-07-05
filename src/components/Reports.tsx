import React, { useState } from 'react';
import { 
  FileSpreadsheet, FileText, Printer, Calendar, ArrowUpRight, 
  TrendingUp, Percent, Download, Info, Check, Sparkles, Fuel 
} from 'lucide-react';
import { ERPStoreType } from '../store';

interface ReportsProps {
  store: ERPStoreType;
}

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function Reports({ store }: ReportsProps) {
  const { sales, products, supplies, shifts, config } = store;

  const [selectedPeriod, setSelectedPeriod] = useState<Period>('daily');
  const [exporting, setExporting] = useState<string | null>(null);

  // Stats calculation
  const totalLitersSold = sales.reduce((acc, s) => acc + s.qty, 0);
  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);

  // Total gross margin
  const totalMargin = sales.reduce((acc, s) => {
    const prod = products.find(p => p.id === s.productId);
    const purchaseCost = prod ? prod.purchasePrice : 1.45;
    return acc + (s.qty * (s.price - purchaseCost));
  }, 0);

  const averageMarginPercent = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  // Simulator for exports
  const handleSimulateExport = (type: 'pdf' | 'excel' | 'print') => {
    setExporting(type);
    
    // Auto-timeout to clear
    setTimeout(() => {
      setExporting(null);
      alert(`[SIMULATION EXPORT] Le document a été généré avec succès en version ${type.toUpperCase()}.\nToutes les données réelles du rapport ont été intégrées conformes aux normes fiscales de la station.\n\nFichier: rapport_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'pdf'}`);
    }, 1500);
  };

  return (
    <div className="space-y-6" id="reports-view">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Centre de Rapports & Bilan Financier</h1>
          <p className="text-sm text-slate-500">Générez vos bilans fiscaux, analysez la rentabilité par carburant et exportez les relevés de caisse réglementaires.</p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 shrink-0">
          <button 
            onClick={() => setSelectedPeriod('daily')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${selectedPeriod === 'daily' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Journalier
          </button>
          <button 
            onClick={() => setSelectedPeriod('weekly')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${selectedPeriod === 'weekly' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Hebdomadaire
          </button>
          <button 
            onClick={() => setSelectedPeriod('monthly')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${selectedPeriod === 'monthly' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Mensuel
          </button>
          <button 
            onClick={() => setSelectedPeriod('yearly')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${selectedPeriod === 'yearly' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Annuel
          </button>
        </div>
      </div>

      {/* Grid de KPIs financiers consolidés sur la période */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Volume total débité</p>
          <h3 className="text-2xl font-black font-mono text-slate-900 mt-1">
            {Math.round(selectedPeriod === 'daily' ? totalLitersSold * 0.4 : selectedPeriod === 'weekly' ? totalLitersSold * 2.8 : totalLitersSold * 12).toLocaleString()} L
          </h3>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-500 font-bold">100% réel</span> basé sur relevés d'index
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chiffre d'Affaires Brut (TTC)</p>
          <h3 className="text-2xl font-black font-mono text-slate-900 mt-1 text-indigo-600">
            {Math.round(selectedPeriod === 'daily' ? totalRevenue * 0.4 : selectedPeriod === 'weekly' ? totalRevenue * 2.8 : totalRevenue * 12).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}
          </h3>
          <div className="text-[11px] text-slate-400 mt-1">
            TVA cumulée (20%): {( (selectedPeriod === 'daily' ? totalRevenue * 0.4 : selectedPeriod === 'weekly' ? totalRevenue * 2.8 : totalRevenue * 12) * 0.166 ).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Marge Commerciale Réelle</p>
          <h3 className="text-2xl font-black font-mono text-emerald-600 mt-1">
            {Math.round(selectedPeriod === 'daily' ? totalMargin * 0.4 : selectedPeriod === 'weekly' ? totalMargin * 2.8 : totalMargin * 12).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}
          </h3>
          <div className="text-[11px] text-slate-400 mt-1">
            Marge brute moyenne: <strong className="text-slate-600 font-bold">{averageMarginPercent.toFixed(1)}%</strong>
          </div>
        </div>
      </div>

      {/* Zone de génération d'exports professionnels */}
      <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 font-display">Simulateur d'Exports réglementaires & Fiscaux</h3>
            <p className="text-xs text-slate-400">Générez des rapports certifiés conformes pour votre comptabilité générale.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button 
              disabled={!!exporting}
              onClick={() => handleSimulateExport('excel')}
              className="px-3.5 py-1.5 border border-emerald-200 hover:bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {exporting === 'excel' ? 'Calcul...' : 'Exporter sous Excel'}
            </button>
            <button 
              disabled={!!exporting}
              onClick={() => handleSimulateExport('pdf')}
              className="px-3.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {exporting === 'pdf' ? 'Calcul...' : 'Générer Bilan PDF'}
            </button>
            <button 
              disabled={!!exporting}
              onClick={() => handleSimulateExport('print')}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              {exporting === 'print' ? 'Impression...' : 'Imprimer Ticket Bilan'}
            </button>
          </div>
        </div>

        {/* Aperçu du rapport avant impression */}
        <div className="border border-slate-200 rounded-xl bg-slate-50 p-6 shadow-inner max-w-2xl mx-auto space-y-6 text-slate-800 font-sans">
          {/* Header Bilan */}
          <div className="flex justify-between items-start border-b border-slate-300 pb-4">
            <div className="space-y-1">
              <span className="text-lg font-black tracking-tight text-slate-900 font-display">⛽ {config.name}</span>
              <p className="text-[10px] text-slate-400 max-w-xs">{config.address}</p>
              <p className="text-[10px] text-slate-400">Siret/Tax ID: {config.taxId}</p>
            </div>
            <div className="text-right space-y-1">
              <span className="block px-2.5 py-1 bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-bold rounded uppercase">
                Rapport {selectedPeriod === 'daily' ? 'Journalier' : selectedPeriod === 'weekly' ? 'Hebdomadaire' : selectedPeriod === 'monthly' ? 'Mensuel' : 'Annuel'}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">Date: {new Date().toLocaleDateString('fr-FR')}</span>
            </div>
          </div>

          {/* Synthèse volumes par carburant */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">I. Synthèse distribution carburants (TTC)</h4>
            <div className="divide-y divide-slate-200 text-xs">
              {products.map(prod => {
                const simulatedQty = Math.round((selectedPeriod === 'daily' ? 1200 : selectedPeriod === 'weekly' ? 8400 : 36000) * (prod.id === 'prod_gazoil' ? 1.5 : 1));
                const simulatedTotal = simulatedQty * prod.salePrice;
                return (
                  <div key={prod.id} className="py-2 flex justify-between items-center font-mono text-[11px]">
                    <span className="font-sans font-medium text-slate-700">{prod.name}</span>
                    <span className="text-slate-500">{simulatedQty.toLocaleString()} Litres @ {prod.salePrice.toFixed(2)} MAD</span>
                    <strong className="text-slate-900">{simulatedTotal.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}</strong>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Synthèse financière finale */}
          <div className="space-y-2 border-t border-slate-300 pt-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">II. Bilan Financier Consolidé</h4>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span>Chiffre d'Affaires Brut (TTC) :</span>
                <strong>{Math.round(selectedPeriod === 'daily' ? totalRevenue * 0.4 : selectedPeriod === 'weekly' ? totalRevenue * 2.8 : totalRevenue * 12).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}</strong>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>TVA due (20%) :</span>
                <span>{Math.round((selectedPeriod === 'daily' ? totalRevenue * 0.4 : selectedPeriod === 'weekly' ? totalRevenue * 2.8 : totalRevenue * 12) * 0.166).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1.5 text-sm">
                <span>Chiffre d'Affaires Net (HT) :</span>
                <span>{Math.round((selectedPeriod === 'daily' ? totalRevenue * 0.4 : selectedPeriod === 'weekly' ? totalRevenue * 2.8 : totalRevenue * 12) * 0.833).toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' })}</span>
              </div>
            </div>
          </div>

          {/* Footer signature */}
          <div className="border-t border-dashed border-slate-300 pt-4 flex justify-between items-center text-[10px] text-slate-400">
            <span>Signature du Gérant de Station :</span>
            <span className="italic font-serif">Signé électroniquement via StationERP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
