import React from 'react';
import { RichDocument } from './BillingTypes';
import { 
  FileText, TrendingUp, TrendingDown, Clock, ShieldAlert,
  ArrowUpRight, ArrowDownRight, BarChart3, Plus, FileSpreadsheet, Truck
} from 'lucide-react';

interface BillingDashboardProps {
  documents: RichDocument[];
  onCreateDocument: (type: 'client_devis' | 'client_facture' | 'client_bl' | 'supplier_devis_req' | 'supplier_br' | 'supplier_facture') => void;
}

export function BillingDashboard({ documents, onCreateDocument }: BillingDashboardProps) {
  
  // Calculate aggregate statistics
  const clientDocs = documents.filter(d => ['client_devis', 'client_facture', 'client_bl'].includes(d.docType));
  const supplierDocs = documents.filter(d => ['supplier_devis_req', 'supplier_br', 'supplier_facture'].includes(d.docType));

  const clientFactures = clientDocs.filter(d => d.docType === 'client_facture');
  const supplierFactures = supplierDocs.filter(d => d.docType === 'supplier_facture');

  const totalSalesTTC = clientFactures.reduce((sum, d) => sum + d.amountTTC, 0);
  const totalPurchasesTTC = supplierFactures.reduce((sum, d) => sum + d.amountTTC, 0);

  const pendingClientInvoices = clientFactures.filter(d => d.status === 'pending');
  const pendingSalesAmount = pendingClientInvoices.reduce((sum, d) => sum + d.amountTTC, 0);

  const pendingSupplierInvoices = supplierFactures.filter(d => d.status === 'pending');
  const pendingPurchasesAmount = pendingSupplierInvoices.reduce((sum, d) => sum + d.amountTTC, 0);

  const devisCount = clientDocs.filter(d => d.docType === 'client_devis').length;
  const blCount = clientDocs.filter(d => d.docType === 'client_bl').length;

  // Monthly values for chart (simulated or parsed based on document dates)
  const monthlyData: Record<string, { sales: number; purchases: number }> = {
    'Jan': { sales: 45000, purchases: 32000 },
    'Féb': { sales: 52000, purchases: 39000 },
    'Mar': { sales: 61000, purchases: 48000 },
    'Avr': { sales: 58000, purchases: 42000 },
    'Mai': { sales: 75000, purchases: 51000 },
    'Jun': { sales: 92000, purchases: 65000 },
    'Jul': { sales: totalSalesTTC, purchases: totalPurchasesTTC }
  };

  // Adjust current month with actual document data if present
  if (totalSalesTTC > 0 || totalPurchasesTTC > 0) {
    monthlyData['Jul'] = {
      sales: totalSalesTTC,
      purchases: totalPurchasesTTC
    };
  }

  const months = Object.keys(monthlyData);
  const maxVal = Math.max(...months.flatMap(m => [monthlyData[m].sales, monthlyData[m].purchases]), 10000);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 : Chiffre d'Affaires */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Facturation Clients (TTC)</span>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{totalSalesTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</h3>
            <p className="text-xs text-slate-400 font-bold mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500">+12.4%</span> depuis le mois dernier
            </p>
          </div>
        </div>

        {/* KPI 2 : Factures Fournisseurs */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Achats Fournisseurs (TTC)</span>
            <div className="p-2 bg-rose-50 rounded-xl">
              <TrendingDown className="w-5 h-5 text-rose-500" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{totalPurchasesTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</h3>
            <p className="text-xs text-slate-400 font-bold mt-1 flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-rose-500">+4.1%</span> hausse des approvisionnements
            </p>
          </div>
        </div>

        {/* KPI 3 : Créances Clients (En attente) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Créances Clients</span>
            <div className="p-2 bg-amber-50 rounded-xl">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{pendingSalesAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</h3>
            <p className="text-xs text-slate-400 font-bold mt-1">
              <span className="text-amber-600 font-black">{pendingClientInvoices.length} factures</span> en attente de paiement
            </p>
          </div>
        </div>

        {/* KPI 4 : Dettes Fournisseurs (En attente) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Dettes Fournisseurs</span>
            <div className="p-2 bg-indigo-50 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-indigo-500" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{pendingPurchasesAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</h3>
            <p className="text-xs text-slate-400 font-bold mt-1">
              <span className="text-indigo-600 font-black">{pendingSupplierInvoices.length} factures</span> à régler
            </p>
          </div>
        </div>

      </div>

      {/* Main Section: Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              Comparatif mensuel Facturation vs Achats (MAD)
            </h4>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-xs" />
                Ventes
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 bg-rose-400 rounded-xs" />
                Achats
              </span>
            </div>
          </div>

          {/* Pure HTML/CSS Interactive Bar Chart */}
          <div className="h-64 flex items-end justify-between pt-4 px-2 gap-4">
            {months.map(m => {
              const salesHeight = (monthlyData[m].sales / maxVal) * 100;
              const purchasesHeight = (monthlyData[m].purchases / maxVal) * 100;

              return (
                <div key={m} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer">
                  <div className="w-full flex items-end justify-center gap-1.5 h-[85%] relative">
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 mb-2 z-10 whitespace-nowrap">
                      <p className="font-bold border-b border-slate-700 pb-0.5 mb-1">{m}</p>
                      <p className="text-indigo-300">Ventes: {monthlyData[m].sales.toLocaleString()} Dh</p>
                      <p className="text-rose-300">Achats: {monthlyData[m].purchases.toLocaleString()} Dh</p>
                    </div>

                    {/* Sales bar */}
                    <div 
                      style={{ height: `${salesHeight}%` }} 
                      className="w-4 bg-indigo-500 group-hover:bg-indigo-600 rounded-t-sm transition-all duration-300"
                    />
                    {/* Purchases bar */}
                    <div 
                      style={{ height: `${purchasesHeight}%` }} 
                      className="w-4 bg-rose-400 group-hover:bg-rose-500 rounded-t-sm transition-all duration-300"
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 mt-2">{m}</span>
                </div>
              );
            })}
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
                <span className="text-[10px] text-slate-400 block mt-0.5">Générer un justificatif de dépot</span>
              </div>
            </button>

            {/* Create Supplier Invoice */}
            <button
              onClick={() => onCreateDocument('supplier_facture')}
              className="w-full text-left p-4 rounded-xl border border-slate-100 hover:border-rose-100 bg-slate-50/50 hover:bg-rose-50/20 transition-all flex items-start gap-4 group"
            >
              <div className="p-3 bg-rose-50 rounded-xl text-rose-600 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">Facture Fournisseur Reçue</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Saisir un achat pour la comptabilité</span>
              </div>
            </button>

          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Résumé des pièces actives</span>
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
