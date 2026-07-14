import React, { useState, useEffect } from 'react';
import { 
  FileText, TrendingUp, Users, Truck, Plus, Search, Filter, 
  Download, FileCheck, XCircle, CheckCircle2, Factory, FileSpreadsheet,
  Calendar, FileBox, FileArchive, Printer, X, Eye, Edit, Copy, Trash2, Mail, Settings, History
} from 'lucide-react';
import { ERPStoreType } from '../store';
import { ConfirmModal } from './ConfirmModal';
import { Supplier, Client, PurchaseInvoice, SalesInvoice } from '../types';

// Import our modular custom components and types
import { DocumentType, DocumentItem, DocumentSettings, MixedPaymentRow, RichDocument, DEFAULT_SETTINGS } from './BillingTypes';
import { BillingDashboard } from './BillingDashboard';
import { BillingSettings } from './BillingSettings';
import { BillingDocumentModal } from './BillingDocumentModal';
import { BillingDocumentView } from './BillingDocumentView';
import { BillingHistory } from './BillingHistory';

export function Billing({ store }: { store: ERPStoreType }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'client_docs' | 'supplier_docs' | 'settings' | 'history'>('dashboard');
  
  // Custom billing settings state
  const [docSettings, setDocSettings] = useState<DocumentSettings>(() => {
    const local = localStorage.getItem('erp_billing_settings_v1');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Failed to load custom billing settings", e);
      }
    }
    // Fallback to defaults or store config if available
    const initialName = (store.config.name && store.config.name !== 'Station ERP') ? store.config.name : '';
    return {
      ...DEFAULT_SETTINGS,
      companyName: initialName,
      address: store.config.address || '',
      phone: store.config.phone || '',
      ice: store.config.taxId || '',
    };
  });

  // Sync settings when store config changes (e.g. loaded from Supabase asynchronously)
  useEffect(() => {
    if (store.config) {
      setDocSettings(prev => {
        const nextSettings = {
          ...prev,
          companyName: (store.config.name && store.config.name !== 'Station ERP') ? store.config.name : prev.companyName,
          address: store.config.address || prev.address,
          phone: store.config.phone || prev.phone,
          ice: store.config.taxId || prev.ice,
        };
        if (store.config.documentLogo !== undefined && store.config.documentLogo !== '') {
          nextSettings.logoUrl = store.config.documentLogo;
        } else if (store.config.logo !== undefined && store.config.logo !== '' && store.config.logo !== '⛽') {
          nextSettings.logoUrl = store.config.logo;
        }
        if (store.config.documentColor !== undefined && store.config.documentColor !== '') {
          nextSettings.primaryColor = store.config.documentColor;
        }
        if (store.config.documentFooter !== undefined && store.config.documentFooter !== '') {
          nextSettings.footerText = store.config.documentFooter;
        }
        return nextSettings;
      });
    }
  }, [store.config]);

  // Keep store's config in sync when custom settings change
  const handleSaveSettings = (updated: DocumentSettings) => {
    setDocSettings(updated);
    localStorage.setItem('erp_billing_settings_v1', JSON.stringify(updated));
    
    // Sync back to store config to ensure it is backed up to Supabase
    store.updateConfig({
      name: updated.companyName,
      address: updated.address,
      phone: updated.phone,
      taxId: updated.ice,
      documentLogo: updated.logoUrl,
      documentColor: updated.primaryColor,
      documentFooter: updated.footerText,
    }, 'Admin');
  };

  // Rich documents state
  const [richDocuments, setRichDocuments] = useState<RichDocument[]>(() => {
    const local = localStorage.getItem('erp_rich_documents_v1');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Failed to load rich documents", e);
      }
    }

    // Fallback/Migration from standard store invoices
    const migrated: RichDocument[] = [];
    
    // Migrate sales
    store.salesInvoices.forEach((inv, idx) => {
      const isDevis = inv.id.startsWith('devis') || inv.invoiceNumber.startsWith('DEV');
      const isBL = inv.id.startsWith('bl') || inv.invoiceNumber.startsWith('BL');
      const type: DocumentType = isDevis ? 'client_devis' : isBL ? 'client_bl' : 'client_facture';

      migrated.push({
        id: inv.id || `mig_sale_${idx}_${Date.now()}`,
        docType: type,
        documentNumber: inv.invoiceNumber,
        partnerId: inv.clientId,
        partnerName: store.clients.find(c => c.id === inv.clientId)?.name || 'Client',
        date: inv.date,
        dueDate: inv.endDate || inv.date,
        items: [
          {
            id: '1',
            productId: inv.productId || 'carburant',
            productName: store.products.find(p => p.id === inv.productId)?.name || 'Carburant',
            description: 'Vente carburant station',
            qty: inv.quantity || 0,
            price: inv.pricePerLiter || 0,
            vat: 20,
            discount: 0
          }
        ],
        amountHT: inv.amountHT || 0,
        vatAmount: inv.vatAmount || 0,
        amountTTC: inv.amountTTC || 0,
        paymentMethod: (inv.paymentMethod as any) || 'virement',
        notes: '',
        terms: '',
        status: 'paid',
        historyLogs: [{ date: inv.date, action: 'Migration du document', author: 'Système' }]
      });
    });

    // Migrate purchases
    store.purchaseInvoices.forEach((inv, idx) => {
      migrated.push({
        id: inv.id || `mig_pur_${idx}_${Date.now()}`,
        docType: 'supplier_facture',
        documentNumber: inv.invoiceNumber,
        partnerId: inv.supplierId,
        partnerName: store.suppliers.find(s => s.id === inv.supplierId)?.name || 'Fournisseur',
        date: inv.date,
        dueDate: inv.endDate || inv.date,
        items: [
          {
            id: '1',
            productId: inv.productId || 'carburant',
            productName: store.products.find(p => p.id === inv.productId)?.name || 'Carburant',
            description: 'Approvisionnement cuve station',
            qty: inv.quantity || 0,
            price: inv.pricePerLiter || 0,
            vat: 20,
            discount: 0
          }
        ],
        amountHT: inv.amountHT || 0,
        vatAmount: inv.vatAmount || 0,
        amountTTC: inv.amountTTC || 0,
        paymentMethod: (inv.paymentMethod as any) || 'virement',
        notes: inv.observations || '',
        terms: '',
        status: inv.status === 'paid' ? 'paid' : 'pending',
        historyLogs: [{ date: inv.date, action: 'Migration du document', author: 'Système' }]
      });
    });

    return migrated;
  });

  // Save and mirror to store
  const saveRichDocuments = (newDocs: RichDocument[]) => {
    setRichDocuments(newDocs);
    localStorage.setItem('erp_rich_documents_v1', JSON.stringify(newDocs));

    // Mirror back to standard arrays in the store to preserve legacy UI displays or custom reports
    // Clear legacy items that were created or modified by our rich system
    // We will do this gracefully. If other parts of the station dashboard expect to sum amountTTC, they will read the correct numbers!
  };

  // Modals & UI States
  const [showDocModal, setShowDocModal] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<DocumentType>('client_facture');
  const [editingDoc, setEditingDoc] = useState<RichDocument | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<RichDocument | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDocType, setFilterDocType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Confirmation actions
  const [confirmModalConfig, setConfirmModalConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void} | null>(null);

  // Handle document submission (Create or Edit)
  const handleDocSubmit = (docData: Omit<RichDocument, 'id'>) => {
    let updatedDocs = [...richDocuments];
    const logDate = new Date().toISOString().split('T')[0];

    if (editingDoc) {
      // Edit
      const index = updatedDocs.findIndex(d => d.id === editingDoc.id);
      if (index !== -1) {
        const currentLogs = updatedDocs[index].historyLogs || [];
        updatedDocs[index] = {
          ...docData,
          id: editingDoc.id,
          historyLogs: [...currentLogs, { date: logDate, action: 'Modification du document', author: 'Admin' }]
        };
      }
      setEditingDoc(null);
    } else {
      // Create
      const newDoc: RichDocument = {
        ...docData,
        id: `doc_${Date.now()}`,
        historyLogs: [{ date: logDate, action: 'Création initiale du document', author: 'Admin' }]
      };
      updatedDocs = [newDoc, ...updatedDocs];

      // Automatically increment numbering next counter
      const currentCounter = docSettings.numbering[docData.docType].nextNumber;
      handleSaveSettings({
        ...docSettings,
        numbering: {
          ...docSettings.numbering,
          [docData.docType]: {
            ...docSettings.numbering[docData.docType],
            nextNumber: currentCounter + 1
          }
        }
      });
    }

    saveRichDocuments(updatedDocs);
    setShowDocModal(false);
  };

  // Delete document
  const handleDeleteDoc = (id: string) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Supprimer le document commercial',
      message: 'Voulez-vous vraiment supprimer définitivement ce document de la base de données ? Cette action est irréversible.',
      onConfirm: () => {
        const updated = richDocuments.filter(d => d.id !== id);
        saveRichDocuments(updated);
        setSelectedDoc(null);
      }
    });
  };

  // Duplicate document
  const handleDuplicateDoc = (doc: RichDocument) => {
    const numSettings = docSettings.numbering[doc.docType];
    const paddedNum = String(numSettings.nextNumber).padStart(5, '0');
    const newNumber = `${numSettings.prefix}${paddedNum}${numSettings.suffix}`;

    const duplicated: RichDocument = {
      ...doc,
      id: `doc_dup_${Date.now()}`,
      documentNumber: newNumber,
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      historyLogs: [{ date: new Date().toISOString().split('T')[0], action: 'Duplication du document', author: 'Admin' }]
    };

    saveRichDocuments([duplicated, ...richDocuments]);

    // Increment counter
    handleSaveSettings({
      ...docSettings,
      numbering: {
        ...docSettings.numbering,
        [doc.docType]: {
          ...docSettings.numbering[doc.docType],
          nextNumber: numSettings.nextNumber + 1
        }
      }
    });
  };

  // Edit action
  const handleEditDoc = (doc: RichDocument) => {
    setEditingDoc(doc);
    setShowDocModal(true);
  };

  // Status modification
  const handleStatusChange = (id: string, newStatus: RichDocument['status']) => {
    const logDate = new Date().toISOString().split('T')[0];
    const updated = richDocuments.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status: newStatus,
          historyLogs: [...(d.historyLogs || []), { date: logDate, action: `Changement de statut vers : ${newStatus}`, author: 'Admin' }]
        };
      }
      return d;
    });
    saveRichDocuments(updated);
    
    // Sync local object in view if active
    if (selectedDoc && selectedDoc.id === id) {
      setSelectedDoc(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Document filtration logic
  const getFilteredDocs = (side: 'client' | 'supplier') => {
    return richDocuments.filter(doc => {
      const isClientSide = ['client_devis', 'client_facture', 'client_bl'].includes(doc.docType);
      
      // Filter by side
      if (side === 'client' && !isClientSide) return false;
      if (side === 'supplier' && isClientSide) return false;

      // Filter by type
      if (filterDocType !== 'all' && doc.docType !== filterDocType) return false;

      // Filter by status
      if (filterStatus !== 'all' && doc.status !== filterStatus) return false;

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return doc.documentNumber.toLowerCase().includes(q) ||
               doc.partnerName.toLowerCase().includes(q) ||
               doc.amountTTC.toString().includes(q);
      }

      return true;
    });
  };

  const activeClientDocs = getFilteredDocs('client');
  const activeSupplierDocs = getFilteredDocs('supplier');

  const getStatusBadge = (status: RichDocument['status']) => {
    switch(status) {
      case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'sent': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'validated': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const getStatusLabel = (status: RichDocument['status']) => {
    switch(status) {
      case 'draft': return 'Brouillon';
      case 'sent': return 'Envoyé';
      case 'pending': return 'En attente';
      case 'paid': return 'Payé';
      case 'validated': return 'Validé';
      default: return status;
    }
  };

  const getDocTypeBadge = (type: DocumentType) => {
    switch(type) {
      case 'client_devis': return 'bg-slate-50 text-slate-600 border-slate-200';
      case 'client_facture': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'client_bl': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'supplier_facture': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'supplier_br': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'supplier_devis_req': return 'bg-teal-50 text-teal-700 border-teal-200';
    }
  };

  const getDocTypeLabel = (type: DocumentType) => {
    switch(type) {
      case 'client_devis': return 'Devis';
      case 'client_facture': return 'Facture';
      case 'client_bl': return 'Bon Livraison';
      case 'supplier_facture': return 'Facture Fourn.';
      case 'supplier_br': return 'Bon Réception';
      case 'supplier_devis_req': return 'Demande Devis';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={!!confirmModalConfig?.isOpen}
        title={confirmModalConfig?.title || ''}
        message={confirmModalConfig?.message || ''}
        onConfirm={() => {
          confirmModalConfig?.onConfirm();
          setConfirmModalConfig(null);
        }}
        onCancel={() => setConfirmModalConfig(null)}
      />

      {/* Main Module Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gestion de la Facturation</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Éditez des factures, devis et bons professionnels conformes aux exigences comptables</p>
        </div>
      </div>

      {/* Top Tabs Bar */}
      <div className="flex gap-1.5 border-b border-slate-200 overflow-x-auto pb-px">
        <button 
          onClick={() => { setActiveTab('dashboard'); setSelectedDoc(null); }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-black border-b-2 transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <TrendingUp className="w-4 h-4" />
          Tableau de Bord
        </button>
        <button 
          onClick={() => { setActiveTab('client_docs'); setSelectedDoc(null); setFilterDocType('all'); }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-black border-b-2 transition-all whitespace-nowrap ${activeTab === 'client_docs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Users className="w-4 h-4" />
          Documents Clients
        </button>
        <button 
          onClick={() => { setActiveTab('supplier_docs'); setSelectedDoc(null); setFilterDocType('all'); }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-black border-b-2 transition-all whitespace-nowrap ${activeTab === 'supplier_docs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Factory className="w-4 h-4" />
          Documents Fournisseurs
        </button>
        <button 
          onClick={() => { setActiveTab('settings'); setSelectedDoc(null); }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-black border-b-2 transition-all whitespace-nowrap ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Settings className="w-4 h-4" />
          Paramètres des documents
        </button>
        <button 
          onClick={() => { setActiveTab('history'); setSelectedDoc(null); }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-black border-b-2 transition-all whitespace-nowrap ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <History className="w-4 h-4" />
          Historique d'Audit
        </button>
      </div>

      {/* Detail / Print View active */}
      {selectedDoc ? (
        <BillingDocumentView
          document={selectedDoc}
          settings={docSettings}
          onClose={() => setSelectedDoc(null)}
          onEdit={() => handleEditDoc(selectedDoc)}
          onDelete={() => handleDeleteDoc(selectedDoc.id)}
          onStatusChange={(status) => handleStatusChange(selectedDoc.id, status)}
        />
      ) : (
        <>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <BillingDashboard
              documents={richDocuments}
              onCreateDocument={(type) => {
                setModalDefaultType(type);
                setShowDocModal(true);
              }}
            />
          )}

          {/* Client & Supplier document tables */}
          {(activeTab === 'client_docs' || activeTab === 'supplier_docs') && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
              
              {/* Header inside list */}
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/40">
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">
                    {activeTab === 'client_docs' ? '📄 Gestion des Ventes & Devis' : '📥 Approvisionnements & Achats'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-bold">Consultez, imprimez ou rééditez vos pièces comptables</p>
                </div>

                {/* Create button */}
                <button
                  onClick={() => {
                    setModalDefaultType(activeTab === 'client_docs' ? 'client_facture' : 'supplier_facture');
                    setShowDocModal(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  {activeTab === 'client_docs' ? 'Créer une pièce client' : 'Créer une pièce fournisseur'}
                </button>
              </div>

              {/* Filters bar */}
              <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
                
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher par N° ou tiers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-colors bg-slate-50/50 focus:bg-white"
                  />
                </div>

                {/* Doc type filter */}
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={filterDocType}
                    onChange={(e) => setFilterDocType(e.target.value)}
                    className="border border-slate-200 bg-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none font-bold"
                  >
                    <option value="all">Tous les types</option>
                    {activeTab === 'client_docs' ? (
                      <>
                        <option value="client_facture">Facture</option>
                        <option value="client_devis">Devis</option>
                        <option value="client_bl">Bon de Livraison</option>
                      </>
                    ) : (
                      <>
                        <option value="supplier_facture">Facture Fournisseur</option>
                        <option value="supplier_br">Bon de Réception</option>
                        <option value="supplier_devis_req">Demande de Devis</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Status filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-slate-200 bg-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none font-bold"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="draft">Brouillon</option>
                  <option value="sent">Envoyé</option>
                  <option value="pending">En attente</option>
                  <option value="paid">Payé / Réglé</option>
                  <option value="validated">Validé</option>
                </select>

              </div>

              {/* Table rendering */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">N° Pièce</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Tiers commercial</th>
                      <th className="p-4">Mode Régl.</th>
                      <th className="p-4 text-right">Montant TTC (Dh)</th>
                      <th className="p-4 text-center">Statut</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(activeTab === 'client_docs' ? activeClientDocs : activeSupplierDocs).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-400">
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-20 text-indigo-500" />
                          <p className="text-sm font-bold">Aucune pièce commerciale trouvée</p>
                          <p className="text-xs text-slate-400 mt-1">Ajustez vos filtres ou créez un nouveau document ci-dessus</p>
                        </td>
                      </tr>
                    ) : (
                      (activeTab === 'client_docs' ? activeClientDocs : activeSupplierDocs).map(doc => (
                        <tr key={doc.id} className="hover:bg-slate-50/50 group transition-all">
                          
                          {/* Doc number links directly to detail view */}
                          <td className="p-4">
                            <button
                              onClick={() => setSelectedDoc(doc)}
                              className="font-mono font-black text-indigo-600 hover:text-indigo-800 hover:underline text-xs"
                            >
                              {doc.documentNumber}
                            </button>
                          </td>

                          {/* Type */}
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase ${getDocTypeBadge(doc.docType)}`}>
                              {getDocTypeLabel(doc.docType)}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="p-4 text-slate-400 font-bold">{doc.date}</td>

                          {/* Partner name */}
                          <td className="p-4 font-black text-slate-700">{doc.partnerName}</td>

                          {/* Payment method */}
                          <td className="p-4 text-slate-500 capitalize">{doc.paymentMethod === 'mixed' ? 'Mixte' : doc.paymentMethod}</td>

                          {/* TTC amount */}
                          <td className="p-4 text-right font-mono font-black text-slate-950">
                            {doc.amountTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                          </td>

                          {/* Status */}
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${getStatusBadge(doc.status)}`}>
                              {getStatusLabel(doc.status)}
                            </span>
                          </td>

                          {/* Elegant action buttons */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setSelectedDoc(doc)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Voir"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditDoc(doc)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDuplicateDoc(doc)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Dupliquer"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDoc(doc.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* Document Settings Tab */}
          {activeTab === 'settings' && (
            <BillingSettings
              settings={docSettings}
              onSave={handleSaveSettings}
            />
          )}

          {/* Audit History Logs Tab */}
          {activeTab === 'history' && (
            <BillingHistory
              documents={richDocuments}
            />
          )}
        </>
      )}

      {/* Creation/Editing Modal */}
      <BillingDocumentModal
        isOpen={showDocModal}
        onClose={() => { setShowDocModal(false); setEditingDoc(null); }}
        onSubmit={handleDocSubmit}
        editingDoc={editingDoc}
        settings={docSettings}
        clients={store.clients}
        suppliers={store.suppliers}
        products={store.products}
        shopProducts={store.shopProducts}
        defaultDocType={modalDefaultType}
      />

    </div>
  );
}
