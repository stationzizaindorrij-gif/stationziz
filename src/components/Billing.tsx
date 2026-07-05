import React, { useState, useRef } from 'react';
import { Activity, Paperclip,  
  FileText, TrendingUp, Users, Truck, Plus, Search, Filter, 
  Download, FileCheck, XCircle, CheckCircle2, Factory, FileSpreadsheet,
  Calendar, FileBox, FileArchive, Printer, X, Eye, Edit, Copy, Trash2, Mail
 } from 'lucide-react';
import { ERPStoreType } from '../store';
import { Supplier, Client, PurchaseInvoice, SalesInvoice } from '../types';
import html2pdf from 'html2pdf.js';

export function Billing({ store }: { store: ERPStoreType }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'purchase' | 'sales' | 'suppliers' | 'history'>('dashboard');
  
  const [showPartnerModal, setShowPartnerModal] = useState<'supplier'|'client'|null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<(PurchaseInvoice | SalesInvoice) & { type: 'purchase' | 'sale' } | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<(PurchaseInvoice | SalesInvoice) & { type: 'purchase' | 'sale' } | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'purchase' | 'sale'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'validated'>('all');
  
  const printRef = useRef<HTMLDivElement>(null);


  const filteredInvoices = [...store.purchaseInvoices.map(i => ({ ...i, type: 'purchase' as const })), ...store.salesInvoices.map(i => ({ ...i, type: 'sale' as const }))]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(inv => {
      if (filterType !== 'all' && inv.type !== filterType) return false;
      if (filterStatus !== 'all') {
        const status = inv.type === 'purchase' ? (inv as any).status : 'paid'; // simplify sales as paid
        if (filterStatus === 'validated') {
          if (inv.type !== 'sale') return false;
        } else {
          if (status !== filterStatus) return false;
        }
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const partnerName = inv.type === 'purchase' 
          ? store.suppliers.find(s => s.id === (inv as PurchaseInvoice).supplierId)?.name
          : store.clients.find(c => c.id === (inv as SalesInvoice).clientId)?.name;
        const productName = store.products.find(p => p.id === inv.productId)?.name;
        
        return inv.invoiceNumber.toLowerCase().includes(q) || 
               (partnerName || '').toLowerCase().includes(q) || 
               (productName || '').toLowerCase().includes(q) ||
               inv.date.includes(q);
      }
      return true;
    });

  const handleDuplicate = (inv: any) => {
    const duplicated = { ...inv, invoiceNumber: inv.invoiceNumber + '-COPY' };
    delete duplicated.id;
    if (inv.type === 'purchase') {
      store.addPurchaseInvoice(duplicated, 'Admin');
    } else {
      store.addSalesInvoice(duplicated, 'Admin');
    }
  };

  const handleDelete = (inv: any) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette facture ?')) {
      if (inv.type === 'purchase') {
        store.deletePurchaseInvoice(inv.id, 'Admin');
      } else {
        store.deleteSalesInvoice(inv.id, 'Admin');
      }
    }
  };

  const exportToExcel = () => {
    // simple CSV export for MVP
    let csv = "Date,Type,N° Facture,Partenaire,Montant TTC,Statut\n";
    filteredInvoices.forEach(inv => {
      const isPurchase = inv.type === 'purchase';
      const partnerName = isPurchase 
        ? store.suppliers.find(s => s.id === (inv as PurchaseInvoice).supplierId)?.name
        : store.clients.find(c => c.id === (inv as SalesInvoice).clientId)?.name;
      const status = isPurchase ? ((inv as any).status === 'paid' ? 'Payée' : 'En attente') : 'Validée';
      csv += `${inv.date},${isPurchase ? 'Achat' : 'Vente'},${inv.invoiceNumber},${partnerName || ''},${inv.amountTTC},${status}
`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'factures.csv';
    link.click();
  };

  const downloadPDF = async (invoiceId?: string) => {
    if (!printRef.current) return;
    const element = printRef.current;
    
    // Si on veut imprimer une facture spécifique
    const opt = {
      margin: 10,
      filename: invoiceId ? `Facture-${invoiceId}.pdf` : 'Factures.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    html2pdf().from(element).set(opt).save();
  };

  const stats = {
    totalPurchases: store.purchaseInvoices.reduce((sum, inv) => sum + inv.amountTTC, 0),
    totalSales: store.salesInvoices.reduce((sum, inv) => sum + inv.amountTTC, 0),
    invoiceCount: store.purchaseInvoices.length + store.salesInvoices.length,
    topSupplier: store.suppliers[0]?.name || 'N/A' // simplistic
  };

  const handlePartnerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const partner = {
      name: fd.get('name') as string,
      phone: fd.get('phone') as string,
      email: fd.get('email') as string,
      address: fd.get('address') as string,
      ice: fd.get('ice') as string,
      contact: fd.get('contact') as string,
      notes: fd.get('notes') as string,
    };
    if (showPartnerModal === 'supplier') {
      store.addSupplier(partner, 'Admin');
    } else {
      store.addClient(partner, 'Admin');
    }
    setShowPartnerModal(null);
  };

  const handlePurchaseSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    const qty = parseFloat(fd.get('quantity') as string);
    const price = parseFloat(fd.get('price') as string);
    const amountHT = qty * price;
    const vatAmount = amountHT * 0.2; // roughly 20%
    const amountTTC = amountHT + vatAmount;

    const invoiceData = {
      invoiceNumber: fd.get('invoiceNumber') as string,
      supplierId: fd.get('supplierId') as string,
      date: fd.get('date') as string,
      productId: fd.get('productId') as string,
      tankId: fd.get('tankId') as string,
      quantity: qty,
      pricePerLiter: price,
      amountHT,
      vatAmount,
      amountTTC,
      paymentMethod: fd.get('paymentMethod') as string,
      status: fd.get('status') as any,
      deliverySlip: fd.get('deliverySlip') as string,
      observations: fd.get('observations') as string,
      userId: 'Admin'
    };

    if (editingInvoice && editingInvoice.type === 'purchase') {
      store.updatePurchaseInvoice(editingInvoice.id, invoiceData, 'Admin');
    } else {
      store.addPurchaseInvoice(invoiceData, 'Admin');
    }
    
    setShowPurchaseModal(false);
    setEditingInvoice(null);
  };

  const handleSalesSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    const qty = parseFloat(fd.get('quantity') as string);
    const price = parseFloat(fd.get('price') as string);
    const amountHT = qty * price;
    const vatAmount = amountHT * 0.2; 
    const amountTTC = amountHT + vatAmount;

    const invoiceData = {
      invoiceNumber: fd.get('invoiceNumber') as string,
      clientId: fd.get('clientId') as string,
      date: fd.get('date') as string,
      productId: fd.get('productId') as string,
      quantity: qty,
      pricePerLiter: price,
      amountHT,
      vatAmount,
      amountTTC,
      paymentMethod: fd.get('paymentMethod') as string,
      userId: 'Admin'
    };

    if (editingInvoice && editingInvoice.type === 'sale') {
      store.updateSalesInvoice(editingInvoice.id, invoiceData, 'Admin');
    } else {
      store.addSalesInvoice(invoiceData, 'Admin');
    }

    setShowSalesModal(false);
    setEditingInvoice(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Facturation & Achats</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Gérez vos factures d'achat, de vente et vos fournisseurs</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          <TrendingUp className="w-4 h-4" />
          Tableau de bord
        </button>
        <button 
          onClick={() => setActiveTab('purchase')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'purchase' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          <FileArchive className="w-4 h-4" />
          Factures d'Achat
        </button>
        <button 
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'sales' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Factures de Vente
        </button>
        <button 
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'suppliers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          <Truck className="w-4 h-4" />
          Partenaires
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          <Search className="w-4 h-4" />
          Historique
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 text-slate-500 mb-2">
                <FileArchive className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Total Achats (TTC)</span>
              </div>
              <p className="text-2xl font-black text-slate-800">{stats.totalPurchases.toLocaleString('fr-FR', {minimumFractionDigits: 2})} MAD</p>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 text-slate-500 mb-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Total Ventes (TTC)</span>
              </div>
              <p className="text-2xl font-black text-slate-800">{stats.totalSales.toLocaleString('fr-FR', {minimumFractionDigits: 2})} MAD</p>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 text-slate-500 mb-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Factures</span>
              </div>
              <p className="text-2xl font-black text-slate-800">{stats.invoiceCount}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 text-slate-500 mb-2">
                <Factory className="w-5 h-5 text-purple-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Top Fournisseur</span>
              </div>
              <p className="text-lg font-black text-slate-800 truncate">{stats.topSupplier}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'purchase' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800">Factures d'Achat</h3>
            <button 
              onClick={() => setShowPurchaseModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Saisir Facture
            </button>
          </div>
          
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">N° Facture</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Fournisseur</th>
                  <th className="p-4">Produit</th>
                  <th className="p-4 text-right">Quantité</th>
                  <th className="p-4 text-right">Montant TTC</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {store.purchaseInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      <FileArchive className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">Aucune facture d'achat pour le moment</p>
                    </td>
                  </tr>
                ) : (
                  store.purchaseInvoices.map(inv => {
                    const sup = store.suppliers.find(s => s.id === inv.supplierId);
                    const prod = store.products.find(p => p.id === inv.productId);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="p-4 font-bold"><button onClick={() => setSelectedInvoice({...inv, type: inv.clientId ? 'sales' : 'purchase'})} className="text-indigo-600 hover:text-indigo-800 hover:underline">{inv.invoiceNumber}</button></td>
                        <td className="p-4 text-slate-500">{inv.date}</td>
                        <td className="p-4 font-bold text-slate-800">{sup?.name}</td>
                        <td className="p-4 text-slate-600">{prod?.name}</td>
                        <td className="p-4 text-right text-slate-600">{inv.quantity.toLocaleString()} L</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-800">{inv.amountTTC.toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {inv.status === 'paid' ? 'Payée' : 'En attente'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setSelectedInvoice({...inv, type: 'purchase'})} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Voir">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEditingInvoice({...inv, type: 'purchase'}); setShowPurchaseModal(true); }} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded" title="Modifier">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedInvoice({...inv, type: 'purchase'}); setTimeout(() => downloadPDF(inv.invoiceNumber), 100); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="PDF">
                              <Download className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedInvoice({...inv, type: 'purchase'}); setTimeout(() => window.print(), 100); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Imprimer">
                              <Printer className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDuplicate({...inv, type: 'purchase'})} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Dupliquer">
                              <Copy className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete({...inv, type: 'purchase'})} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800">Factures de Vente (Pro)</h3>
            <button 
              onClick={() => setShowSalesModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Générer Facture
            </button>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">N° Facture</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Produit</th>
                  <th className="p-4 text-right">Quantité</th>
                  <th className="p-4 text-right">Montant TTC</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {store.salesInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">Aucune facture de vente générée</p>
                    </td>
                  </tr>
                ) : (
                  store.salesInvoices.map(inv => {
                    const cli = store.clients.find(c => c.id === inv.clientId);
                    const prod = store.products.find(p => p.id === inv.productId);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="p-4 font-bold"><button onClick={() => setSelectedInvoice({...inv, type: inv.clientId ? 'sales' : 'purchase'})} className="text-indigo-600 hover:text-indigo-800 hover:underline">{inv.invoiceNumber}</button></td>
                        <td className="p-4 text-slate-500">{inv.date}</td>
                        <td className="p-4 font-bold text-slate-800">{cli?.name}</td>
                        <td className="p-4 text-slate-600">{prod?.name}</td>
                        <td className="p-4 text-right text-slate-600">{inv.quantity.toLocaleString()} L</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-800">{inv.amountTTC.toFixed(2)}</td>
                        
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setSelectedInvoice({...inv, type: 'sales'})} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Voir">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEditingInvoice({...inv, type: 'sales'}); setShowSalesModal(true); }} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded" title="Modifier">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedInvoice({...inv, type: 'sales'}); setTimeout(() => downloadPDF(inv.invoiceNumber), 100); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="PDF">
                              <Download className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedInvoice({...inv, type: 'sales'}); setTimeout(() => window.print(), 100); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Imprimer">
                              <Printer className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDuplicate({...inv, type: 'sales'})} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Dupliquer">
                              <Copy className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete({...inv, type: 'sales'})} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'suppliers' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800">Fournisseurs & Clients Pro</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowPartnerModal('supplier')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Fournisseur
              </button>
              <button 
                onClick={() => setShowPartnerModal('client')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Client
              </button>
            </div>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Type</th>
                  <th className="p-4">Nom</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">ICE / IF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {store.suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4"><span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">Fournisseur</span></td>
                    <td className="p-4 font-bold text-slate-800">{s.name}</td>
                    <td className="p-4 text-slate-600">{s.phone}<br/><span className="text-xs text-slate-400">{s.email}</span></td>
                    <td className="p-4 text-slate-600 font-mono">{s.ice}</td>
                  </tr>
                ))}
                {store.clients.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">Client Pro</span></td>
                    <td className="p-4 font-bold text-slate-800">{c.name}</td>
                    <td className="p-4 text-slate-600">{c.phone}<br/><span className="text-xs text-slate-400">{c.email}</span></td>
                    <td className="p-4 text-slate-600 font-mono">{c.ice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800">Historique des Opérations</h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 w-full md:w-64"
                />
              </div>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value as any)}
                className="p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
              >
                <option value="all">Tous les types</option>
                <option value="purchase">Achats</option>
                <option value="sale">Ventes</option>
              </select>
              <button onClick={exportToExcel} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-bold transition-colors">
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
            </div>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">N° Facture</th>
                  <th className="p-4">Partenaire</th>
                  <th className="p-4 text-right">Montant TTC</th>
                  <th className="p-4 text-center">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map(inv => {
                    const isPurchase = inv.type === 'purchase';
                    const partnerName = isPurchase 
                      ? store.suppliers.find(s => s.id === (inv as PurchaseInvoice).supplierId)?.name
                      : store.clients.find(c => c.id === (inv as SalesInvoice).clientId)?.name;
                      
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-500">{inv.date}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${isPurchase ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {isPurchase ? 'Achat' : 'Vente Pro'}
                          </span>
                        </td>
                        <td className="p-4 font-bold"><button onClick={() => setSelectedInvoice(inv)} className="text-indigo-600 hover:text-indigo-800 hover:underline">{inv.invoiceNumber}</button></td>
                        <td className="p-4 text-slate-800">{partnerName}</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-800">{inv.amountTTC.toFixed(2)} MAD</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${isPurchase ? ((inv as any).status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700') : 'bg-emerald-100 text-emerald-700'}`}>
                            {isPurchase ? ((inv as any).status === 'paid' ? 'Payée' : 'En attente') : 'Validée'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Voir">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEditingInvoice(inv); isPurchase ? setShowPurchaseModal(true) : setShowSalesModal(true); setSelectedInvoice(null); }} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded" title="Modifier">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedInvoice(inv); setTimeout(() => downloadPDF(inv.invoiceNumber), 100); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="PDF">
                              <Download className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedInvoice(inv); setTimeout(() => window.print(), 100); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Imprimer">
                              <Printer className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDuplicate(inv)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Dupliquer">
                              <Copy className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(inv)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      
      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-[#0f172a80] backdrop-blur-sm flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:relative print:z-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-[#f8fafc80] print:hidden">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" /> 
                Détails de la Facture
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditingInvoice(selectedInvoice); selectedInvoice.type === 'purchase' ? setShowPurchaseModal(true) : setShowSalesModal(true); setSelectedInvoice(null); }} className="px-3 py-1.5 text-sm font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg flex items-center gap-2">
                  <Edit className="w-4 h-4" /> Modifier
                </button>
                <button onClick={() => downloadPDF(selectedInvoice.invoiceNumber)} className="px-3 py-1.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-2">
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button onClick={() => window.print()} className="px-3 py-1.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Imprimer
                </button>
                <button onClick={() => { handleDuplicate(selectedInvoice); setSelectedInvoice(null); }} className="px-3 py-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-2">
                  <Copy className="w-4 h-4" /> Dupliquer
                </button>
                <button onClick={() => { handleDelete(selectedInvoice); setSelectedInvoice(null); }} className="px-3 py-1.5 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Supprimer
                </button>
                <button onClick={() => alert('Ouverture du client mail...')} className="px-3 py-1.5 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600 p-1 ml-2">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-[#f8fafc80] print:p-0 print:bg-white" ref={printRef}>
              {/* === ERP DETAIL VIEW (Screen Only) === */}
              <div className="p-6 space-y-6 print:hidden max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Info Card */}
                  <div className="col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Informations Générales</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 block mb-1">Partenaire</span>
                        <div className="font-bold text-slate-800 text-base">
                          {selectedInvoice.type === 'purchase' 
                            ? store.suppliers.find(s => s.id === selectedInvoice.supplierId)?.name 
                            : store.clients.find(c => c.id === selectedInvoice.clientId)?.name}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Date de facturation</span>
                        <div className="font-medium text-slate-800">{selectedInvoice.date}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Type</span>
                        <div className="font-medium text-slate-800">
                          {selectedInvoice.type === 'purchase' ? 'Facture Fournisseur' : 'Facture Client'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Statut</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${selectedInvoice.type === 'purchase' ? ((selectedInvoice as any).status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700') : 'bg-emerald-100 text-emerald-700'}`}>
                          {selectedInvoice.type === 'purchase' ? ((selectedInvoice as any).status === 'paid' ? 'Payée' : 'En attente') : 'Validée'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Résumé Financier</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Total HT</span>
                        <span className="font-medium">{selectedInvoice.amountHT.toFixed(2)} MAD</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">TVA (20%)</span>
                        <span className="font-medium">{selectedInvoice.vatAmount.toFixed(2)} MAD</span>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                        <span className="font-bold text-slate-800">Total TTC</span>
                        <span className="font-black text-lg text-indigo-600">{selectedInvoice.amountTTC.toFixed(2)} MAD</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-[#f8fafc80]">
                    <h4 className="font-bold text-slate-800">Lignes de facturation</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-white border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-4">Produit / Description</th>
                          <th className="p-4 text-right">Quantité</th>
                          <th className="p-4 text-right">Prix Unitaire HT</th>
                          <th className="p-4 text-right">TVA</th>
                          <th className="p-4 text-right">Montant HT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        <tr className="hover:bg-[#f8fafc80]">
                          <td className="p-4 font-medium text-slate-800">
                            {store.products.find(p => p.id === selectedInvoice.productId)?.name || 'Produit inconnu'}
                          </td>
                          <td className="p-4 text-right text-slate-600">{selectedInvoice.quantity.toLocaleString()}</td>
                          <td className="p-4 text-right text-slate-600">{selectedInvoice.pricePerLiter.toFixed(2)}</td>
                          <td className="p-4 text-right text-slate-600">20%</td>
                          <td className="p-4 text-right font-mono font-bold text-slate-700">{selectedInvoice.amountHT.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Additional Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Historique */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <h4 className="font-bold text-slate-800">Historique & Suivi</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex gap-3 relative before:absolute before:top-2 before:bottom-0 before:left-1.5 before:w-px before:bg-slate-200">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-white z-10 mt-1"></div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">Facture créée</p>
                          <p className="text-xs text-slate-500">{selectedInvoice.date} - Par Administrateur</p>
                        </div>
                      </div>
                      {selectedInvoice.type === 'purchase' && (selectedInvoice as any).status === 'paid' && (
                        <div className="flex gap-3 relative">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white z-10 mt-1"></div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">Paiement enregistré</p>
                            <p className="text-xs text-slate-500">Par virement bancaire</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pièces Jointes */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-slate-400" />
                        <h4 className="font-bold text-slate-800">Pièces Jointes</h4>
                      </div>
                      <button className="text-indigo-600 hover:text-indigo-700 text-xs font-bold">Ajouter</button>
                    </div>
                    <div className="flex items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-lg bg-[#f8fafc80] text-slate-400">
                      <p className="text-sm text-center">Aucun document attaché<br/>Générez le PDF pour l'ajouter ici</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* === PDF PRINT VIEW (Hidden on screen, visible on print) === */}
              <div className="hidden print:block max-w-3xl mx-auto space-y-8 w-full p-8">
              <div className="max-w-3xl mx-auto space-y-8 print:w-full">
                
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">FACTURE</h1>
                    <p className="text-slate-500 font-mono mt-1">N° {selectedInvoice.invoiceNumber}</p>
                    <p className="text-sm text-slate-500 mt-1">Date: {selectedInvoice.date}</p>
                    <div className="mt-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${selectedInvoice.type === 'purchase' ? ((selectedInvoice as any).status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700') : 'bg-emerald-100 text-emerald-700'}`}>
                        {selectedInvoice.type === 'purchase' ? ((selectedInvoice as any).status === 'paid' ? 'Payée' : 'En attente') : 'Validée'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {/* Placeholder Logo */}
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center ml-auto mb-2">
                      <Factory className="w-8 h-8 text-slate-300" />
                    </div>
                    <h2 className="font-bold text-slate-800 text-lg">STATION ERP</h2>
                    <p className="text-sm text-slate-500">123 Route Nationale<br/>Casablanca, Maroc</p>
                    <p className="text-sm text-slate-500 mt-1">ICE: 012345678900011</p>
                  </div>
                </div>

                <div className="h-px bg-slate-200 w-full" />

                {/* Addresses */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Émetteur</h3>
                    {selectedInvoice.type === 'purchase' ? (
                      <div className="text-slate-800">
                        <p className="font-bold text-lg">{store.suppliers.find(s => s.id === (selectedInvoice as PurchaseInvoice).supplierId)?.name}</p>
                        <p className="text-sm text-slate-600 mt-1">{store.suppliers.find(s => s.id === (selectedInvoice as PurchaseInvoice).supplierId)?.address || 'Adresse non renseignée'}</p>
                        <p className="text-sm text-slate-600">ICE: <span className="font-mono">{store.suppliers.find(s => s.id === (selectedInvoice as PurchaseInvoice).supplierId)?.ice}</span></p>
                      </div>
                    ) : (
                      <div className="text-slate-800">
                        <p className="font-bold text-lg">STATION ERP</p>
                        <p className="text-sm text-slate-600 mt-1">123 Route Nationale<br/>Casablanca, Maroc</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Destinataire</h3>
                    {selectedInvoice.type === 'sale' ? (
                      <div className="text-slate-800">
                        <p className="font-bold text-lg">{store.clients.find(c => c.id === (selectedInvoice as SalesInvoice).clientId)?.name}</p>
                        <p className="text-sm text-slate-600 mt-1">{store.clients.find(c => c.id === (selectedInvoice as SalesInvoice).clientId)?.address || 'Adresse non renseignée'}</p>
                        <p className="text-sm text-slate-600">ICE: <span className="font-mono">{store.clients.find(c => c.id === (selectedInvoice as SalesInvoice).clientId)?.ice}</span></p>
                      </div>
                    ) : (
                      <div className="text-slate-800">
                        <p className="font-bold text-lg">STATION ERP</p>
                        <p className="text-sm text-slate-600 mt-1">123 Route Nationale<br/>Casablanca, Maroc</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4">Désignation</th>
                        <th className="p-4 text-right">Quantité</th>
                        <th className="p-4 text-right">Prix Unitaire HT</th>
                        <th className="p-4 text-right">Total HT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-4 text-slate-800 font-bold">{store.products.find(p => p.id === selectedInvoice.productId)?.name}</td>
                        <td className="p-4 text-right font-mono text-slate-600">{selectedInvoice.quantity.toLocaleString()} L</td>
                        <td className="p-4 text-right font-mono text-slate-600">{selectedInvoice.pricePerLiter.toFixed(2)}</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-800">{selectedInvoice.amountHT.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-3">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Total HT</span>
                      <span className="font-mono">{selectedInvoice.amountHT.toFixed(2)} MAD</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>TVA (20%)</span>
                      <span className="font-mono">{selectedInvoice.vatAmount.toFixed(2)} MAD</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between font-black text-slate-800 text-lg">
                      <span>Total TTC</span>
                      <span className="font-mono">{selectedInvoice.amountTTC.toFixed(2)} MAD</span>
                    </div>
                  </div>
                </div>

                {/* Footer / Info */}
                <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-sm text-slate-600">
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">Informations de paiement</h4>
                    <p>Mode: <span className="font-bold uppercase">{selectedInvoice.paymentMethod}</span></p>
                    {(selectedInvoice as any).observations && (
                      <div className="mt-4">
                        <h4 className="font-bold text-slate-800 mb-1">Observations</h4>
                        <p className="italic text-slate-500">{(selectedInvoice as any).observations}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="w-32 h-32 border-2 border-dashed border-slate-200 rounded-xl ml-auto flex items-center justify-center">
                      <span className="text-xs text-slate-400 font-bold uppercase">Cachet & Signature</span>
                    </div>
                  </div>
                </div>

              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Partner Modal */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-[#0f172a80] backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-[#f8fafc80]">
              <h3 className="font-black text-slate-800 text-lg">
                Ajouter un {showPartnerModal === 'supplier' ? 'Fournisseur' : 'Client Pro'}
              </h3>
              <button onClick={() => setShowPartnerModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="partnerForm" onSubmit={handlePartnerSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nom de l'entreprise</label>
                  <input name="name" type="text" required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Ex: TotalEnergies" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Téléphone</label>
                    <input name="phone" type="text" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="+212..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                    <input name="email" type="email" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="contact@..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">ICE / IF</label>
                    <input name="ice" type="text" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nom du contact</label>
                    <input name="contact" type="text" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Adresse</label>
                  <input name="address" type="text" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Observations</label>
                  <textarea name="notes" rows={2} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowPartnerModal(null)}
                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors text-sm"
              >
                Annuler
              </button>
              <button 
                type="submit"
                form="partnerForm"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors text-sm"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Invoice Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-[#0f172a80] backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-[#f8fafc80]">
              <h3 className="font-black text-slate-800 text-lg">
                {editingInvoice ? 'Modifier Facture d\'Achat' : 'Saisir une Facture d\'Achat'}
              </h3>
              <button onClick={() => { setShowPurchaseModal(false); setEditingInvoice(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="purchaseForm" onSubmit={handlePurchaseSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">N° Facture</label>
                    <input name="invoiceNumber" type="text" defaultValue={editingInvoice?.invoiceNumber || ''} required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="FA-2026-001" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                    <input name="date" type="date" required defaultValue={editingInvoice?.date || new Date().toISOString().split('T')[0]} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Fournisseur</label>
                  <select name="supplierId" defaultValue={(editingInvoice as PurchaseInvoice)?.supplierId || ''} required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white">
                    <option value="">Sélectionnez un fournisseur</option>
                    {store.suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.ice})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Produit</label>
                    <select name="productId" defaultValue={editingInvoice?.productId || ''} required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white">
                      <option value="">Sélectionnez un produit</option>
                      {store.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Cuve de réception</label>
                    <select name="tankId" defaultValue={(editingInvoice as PurchaseInvoice)?.tankId || ''} required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white">
                      <option value="">Sélectionnez la cuve</option>
                      {store.tanks.map(t => <option key={t.id} value={t.id}>{t.number} ({t.productName})</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Quantité (L)</label>
                    <input name="quantity" type="number" step="any" defaultValue={editingInvoice?.quantity || ''} required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Prix unitaire (HT)</label>
                    <input name="price" type="number" step="any" defaultValue={editingInvoice?.pricePerLiter || ''} required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="0.00" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Mode de paiement</label>
                    <select name="paymentMethod" defaultValue={editingInvoice?.paymentMethod || 'virement'} required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white">
                      <option value="virement">Virement Bancaire</option>
                      <option value="cheque">Chèque</option>
                      <option value="traite">Traite (LCR)</option>
                      <option value="especes">Espèces</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Statut</label>
                    <select name="status" defaultValue={(editingInvoice as PurchaseInvoice)?.status || 'pending'} required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white">
                      <option value="pending">En attente de paiement</option>
                      <option value="paid">Payée</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between gap-3">
              <p className="text-xs text-slate-500 self-center">
                <span className="font-bold text-indigo-600">Info :</span> La validation de cette facture augmentera automatiquement le stock de la cuve sélectionnée.
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setShowPurchaseModal(false); setEditingInvoice(null); }}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors text-sm"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  form="purchaseForm"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors text-sm"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Invoice Modal */}
      {showSalesModal && (
        <div className="fixed inset-0 bg-[#0f172a80] backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-[#f8fafc80]">
              <h3 className="font-black text-slate-800 text-lg">
                Générer Facture de Vente
              </h3>
              <button onClick={() => { setShowSalesModal(false); setEditingInvoice(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="salesForm" onSubmit={handleSalesSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">N° Facture</label>
                    <input name="invoiceNumber" type="text" required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder={`FV-${new Date().getFullYear()}-${String(store.salesInvoices.length + 1).padStart(3, '0')}`} defaultValue={`FV-${new Date().getFullYear()}-${String(store.salesInvoices.length + 1).padStart(3, '0')}`} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                    <input name="date" type="date" required defaultValue={editingInvoice?.date || new Date().toISOString().split('T')[0]} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Client Professionnel</label>
                  <select name="clientId" defaultValue={(editingInvoice as SalesInvoice)?.clientId || ''} required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white">
                    <option value="">Sélectionnez un client</option>
                    {store.clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.ice})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Produit</label>
                    <select name="productId" defaultValue={editingInvoice?.productId || ''} required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white">
                      <option value="">Sélectionnez un produit</option>
                      {store.products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.salePrice} MAD/L)</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Mode de paiement</label>
                    <select name="paymentMethod" defaultValue={editingInvoice?.paymentMethod || 'virement'} required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white">
                      <option value="virement">Virement Bancaire</option>
                      <option value="cheque">Chèque</option>
                      <option value="especes">Espèces</option>
                      <option value="tpe">Carte Bancaire (TPE)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Quantité (L)</label>
                    <input name="quantity" type="number" step="any" defaultValue={editingInvoice?.quantity || ''} required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Prix de vente unitaire (HT)</label>
                    <input name="price" type="number" step="any" defaultValue={editingInvoice?.pricePerLiter || ''} required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="0.00" />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => { setShowSalesModal(false); setEditingInvoice(null); }}
                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors text-sm"
              >
                Annuler
              </button>
              <button 
                type="submit"
                form="salesForm"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors text-sm"
              >
                Générer & Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
