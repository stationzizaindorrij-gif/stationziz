import React from 'react';
import { RichDocument } from './BillingTypes';
import { 
  TrendingUp, Clock, CheckCircle2,
  ArrowUpRight, BarChart3, Plus, FileSpreadsheet, Truck
} from 'lucide-react';

interface BillingDashboardProps {
  documents: RichDocument[];
  onCreateDocument: (type: 'client_devis' | 'client_facture' | 'client_bl' | 'supplier_devis_req' | 'supplier_br' | 'supplier_facture') => void;
}

export function BillingDashboard({ documents, onCreateDocument }: BillingDashboardProps) {
  
  // Calculate aggregate statistics for client documents only
  const clientDocs = documents.filter(d => ['client_devis', 'client_facture', 'client_bl'].includes(d.docType));
  const clientFactures = clientDocs.filter(d => d.docType === 'client_facture');

  const totalSalesTTC = clientFactures.reduce((sum, d) => sum + d.amountTTC, 0);

  const pendingClientInvoices = clientFactures.filter(d => d.status === 'pending');
  const pendingSalesAmount = pendingClientInvoices.reduce((sum, d) => sum + d.amountTTC, 0);

  const paidClientInvoices = clientFactures.filter(d => d.status === 'paid');
  const paidSalesAmount = paidClientInvoices.reduce((sum, d) => sum + d.amountTTC, 0);

  const devisCount = clientDocs.filter(d => d.docType === 'client_devis').length;
  const blCount = clientDocs.filter(d => d.docType === 'client_bl').length;

  // Calculate real monthly sales data for the chart (last 7 months)
  const monthsAbbr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const monthlyData: Record<string, { sales: number }> = {};
  
  const today = new Date();
  const currentMonthIndex = today.getMonth();
  const currentYear = today.getFullYear();
  
  for (let i = 6; i >= 0; i--) {
    let mIndex = currentMonthIndex - i;
    let y = currentYear;
    if (mIndex < 0) {
      mIndex += 12;
      y -= 1;
    }
    const key = `${monthsAbbr[mIndex]} ${y.toString().slice(2)}`;
    monthlyData[key] = { sales: 0 };
  }

  // Populate with real sales data
  documents.forEach(doc => {
    if (!doc.date || doc.docType !== 'client_facture') return;
    const d = new Date(doc.date);
    const mStr = `${monthsAbbr[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
    
    if (monthlyData[mStr] !== undefined) {
      monthlyData[mStr].sales += doc.amountTTC || 0;
    }
  });

  const months = Object.keys(monthlyData);
  const maxVal = Math.max(...months.map(m => monthlyData[m].sales), 100);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* 3 KPI Cards for Client Billing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* KPI 1 : Chiffre d'Affaires Total */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Facturation Clients (TTC)</span>
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{totalSalesTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</h3>
            <p className="text-xs text-slate-400 font-bold mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 font-black">{clientFactures.length} factures</span> émises au total
            </p>
          </div>
        </div>

        {/* KPI 2 : Encaissements Réglés */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Factures Réglées</span>
            <div className="p-2.5 bg-indigo-50 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{paidSalesAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</h3>
            <p className="text-xs text-slate-400 font-bold mt-1">
              <span className="text-indigo-600 font-black">{paidClientInvoices.length} factures</span> encaissées avec succès
            </p>
          </div>
        </div>

        {/* KPI 3 : Créances Clients (En attente) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Créances Clients</span>
            <div className="p-2.5 bg-amber-50 rounded-xl">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{pendingSalesAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</h3>
            <p className="text-xs text-slate-400 font-bold mt-1">
              <span className="text-amber-600 font-black">{pendingClientInvoices.length} factures</span> en attente de paiement
            </p>
          </div>
        </div>

      </div>

      {/* Main Section: Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-6">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              Évolutions Mensuelles des Ventes (MAD)
            </h4>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 bg-indigo-600 rounded-xs" />
                Facturation Ventes
              </span>
            </div>
          </div>

          {/* Pure HTML/CSS Interactive Bar Chart */}
          <div className="relative flex-1 w-full pt-4 px-2 min-h-[300px]">
            {/* Background grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pt-4 pb-[44px] pointer-events-none px-2 z-0">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full border-t border-slate-100" />
              ))}
            </div>

            <div className="relative z-10 h-full flex flex-col">
              <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 border-b border-slate-100">
                {months.map(m => {
                  const salesHeight = Math.max((monthlyData[m].sales / maxVal) * 100, 3); // min 3% height for visibility

                  return (
                    <div key={m} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer">
                      <div className="w-full max-w-[48px] flex items-end justify-center h-full relative">
                        
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 mb-3 z-20 whitespace-nowrap border border-slate-700/50">
                          <p className="font-black border-b border-slate-700 pb-1 mb-1 text-slate-300">{m}</p>
                          <p className="text-indigo-300 font-bold flex justify-between gap-4">
                            <span>Ventes :</span> 
                            <span>{monthlyData[m].sales.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</span>
                          </p>
                        </div>

                        {/* Sales bar */}
                        <div 
                          style={{ height: `${salesHeight}%` }} 
                          className="w-full bg-gradient-to-t from-indigo-600 to-indigo-500 group-hover:from-indigo-700 group-hover:to-indigo-600 rounded-t-lg transition-all duration-300 shadow-sm"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* X-Axis Labels */}
              <div className="h-11 flex items-center justify-between gap-2 sm:gap-4 pt-2">
                {months.map(m => (
                  <div key={m} className="flex-1 flex justify-center">
                    <span className="text-[10px] sm:text-xs font-black text-slate-400">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100">
            Actions Commerciales Rapides
          </h4>

          <div className="grid grid-cols-1 gap-3">
            
            {/* Create Client Invoice */}
            <button
              onClick={() => onCreateDocument('client_facture')}
              className="w-full text-left p-4 rounded-xl border border-slate-100 hover:border-indigo-100 bg-slate-50/50 hover:bg-indigo-50/20 transition-all flex items-start gap-4 group"
            >
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">Nouvelle Facture Client</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Établir une facture de vente avec TVA</span>
              </div>
            </button>

            {/* Create Quote */}
            <button
              onClick={() => onCreateDocument('client_devis')}
              className="w-full text-left p-4 rounded-xl border border-slate-100 hover:border-emerald-100 bg-slate-50/50 hover:bg-emerald-50/20 transition-all flex items-start gap-4 group"
            >
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">Nouveau Devis Client</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Envoyer une proposition commerciale</span>
              </div>
            </button>

            {/* Create Delivery Slip */}
            <button
              onClick={() => onCreateDocument('client_bl')}
              className="w-full text-left p-4 rounded-xl border border-slate-100 hover:border-blue-100 bg-slate-50/50 hover:bg-blue-50/20 transition-all flex items-start gap-4 group"
            >
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">Nouveau Bon de Livraison (BL)</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Générer un justificatif de dépôt</span>
              </div>
            </button>

          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Résumé des pièces client actives</span>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <span className="text-xs font-bold text-slate-500 block">Devis ouverts</span>
                <span className="text-lg font-black text-slate-700">{devisCount}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 block">Bons de livraison</span>
                <span className="text-lg font-black text-slate-700">{blCount}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
