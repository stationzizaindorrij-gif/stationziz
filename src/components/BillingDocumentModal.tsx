import React, { useState, useEffect } from 'react';
import { DocumentType, DocumentItem, DocumentSettings, MixedPaymentRow, RichDocument } from './BillingTypes';
import { numberToWordsFR } from '../lib/numberToWords';
import { 
  X, Plus, Trash2, ShieldAlert, DollarSign, 
  Layers, PlusCircle, CheckCircle, HelpCircle, FileText, UserPlus, Calendar
} from 'lucide-react';

interface BillingDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (doc: Omit<RichDocument, 'id'>) => void;
  editingDoc: RichDocument | null;
  settings: DocumentSettings;
  clients: any[];
  suppliers: any[];
  products: any[];
  shopProducts: any[];
  defaultDocType?: DocumentType;
}

const formatToDMY = (dateStr: string): string => {
  if (!dateStr) return 'JJ/MM/AAAA';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

interface DatePickerProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  id?: string;
  size?: 'sm' | 'md';
}

const DatePickerWrapper = ({ value, onChange, className = '', id, size = 'md' }: DatePickerProps) => {
  const isSm = size === 'sm';
  return (
    <div className="relative w-full">
      <input 
        type="date"
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
      />
      <div className={`w-full border border-slate-200 text-slate-900 rounded-lg flex justify-between items-center pointer-events-none select-none transition-colors
        ${isSm ? 'bg-slate-50 text-xs p-2 h-[38px]' : 'bg-white text-xs p-2 h-[38px]'}
        ${className}`}
      >
        <span className="font-medium text-slate-700">{formatToDMY(value)}</span>
        <Calendar className={`${isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-slate-400`} />
      </div>
    </div>
  );
};

export function BillingDocumentModal({
  isOpen,
  onClose,
  onSubmit,
  editingDoc,
  settings,
  clients,
  suppliers,
  products,
  shopProducts,
  defaultDocType = 'client_facture'
}: BillingDocumentModalProps) {
  
  const [docType, setDocType] = useState<DocumentType>(defaultDocType);
  const [documentNumber, setDocumentNumber] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<RichDocument['paymentMethod']>('virement');
  const [mixedPayments, setMixedPayments] = useState<MixedPaymentRow[]>([]);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [status, setStatus] = useState<RichDocument['status']>('draft');

  // New Partner Quick Creation Sub-Form State
  const [showQuickPartner, setShowQuickPartner] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickICE, setQuickICE] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickAddress, setQuickAddress] = useState('');

  // Auto-generate document number on open/change
  useEffect(() => {
    if (editingDoc) {
      setDocType(editingDoc.docType);
      setDocumentNumber(editingDoc.documentNumber);
      setPartnerId(editingDoc.partnerId);
      setDate(editingDoc.date);
      setDueDate(editingDoc.dueDate);
      setItems(editingDoc.items || []);
      setPaymentMethod(editingDoc.paymentMethod);
      setMixedPayments(editingDoc.mixedPayments || []);
      setNotes(editingDoc.notes);
      setTerms(editingDoc.terms);
      setStatus(editingDoc.status);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const plus30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      setDate(today);
      setDueDate(plus30Days);
      setItems([{
        id: '1',
        productId: '',
        productName: '',
        description: '',
        qty: 1,
        price: 0,
        vat: 20,
        discount: 0
      }]);
      setPaymentMethod('virement');
      setMixedPayments([]);
      setNotes('');
      setTerms(settings.termsAndConditions || '');
      setStatus('draft');
      setShowQuickPartner(false);
      
      // Auto-increment draft number from settings
      const numSettings = settings.numbering[docType];
      if (numSettings) {
        const paddedNum = String(numSettings.nextNumber).padStart(5, '0');
        setDocumentNumber(`${numSettings.prefix}${paddedNum}${numSettings.suffix}`);
      }
    }
  }, [editingDoc, docType, isOpen, settings]);

  if (!isOpen) return null;

  const isClientDoc = ['client_devis', 'client_facture', 'client_bl'].includes(docType);
  const activePartners = isClientDoc ? clients : suppliers;

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `item_${Date.now()}`,
        productId: '',
        productName: '',
        description: '',
        qty: 1,
        price: 0,
        vat: 20,
        discount: 0
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof DocumentItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        let updated = { ...item, [field]: value };
        
        // If productId changed, try to auto-fill details
        if (field === 'productId' && value) {
          // Check standard fuel products
          const pFuel = products.find(p => p.id === value);
          if (pFuel) {
            updated.productName = pFuel.name;
            updated.price = isClientDoc ? pFuel.salePrice : pFuel.purchasePrice;
            updated.vat = 20; // Fuel TVA in Morocco is usually 20%
          } else {
            // Check shop products
            const pShop = shopProducts.find(p => p.id === value);
            if (pShop) {
              updated.productName = pShop.name;
              updated.price = isClientDoc ? pShop.salePrice : pShop.purchasePrice;
              updated.vat = 20;
            }
          }
        }
        return updated;
      }
      return item;
    }));
  };

  // Calculations
  const calculateTotals = () => {
    let subtotalHT = 0;
    let totalVAT = 0;
    
    items.forEach(item => {
      const priceAfterDiscount = item.price * (1 - (item.discount || 0) / 100);
      const lineHT = priceAfterDiscount * (item.qty || 0);
      const lineVAT = lineHT * ((item.vat || 0) / 100);
      
      subtotalHT += lineHT;
      totalVAT += lineVAT;
    });

    const totalTTC = subtotalHT + totalVAT;

    return {
      amountHT: Number(subtotalHT.toFixed(2)),
      vatAmount: Number(totalVAT.toFixed(2)),
      amountTTC: Number(totalTTC.toFixed(2))
    };
  };

  const totals = calculateTotals();

  // Quick partner creation
  const handleCreateQuickPartner = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!quickName) return;

    const newPartner = {
      id: `quick_${Date.now()}`,
      name: quickName,
      ice: quickICE || 'N/A',
      email: quickEmail || '',
      phone: '',
      address: quickAddress || '',
      notes: 'Créé à la volée'
    };

    if (isClientDoc) {
      clients.push(newPartner);
    } else {
      suppliers.push(newPartner);
    }

    setPartnerId(newPartner.id);
    setShowQuickPartner(false);
    setQuickName('');
    setQuickICE('');
    setQuickEmail('');
    setQuickAddress('');
  };

  // Mixed payments handlers
  const handleAddMixedPayment = () => {
    setMixedPayments(prev => [...prev, { method: 'especes', amount: 0 }]);
  };

  const handleRemoveMixedPayment = (index: number) => {
    setMixedPayments(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleMixedPaymentChange = (index: number, field: keyof MixedPaymentRow, value: any) => {
    setMixedPayments(prev => prev.map((row, idx) => {
      if (idx === index) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const sumMixedPayments = mixedPayments.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const mixedDiff = Number((totals.amountTTC - sumMixedPayments).toFixed(2));

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId) {
      alert("Veuillez sélectionner un contact commercial.");
      return;
    }

    // Validate mixed payments
    if (paymentMethod === 'mixed' && mixedDiff !== 0) {
      alert(`La somme des paiements mixtes (${sumMixedPayments} Dh) doit être égale au total TTC (${totals.amountTTC} Dh). Écart: ${mixedDiff} Dh.`);
      return;
    }

    const selectedPartner = activePartners.find(p => p.id === partnerId);

    const docData: Omit<RichDocument, 'id'> = {
      docType,
      documentNumber,
      partnerId,
      partnerName: selectedPartner ? selectedPartner.name : 'Inconnu',
      date,
      dueDate,
      items,
      amountHT: totals.amountHT,
      vatAmount: totals.vatAmount,
      amountTTC: totals.amountTTC,
      paymentMethod,
      mixedPayments: paymentMethod === 'mixed' ? mixedPayments : [],
      notes,
      terms,
      status: status || 'draft'
    };

    onSubmit(docData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a80] backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              {editingDoc ? 'Modifier la pièce commerciale' : 'Saisir / Générer un document'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Saisie complète et conforme à la fiscalité marocaine (TVA, ICE, en-tête pro)</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <form id="billingDocForm" onSubmit={handleSubmitForm} className="space-y-6">
            
            {/* Row 1 : Type de Document, Numéro & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Type de document</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  disabled={!!editingDoc}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold bg-white focus:outline-none"
                >
                  {(() => {
                    const isClientContext = editingDoc 
                      ? ['client_devis', 'client_facture', 'client_bl'].includes(editingDoc.docType) 
                      : ['client_devis', 'client_facture', 'client_bl'].includes(defaultDocType);
                    
                    return isClientContext ? (
                      <>
                        <option value="client_facture">📄 Facture Client</option>
                        <option value="client_devis">📝 Devis Client</option>
                        <option value="client_bl">🚚 Bon de Livraison (BL)</option>
                      </>
                    ) : (
                      <>
                        <option value="supplier_facture">📥 Facture Fournisseur</option>
                        <option value="supplier_br">📦 Bon de Réception (BR)</option>
                        <option value="supplier_devis_req">📧 Demande de Devis</option>
                      </>
                    );
                  })()}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">N° Document</label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Date d'Émission</label>
                <DatePickerWrapper 
                  value={date}
                  onChange={(val) => setDate(val)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Date d'Échéance</label>
                <DatePickerWrapper 
                  value={dueDate}
                  onChange={(val) => setDueDate(val)}
                />
              </div>
            </div>

            {/* Row 2 : Partenaire Commercial (Client/Fournisseur) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  {isClientDoc ? '👤 Client Associé' : '🏭 Fournisseur Associé'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickPartner(!showQuickPartner)}
                  className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {showQuickPartner ? "Sélectionner existant" : "+ Créer un contact à la volée"}
                </button>
              </div>

              {showQuickPartner ? (
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 grid grid-cols-1 md:grid-cols-4 gap-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase block">Raison Sociale</span>
                    <input 
                      type="text" 
                      placeholder="Atlas Sarl, Hamza..." 
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      className="w-full border border-indigo-200 rounded p-1.5 text-xs bg-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase block">I.C.E. (Maroc)</span>
                    <input 
                      type="text" 
                      placeholder="Ex: 001584..." 
                      value={quickICE}
                      onChange={(e) => setQuickICE(e.target.value)}
                      className="w-full border border-indigo-200 rounded p-1.5 text-xs bg-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase block">Adresse Email</span>
                    <input 
                      type="email" 
                      placeholder="contact@email.com" 
                      value={quickEmail}
                      onChange={(e) => setQuickEmail(e.target.value)}
                      className="w-full border border-indigo-200 rounded p-1.5 text-xs bg-white focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleCreateQuickPartner}
                      disabled={!quickName}
                      className="w-full bg-indigo-600 text-white font-bold text-xs p-2 rounded hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                    >
                      Ajouter & Sélectionner
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  required
                >
                  <option value="">-- Sélectionnez un tiers --</option>
                  {activePartners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.ice && p.ice !== 'N/A' ? `(ICE: ${p.ice})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Row 3 : Multi-Line Items Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide">📦 Lignes d'articles / Prestations</span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-3 py-1.5 flex items-center gap-1 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  Ajouter une ligne
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3 w-44">Produit/Prestation</th>
                        <th className="p-3">Désignation manuelle / Description</th>
                        <th className="p-3 w-20 text-center">Qté</th>
                        <th className="p-3 w-28 text-right">P.U. (HT)</th>
                        <th className="p-3 w-20 text-center">Remise %</th>
                        <th className="p-3 w-20 text-center">TVA %</th>
                        <th className="p-3 w-24 text-right">Total HT</th>
                        <th className="p-3 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => {
                        const lineHT = (item.price * item.qty) * (1 - (item.discount || 0) / 100);

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            
                            {/* Product selection */}
                            <td className="p-2.5">
                              <select
                                value={item.productId}
                                onChange={(e) => handleItemChange(item.id, 'productId', e.target.value)}
                                className="w-full border border-slate-200 bg-white rounded-lg p-1.5 focus:outline-none"
                              >
                                <option value="">-- Autre / Manuel --</option>
                                <optgroup label="Carburants">
                                  {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Boutique / Services">
                                  {shopProducts.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </optgroup>
                              </select>
                            </td>

                            {/* Manual name / description */}
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={item.productName || item.description}
                                onChange={(e) => {
                                  handleItemChange(item.id, 'productName', e.target.value);
                                  handleItemChange(item.id, 'description', e.target.value);
                                }}
                                placeholder="Nom de l'article ou description libre..."
                                className="w-full border border-slate-200 bg-white rounded-lg p-1.5 focus:outline-none"
                                required
                              />
                            </td>

                            {/* Qty */}
                            <td className="p-2.5">
                              <input
                                type="number"
                                step="any"
                                min="0.01"
                                value={item.qty}
                                onChange={(e) => handleItemChange(item.id, 'qty', parseFloat(e.target.value) || 0)}
                                className="w-full border border-slate-200 bg-white rounded-lg p-1.5 text-center focus:outline-none font-mono"
                                required
                              />
                            </td>

                            {/* Price */}
                            <td className="p-2.5">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={item.price}
                                onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                                className="w-full border border-slate-200 bg-white rounded-lg p-1.5 text-right focus:outline-none font-mono"
                                required
                              />
                            </td>

                            {/* Discount */}
                            <td className="p-2.5">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discount}
                                onChange={(e) => handleItemChange(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                className="w-full border border-slate-200 bg-white rounded-lg p-1.5 text-center focus:outline-none font-mono"
                              />
                            </td>

                            {/* TVA */}
                            <td className="p-2.5">
                              <select
                                value={item.vat}
                                onChange={(e) => handleItemChange(item.id, 'vat', parseInt(e.target.value) || 0)}
                                className="w-full border border-slate-200 bg-white rounded-lg p-1.5 text-center focus:outline-none"
                              >
                                <option value="20">20%</option>
                                <option value="14">14%</option>
                                <option value="10">10%</option>
                                <option value="7">7%</option>
                                <option value="0">0% (Exo)</option>
                              </select>
                            </td>

                            {/* Line Total */}
                            <td className="p-2.5 text-right font-bold text-slate-800 font-mono">
                              {lineHT.toFixed(2)}
                            </td>

                            {/* Delete Action */}
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={items.length === 1}
                                className="p-1.5 text-slate-300 hover:text-rose-600 rounded hover:bg-rose-50 disabled:opacity-20 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Row 4: Totals, Payment & Automatic words */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              
              {/* Left Column: Payments & Automatic text */}
              <div className="space-y-6">
                
                {/* Mode de paiement */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <div>
                    <label className="text-xs font-black text-slate-700 uppercase block tracking-wide">💳 Mode de paiement principal</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full border border-slate-200 bg-white rounded-lg p-2 mt-1.5 text-xs focus:outline-none font-bold"
                    >
                      <option value="virement">Virement Bancaire</option>
                      <option value="carte">Carte Bancaire (TPE)</option>
                      <option value="cheque">Chèque</option>
                      <option value="especes">Espèces</option>
                      <option value="credit">Compte Crédit (Encours pro)</option>
                      <option value="mixed">Paiement Mixte (Plusieurs modes)</option>
                    </select>
                  </div>

                  {/* Mixed payment block */}
                  {paymentMethod === 'mixed' && (
                    <div className="border-t border-slate-200 pt-3 space-y-3 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-indigo-600">Distribution du Paiement Mixte</span>
                        <button
                          type="button"
                          onClick={handleAddMixedPayment}
                          className="text-[10px] text-indigo-600 font-black hover:underline"
                        >
                          + Ajouter mode
                        </button>
                      </div>

                      <div className="space-y-2">
                        {mixedPayments.map((payRow, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <select
                              value={payRow.method}
                              onChange={(e) => handleMixedPaymentChange(index, 'method', e.target.value)}
                              className="border border-slate-200 rounded p-1 text-xs bg-white"
                            >
                              <option value="especes">Espèces</option>
                              <option value="carte">Carte</option>
                              <option value="cheque">Chèque</option>
                              <option value="virement">Virement</option>
                            </select>
                            <input 
                              type="number" 
                              value={payRow.amount}
                              onChange={(e) => handleMixedPaymentChange(index, 'amount', parseFloat(e.target.value) || 0)}
                              placeholder="Montant Dh" 
                              className="border border-slate-200 rounded p-1 text-xs w-28 text-right font-mono"
                            />
                            <input 
                              type="text" 
                              value={payRow.ref || ''}
                              onChange={(e) => handleMixedPaymentChange(index, 'ref', e.target.value)}
                              placeholder="Réf / N° Chèque (Optionnel)" 
                              className="border border-slate-200 rounded p-1 text-xs flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveMixedPayment(index)}
                              className="text-slate-300 hover:text-rose-600 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Summary of mixed calculation */}
                      <div className="text-[11px] font-bold flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
                        <span>Saisi: {sumMixedPayments.toFixed(2)} Dh</span>
                        <span className={mixedDiff === 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {mixedDiff === 0 ? (
                            '✓ Total Vérifié'
                          ) : (
                            `Écart restant: ${mixedDiff} Dh`
                          )}
                        </span>
                        {mixedDiff !== 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              // Auto-fill or adjust last element
                              if (mixedPayments.length > 0) {
                                const lastIdx = mixedPayments.length - 1;
                                const currentLastAmt = Number(mixedPayments[lastIdx].amount) || 0;
                                handleMixedPaymentChange(lastIdx, 'amount', Number((currentLastAmt + mixedDiff).toFixed(2)));
                              } else {
                                setMixedPayments([{ method: 'especes', amount: totals.amountTTC }]);
                              }
                            }}
                            className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 text-[9px] font-black"
                          >
                            Ajuster
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Automatic Amount in letters */}
                <div className="bg-slate-900 text-white p-4 rounded-xl shadow-inner space-y-1.5">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Montant en lettres (Automatique)</span>
                  <p className="text-xs font-black italic text-slate-100 pr-2">
                    « {numberToWordsFR(totals.amountTTC)} »
                  </p>
                </div>

              </div>

              {/* Right Column: Totals details block */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/50 space-y-4">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wide block pb-2 border-b border-slate-200/60">Calcul des montants</span>
                
                <div className="space-y-2 text-xs font-bold text-slate-600">
                  <div className="flex justify-between">
                    <span>Total Brut HT :</span>
                    <span className="font-mono">{totals.amountHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Dh</span>
                  </div>
                  
                  {/* VAT Details list */}
                  <div className="border-t border-dashed border-slate-200 pt-2 space-y-1">
                    <span className="text-[10px] text-slate-400 block uppercase">Détails de la TVA :</span>
                    <div className="flex justify-between pl-2">
                      <span>TVA cumulée :</span>
                      <span className="font-mono">{totals.vatAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Dh</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-300 pt-3">
                    <span>Net à Payer (TTC) :</span>
                    <span className="font-mono text-indigo-600">{totals.amountTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Dh</span>
                  </div>
                </div>

                {/* Status selector (custom billing logic) */}
                <div className="pt-2 border-t border-dashed border-slate-200 space-y-1">
                  <span className="text-xs font-black text-slate-700 uppercase block">Statut du document</span>
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {['draft', 'sent', 'paid', 'validated'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatus(st as any)}
                        className={`px-3 py-1 text-xs border rounded-lg transition-all ${status === st ? 'bg-slate-800 border-slate-800 text-white font-bold' : 'bg-white hover:bg-slate-100 text-slate-500'}`}
                      >
                        {st === 'draft' && 'Brouillon'}
                        {st === 'sent' && 'Envoyé'}
                        {st === 'paid' && 'Payé'}
                        {st === 'validated' && 'Validé'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Notes & conditions details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Observations / Remarques Internes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes privées (non visibles sur l'imprimé clients)..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Conditions de Règlement (CGV)</label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none"
                />
              </div>
            </div>

          </form>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-all text-sm"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="billingDocForm"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all text-sm shadow-sm hover:shadow-indigo-100"
          >
            {editingDoc ? 'Enregistrer les modifications' : 'Générer & Enregistrer'}
          </button>
        </div>

      </div>
    </div>
  );
}
