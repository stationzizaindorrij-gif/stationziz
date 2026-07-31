import { ConfirmModal } from "./ConfirmModal";
import React, { useState, useRef } from 'react';
import { Package, Plus, Search, Edit2, Trash2, Camera, Tag, DollarSign, Archive, Check, AlertTriangle, Printer, X, Filter, Building2, ArrowUpRight, ArrowDownLeft, Clock, History, Calendar, UserCheck, RefreshCw } from 'lucide-react';
import { ERPStoreType } from '../store';
import { ShopProduct } from '../types';

interface ShopProps { store: ERPStoreType; }

export const Shop: React.FC<ShopProps> = ({ store }) => {
  const { shopProducts, addShopProduct, updateShopProduct, deleteShopProduct, currentRole, users, config, shopStockMovements = [] } = store;
  const [activeTab, setActiveTab] = useState<'catalog' | 'history'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [movSearchTerm, setMovSearchTerm] = useState('');
  const [movTypeFilter, setMovTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [movProductFilter, setMovProductFilter] = useState<string>('all');
  const [movDatePeriod, setMovDatePeriod] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [movStartDate, setMovStartDate] = useState<string>('');
  const [movEndDate, setMovEndDate] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMovReportModalOpen, setIsMovReportModalOpen] = useState(false);
  const [reportFilter, setReportFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const reportRef = useRef<HTMLDivElement>(null);
  const movReportRef = useRef<HTMLDivElement>(null);

  const isAdminOrManager = currentRole === 'admin' || currentRole === 'manager';

  const [formData, setFormData] = useState<Partial<ShopProduct>>({
    name: '',
    photo: '',
    purchasePrice: 0,
    salePrice: 0,
    stockQuantity: 0,
    minStockAlert: 0,
    status: 'active'
  });

  const currentUser = users.find(u => u.role === currentRole)?.name || currentRole;

  const filteredMovements = (shopStockMovements || []).filter(mov => {
    const matchesSearch = 
      mov.productName.toLowerCase().includes(movSearchTerm.toLowerCase()) ||
      mov.reason.toLowerCase().includes(movSearchTerm.toLowerCase()) ||
      (mov.author && mov.author.toLowerCase().includes(movSearchTerm.toLowerCase()));
    
    const matchesType = movTypeFilter === 'all' || mov.type === movTypeFilter;
    const matchesProduct = movProductFilter === 'all' || mov.productId === movProductFilter;

    let matchesDate = true;
    const movDateStr = mov.date ? mov.date.split(' ')[0] : '';
    if (movDatePeriod === 'custom') {
      if (movStartDate && movDateStr < movStartDate) matchesDate = false;
      if (movEndDate && movDateStr > movEndDate) matchesDate = false;
    } else if (movDatePeriod !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      if (movDatePeriod === 'today') {
        matchesDate = movDateStr === todayStr;
      } else if (movDatePeriod === 'week') {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
        matchesDate = movDateStr >= sevenDaysAgoStr;
      } else if (movDatePeriod === 'month') {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        matchesDate = movDateStr >= firstDayOfMonth;
      }
    }

    return matchesSearch && matchesType && matchesProduct && matchesDate;
  });

  const getMovPeriodText = () => {
    if (movDatePeriod === 'today') return "Aujourd'hui";
    if (movDatePeriod === 'week') return "7 Derniers jours";
    if (movDatePeriod === 'month') return "Ce mois";
    if (movDatePeriod === 'custom') {
      if (movStartDate && movEndDate) return `Du ${movStartDate} au ${movEndDate}`;
      if (movStartDate) return `Depuis le ${movStartDate}`;
      if (movEndDate) return `Jusqu'au ${movEndDate}`;
      return "Période Personnalisée";
    }
    return "Toutes les dates";
  };

  const totalEntreesQty = (shopStockMovements || [])
    .filter(m => m.type === 'in')
    .reduce((acc, m) => acc + (m.quantity || 0), 0);

  const totalSortiesQty = (shopStockMovements || [])
    .filter(m => m.type === 'out')
    .reduce((acc, m) => acc + (m.quantity || 0), 0);

  const handlePrint = () => {
    const reportNode = reportRef.current;
    if (!reportNode) return;

    const headHtml = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    const printWindow = window.open('', '_blank', 'width=1000,height=850');
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres surgissantes (pop-ups) pour imprimer le rapport.");
      return;
    }

    const stationTitle = config?.name || 'STATION ZIZ SERVICE';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>Rapport Inventaire Huiles & Lubrifiants - ${stationTitle}</title>
          ${headHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 0 !important;
            }
            @media print {
              @page {
                size: A4 portrait;
                margin: 0 !important;
              }
              html, body {
                margin: 0 !important;
                padding: 12mm 15mm !important;
                background-color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            body {
              background: #ffffff !important;
              margin: 0 !important;
              padding: 20px !important;
              display: flex;
              justify-content: center;
              font-family: system-ui, -apple-system, sans-serif;
            }
          </style>
        </head>
        <body>
          <div style="width:100%; max-width:210mm; margin:0 auto;">
            ${reportNode.outerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintMov = () => {
    const reportNode = movReportRef.current;
    if (!reportNode) return;

    const headHtml = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    const printWindow = window.open('', '_blank', 'width=1000,height=850');
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres surgissantes (pop-ups) pour imprimer le rapport.");
      return;
    }

    const stationTitle = config?.name || 'STATION ZIZ SERVICE';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>Rapport Mouvements Huiles & Lubrifiants - ${stationTitle}</title>
          ${headHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 0 !important;
            }
            @media print {
              @page {
                size: A4 portrait;
                margin: 0 !important;
              }
              html, body {
                margin: 0 !important;
                padding: 10mm 12mm !important;
                background-color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            body {
              background: #ffffff !important;
              margin: 0 !important;
              padding: 20px !important;
              display: flex;
              justify-content: center;
              font-family: system-ui, -apple-system, sans-serif;
            }
          </style>
        </head>
        <body>
          <div style="width:100%; max-width:210mm; margin:0 auto;">
            ${reportNode.outerHTML}
          </div>
          <script>
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.salePrice) return;

    if (editingId) {
      updateShopProduct(editingId, formData, currentUser);
    } else {
      addShopProduct({
        name: formData.name,
        photo: formData.photo || '',
        purchasePrice: formData.purchasePrice || 0,
        salePrice: formData.salePrice || 0,
        stockQuantity: formData.stockQuantity || 0,
        status: formData.status as 'active' | 'inactive'
      }, currentUser);
    }

    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', photo: '', purchasePrice: 0, salePrice: 0, stockQuantity: 0, minStockAlert: 0, status: 'active' });
  };

  const startEdit = (product: ShopProduct) => {
    setFormData(product);
    setEditingId(product.id);
    setIsAdding(true);
  };

  const filteredProducts = shopProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isAdding) {
    return (
      <div className="space-y-6">

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Package className="w-7 h-7 text-indigo-600" />
            {editingId ? 'Modifier Huile / Lubrifiant' : 'Nouveau Huile / Lubrifiant'}
          </h2>
          <button
            onClick={() => { setIsAdding(false); setEditingId(null); }}
            className="text-slate-500 hover:text-slate-700"
          >
            Annuler
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Photo du produit</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative group">
                  {formData.photo ? (
                    <>
                      <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <Camera className="w-8 h-8 text-slate-400" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <div className="text-sm text-slate-500">
                  Cliquez ou glissez une image.<br />Format recommandé: 500x500px, max 2MB.
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom du produit *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Huile Moteur 5W40"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantité en stock</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Archive className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={e => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Alerte stock minimum</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AlertTriangle className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  value={formData.minStockAlert || 0}
                  onChange={e => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prix d'achat (DH)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={e => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prix de vente (DH) *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={e => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={() => { setIsAdding(false); setEditingId(null); }}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.name || !formData.salePrice}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              {editingId ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={!!productToDelete}
        title="Supprimer le produit"
        message="Êtes-vous sûr de vouloir supprimer ce produit de la boutique ?"
        onConfirm={() => {
          if (productToDelete) {
            deleteShopProduct(productToDelete, currentUser);
          }
        }}
        onCancel={() => setProductToDelete(null)}
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Package className="w-7 h-7 text-indigo-600" />
            Huile & Lubrifiant
          </h2>
          <p className="text-slate-500 mt-1">Gestion des huiles et lubrifiants (hors carburant)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-sm font-semibold text-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimer Rapport
          </button>
          {isAdminOrManager && (
            <button
              onClick={() => {
                setFormData({ name: '', photo: '', purchasePrice: 0, salePrice: 0, stockQuantity: 0, minStockAlert: 0, status: 'active' });
                setIsAdding(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-sm"
            >
              <Plus className="w-5 h-5" />
              Nouveau Produit
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${
            activeTab === 'catalog'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package className="w-4 h-4" />
          Catalogue & Stock ({shopProducts.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          Historique Entrées / Sorties
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
            activeTab === 'history' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {(shopStockMovements || []).length}
          </span>
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm text-slate-500 font-medium">Total Produits</div>
                <div className="text-2xl font-bold text-slate-800">{shopProducts.length}</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
                <Archive className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm text-slate-500 font-medium">Quantité Totale en Stock</div>
                <div className="text-2xl font-bold text-slate-800">
                  {shopProducts.reduce((sum, p) => sum + (p.stockQuantity || 0), 0)}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg text-amber-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm text-slate-500 font-medium">Valeur Stock (Prix d'achat)</div>
                <div className="text-2xl font-bold text-slate-800">
                  {shopProducts.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.purchasePrice || 0)), 0).toFixed(2)} DH
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">Produit</th>
                    <th className="px-6 py-4 font-medium">Stock</th>
                    <th className="px-6 py-4 font-medium">Prix d'Achat</th>
                    <th className="px-6 py-4 font-medium">Prix Vente</th>
                    <th className="px-6 py-4 font-medium">Statut</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.photo ? (
                            <img src={product.photo} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <span className="font-semibold text-slate-800">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                          (product.minStockAlert !== undefined && product.stockQuantity <= product.minStockAlert) || (product.minStockAlert === undefined && product.stockQuantity <= 0) ? 'bg-rose-100 text-rose-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {product.stockQuantity} en stock
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">
                        {(product.purchasePrice || 0).toFixed(2)} DH
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {product.salePrice.toFixed(2)} DH
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          product.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {product.status === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(product)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdminOrManager && (
                            <button
                              onClick={() => setProductToDelete(product.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <Package className="w-12 h-12 text-slate-300 mb-3" />
                          <p>Aucun produit de boutique trouvé</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* History / Stock Movements Tab */
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500">Total Entrées (Quantité)</div>
                <div className="text-2xl font-bold text-emerald-600">+{totalEntreesQty} un.</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                <ArrowDownLeft className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500">Total Sorties / Ventes</div>
                <div className="text-2xl font-bold text-rose-600">-{totalSortiesQty} un.</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <History className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500">Mouvements Enregistrés</div>
                <div className="text-2xl font-bold text-slate-800">{(shopStockMovements || []).length}</div>
              </div>
            </div>
          </div>

          {/* Filters & Movements Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200 space-y-3">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full max-w-md">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={movSearchTerm}
                    onChange={e => setMovSearchTerm(e.target.value)}
                    placeholder="Rechercher par produit, motif, pompiste..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Type Filter */}
                  <select
                    value={movTypeFilter}
                    onChange={e => setMovTypeFilter(e.target.value as any)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Tous les types (Entrées & Sorties)</option>
                    <option value="in">Entrées seulement (+)</option>
                    <option value="out">Sorties / Ventes (-)</option>
                  </select>

                  {/* Product Filter */}
                  <select
                    value={movProductFilter}
                    onChange={e => setMovProductFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Tous les produits</option>
                    {shopProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => setIsMovReportModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer le rapport
                  </button>
                </div>
              </div>

              {/* Period Quick Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 mr-1 hidden sm:inline">Période:</span>
                {[
                  { id: 'all', label: 'Toutes les dates' },
                  { id: 'today', label: "Aujourd'hui" },
                  { id: 'week', label: '7 derniers jours' },
                  { id: 'month', label: 'Ce mois' },
                  { id: 'custom', label: 'Date spécifique' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setMovDatePeriod(p.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      movDatePeriod === p.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}

                {movDatePeriod === 'custom' && (
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-slate-500">Du:</span>
                      <input
                        type="date"
                        value={movStartDate}
                        onChange={(e) => setMovStartDate(e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-slate-500">Au:</span>
                      <input
                        type="date"
                        value={movEndDate}
                        onChange={(e) => setMovEndDate(e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Produit</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4 text-center">Quantité</th>
                    <th className="px-6 py-4 text-center">Stock (Avant → Après)</th>
                    <th className="px-6 py-4">Source / Motif</th>
                    <th className="px-6 py-4">Auteur / Pompiste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredMovements.map(mov => {
                    const prod = shopProducts.find(p => p.id === mov.productId);
                    const isEntry = mov.type === 'in';
                    const displayDate = mov.date ? mov.date.split(' ')[0] : '';
                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {displayDate}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            {prod?.photo ? (
                              <img src={prod.photo} alt="" className="w-8 h-8 rounded object-cover bg-slate-100" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <span>{mov.productName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEntry ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              ENTRÉE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700">
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                              SORTIE
                            </span>
                          )}
                        </td>
                        <td className={`px-6 py-4 text-center font-black font-mono text-base ${isEntry ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isEntry ? `+${mov.quantity}` : `-${mov.quantity}`}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-xs font-bold text-slate-600">
                          <span className="text-slate-400">{mov.previousStock}</span>
                          <span className="mx-1 text-slate-300">→</span>
                          <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-bold">{mov.newStock}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {mov.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          <div className="flex items-center gap-1 font-semibold text-slate-700">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            {mov.author || 'Système'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMovements.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <History className="w-10 h-10 text-slate-300" />
                          <p className="font-semibold text-slate-600">Aucun mouvement de stock enregistré</p>
                          <p className="text-xs text-slate-400">Les mouvements s'enregistrent automatiquement lors de l'ajout/modification de stock ou de la validation d'un shift avec ventes.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report & Print Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] flex flex-col print:max-w-none print:w-full print:h-full print:max-h-none print:border-none print:shadow-none print:p-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Rapport Inventaire Huiles & Lubrifiants</h3>
                  <p className="text-xs text-slate-400">Générez, téléchargez en PDF ou imprimez le rapport de stock officiel</p>
                </div>
              </div>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filters & Action Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-600">Filtrer par statut:</span>
                <select
                  value={reportFilter}
                  onChange={(e) => setReportFilter(e.target.value as any)}
                  className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Tous les produits ({shopProducts.length})</option>
                  <option value="in_stock">En stock normal</option>
                  <option value="low_stock">Stock faible / alerte</option>
                  <option value="out_of_stock">Rupture de stock</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer le rapport
                </button>
              </div>
            </div>

            {/* Modal Body - Printable Document Area */}
            <div className="p-4 overflow-y-auto flex-1 bg-slate-100 print:p-0 print:bg-white max-h-[75vh] print:max-h-none">
              {(() => {
                const filtered = shopProducts.filter(p => {
                  if (reportFilter === 'in_stock') return p.stockQuantity > (p.minStockAlert || 0);
                  if (reportFilter === 'low_stock') return p.stockQuantity <= (p.minStockAlert || 0) && p.stockQuantity > 0;
                  if (reportFilter === 'out_of_stock') return p.stockQuantity <= 0;
                  return true;
                });

                const totalQty = filtered.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
                const totalPurchaseVal = filtered.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.purchasePrice || 0)), 0);
                const totalSaleVal = filtered.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.salePrice || 0)), 0);
                const currentDateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

                return (
                  <div 
                    ref={reportRef} 
                    className="printable-shop-report bg-white text-slate-900 w-full max-w-[210mm] mx-auto p-8 sm:p-10 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 print:w-full print:max-w-none text-[11px] font-sans leading-relaxed flex flex-col justify-between min-h-[297mm]"
                  >
                    <style>{`
                      @page {
                        size: A4 portrait;
                        margin: 0 !important;
                      }
                      @media print {
                        @page {
                          size: A4 portrait;
                          margin: 0 !important;
                        }
                        html, body {
                          margin: 0 !important;
                          padding: 0 !important;
                          background-color: white !important;
                          -webkit-print-color-adjust: exact !important;
                          print-color-adjust: exact !important;
                        }
                        body * {
                          visibility: hidden !important;
                        }
                        .printable-shop-report, .printable-shop-report * {
                          visibility: visible !important;
                        }
                        .printable-shop-report {
                          position: absolute !important;
                          left: 0 !important;
                          top: 0 !important;
                          width: 100% !important;
                          min-height: 297mm !important;
                          height: 297mm !important;
                          box-sizing: border-box !important;
                          display: flex !important;
                          flex-direction: column !important;
                          justify-content: space-between !important;
                          margin: 0 !important;
                          padding: 12mm 15mm !important;
                          box-shadow: none !important;
                          border: none !important;
                        }
                        .no-print {
                          display: none !important;
                        }
                      }
                    `}</style>

                    <div className="flex-1 flex flex-col justify-start">
                      {/* Station Header */}
                      <div className="flex justify-between items-start mb-6 pb-6 border-b-2 border-slate-100">
                        <div className="space-y-2">
                          {config?.logo && (config.logo.startsWith('data:') || config.logo.startsWith('http') || config.logo.length > 5) ? (
                            <div className="mb-2">
                              <img src={config.logo} alt="Logo" className="max-h-16 max-w-[260px] object-contain" referrerPolicy="no-referrer" />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                                <Building2 className="w-5 h-5" />
                              </div>
                              <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">{config?.name || 'STATION ZIZ SERVICE'}</h1>
                            </div>
                          )}
                          {config?.logo && (config.logo.startsWith('data:') || config.logo.startsWith('http') || config.logo.length > 5) && config?.name && (
                            <h1 className="text-base font-black text-slate-900 tracking-tight uppercase">{config.name}</h1>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="inline-block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider mb-2">
                            Rapport d'inventaire
                          </span>
                          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Huiles & Lubrifiants</h2>
                          <div className="text-[10px] text-slate-500 font-semibold space-y-0.5 mt-2">
                            <p><span className="text-slate-400">Date :</span> <strong className="text-slate-800">{currentDateStr}</strong></p>
                            <p><span className="text-slate-400">Généré par :</span> <strong className="text-slate-800">{currentUser}</strong></p>
                          </div>
                        </div>
                      </div>

                      {/* KPI Metric Summary Cards */}
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Références</div>
                          <div className="text-base font-black text-slate-900 mt-0.5">{filtered.length} <span className="text-xs font-normal text-slate-500">produits</span></div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Quantité Totale</div>
                          <div className="text-base font-black text-slate-900 mt-0.5">{totalQty} <span className="text-xs font-normal text-slate-500">unités</span></div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Valeur Stock (Vente)</div>
                          <div className="text-base font-black text-emerald-700 mt-0.5 font-mono">{totalSaleVal.toFixed(2)} <span className="text-xs font-normal text-slate-500">DH</span></div>
                        </div>
                      </div>

                      {/* Products Inventory Table */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                        <table className="w-full text-left text-[10px]">
                          <thead className="bg-slate-100 text-slate-600 font-black uppercase text-[9px] border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3 text-center">#</th>
                              <th className="py-2.5 px-3">Désignation Produit</th>
                              <th className="py-2.5 px-3 text-right">P. Vente</th>
                              <th className="py-2.5 px-3 text-center">Quantité</th>
                              <th className="py-2.5 px-3 text-right">Total Vente</th>
                              <th className="py-2.5 px-3 text-center">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filtered.map((p, idx) => {
                              const isLow = (p.minStockAlert !== undefined && p.stockQuantity <= p.minStockAlert) || (p.minStockAlert === undefined && p.stockQuantity <= 0);
                              const isOut = p.stockQuantity <= 0;
                              const saleVal = (p.stockQuantity || 0) * (p.salePrice || 0);

                              return (
                                <tr key={p.id} className="hover:bg-slate-50">
                                  <td className="py-2 px-3 text-slate-400 text-center">{idx + 1}</td>
                                  <td className="py-2 px-3 font-bold text-slate-900">{p.name}</td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{(p.salePrice || 0).toFixed(2)} DH</td>
                                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">{p.stockQuantity || 0}</td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">{saleVal.toFixed(2)} DH</td>
                                  <td className="py-2 px-3 text-center">
                                    {isOut ? (
                                      <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[9px] font-black">Rupture</span>
                                    ) : isLow ? (
                                      <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[9px] font-black">Alerte Stock</span>
                                    ) : (
                                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-black">En Stock</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            {filtered.length === 0 && (
                              <tr>
                                <td colSpan={6} className="py-6 text-center text-slate-400 font-medium">
                                  Aucun produit ne correspond aux filtres de recherche.
                                </td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                            <tr>
                              <td colSpan={3} className="py-2.5 px-3 text-right uppercase text-[9px] text-slate-500">TOTAL GÉNÉRAL</td>
                              <td className="py-2.5 px-3 text-center font-mono text-xs">{totalQty}</td>
                              <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{totalSaleVal.toFixed(2)} DH</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 print:hidden">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Movements Report Modal */}
      {isMovReportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Rapport Historique des Mouvements</h3>
                  <p className="text-xs text-slate-400">Impression officielle des entrées et sorties de stock (Huiles & Lubrifiants)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintMov}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer le rapport
                </button>
                <button 
                  onClick={() => setIsMovReportModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content Body */}
            <div className="p-4 overflow-y-auto flex-1 bg-slate-100 max-h-[75vh]">
              {(() => {
                const totalIn = filteredMovements.filter(m => m.type === 'in').reduce((sum, m) => sum + (m.quantity || 0), 0);
                const totalOut = filteredMovements.filter(m => m.type === 'out').reduce((sum, m) => sum + (m.quantity || 0), 0);
                const currentDateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

                return (
                  <div 
                    ref={movReportRef} 
                    className="bg-white text-slate-900 w-full max-w-[210mm] mx-auto p-8 rounded-xl shadow-lg border border-slate-200 text-[11px] font-sans leading-relaxed space-y-6"
                  >
                    {/* Station Header */}
                    <div className="flex justify-between items-start pb-4 border-b-2 border-slate-900">
                      <div>
                        {config?.logo && (config.logo.startsWith('data:') || config.logo.startsWith('http') || config.logo.length > 5) ? (
                          <div className="mb-2">
                            <img src={config.logo} alt="Logo" className="max-h-16 max-w-[260px] object-contain" referrerPolicy="no-referrer" />
                          </div>
                        ) : null}
                        <h1 className="text-xl font-black text-slate-900 tracking-wider uppercase">{config?.name || 'STATION ZIZ SERVICE'}</h1>
                        <p className="text-xs font-bold text-slate-600 uppercase">RAPPORT DES MOUVEMENTS DE STOCK - HUILES & LUBRIFIANTS</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Période: <strong className="text-slate-800">{getMovPeriodText()}</strong> | Généré le: <strong>{currentDateStr}</strong>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-black rounded-md border border-indigo-200 uppercase">
                          DOCUMENT OFFICIEL
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">Généré par : {currentUser}</p>
                      </div>
                    </div>

                    {/* KPI Summary Cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Entrées</div>
                        <div className="text-base font-black text-emerald-600 mt-0.5">+{totalIn} <span className="text-xs font-normal text-slate-500">unités</span></div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Sorties / Ventes</div>
                        <div className="text-base font-black text-rose-600 mt-0.5">-{totalOut} <span className="text-xs font-normal text-slate-500">unités</span></div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Opérations</div>
                        <div className="text-base font-black text-slate-900 mt-0.5">{filteredMovements.length} <span className="text-xs font-normal text-slate-500">mouvements</span></div>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-[10px]">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[9px] border-b border-slate-200">
                          <tr>
                            <th className="p-2 border-r border-slate-200 text-center">#</th>
                            <th className="p-2 border-r border-slate-200">Date</th>
                            <th className="p-2 border-r border-slate-200">Produit</th>
                            <th className="p-2 border-r border-slate-200 text-center">Type</th>
                            <th className="p-2 border-r border-slate-200 text-center">Quantité</th>
                            <th className="p-2 border-r border-slate-200 text-center">Stock (Avant → Après)</th>
                            <th className="p-2 border-r border-slate-200">Source / Motif</th>
                            <th className="p-2 text-left">Auteur / Pompiste</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredMovements.map((mov, idx) => {
                            const isEntry = mov.type === 'in';
                            const displayDate = mov.date ? mov.date.split(' ')[0] : '';
                            return (
                              <tr key={mov.id} className="hover:bg-slate-50">
                                <td className="p-2 border-r border-slate-200 text-center text-slate-500">{idx + 1}</td>
                                <td className="p-2 border-r border-slate-200 font-semibold">{displayDate}</td>
                                <td className="p-2 border-r border-slate-200 font-bold text-slate-800">{mov.productName}</td>
                                <td className="p-2 border-r border-slate-200 text-center">
                                  {isEntry ? (
                                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-black">ENTRÉE</span>
                                  ) : (
                                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[9px] font-black">SORTIE</span>
                                  )}
                                </td>
                                <td className={`p-2 border-r border-slate-200 text-center font-mono font-black ${isEntry ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {isEntry ? `+${mov.quantity}` : `-${mov.quantity}`}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-center font-mono font-semibold text-slate-600">
                                  {mov.previousStock} → {mov.newStock}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-slate-700">{mov.reason}</td>
                                <td className="p-2 font-medium text-slate-700">{mov.author || 'Système'}</td>
                              </tr>
                            );
                          })}
                          {filteredMovements.length === 0 && (
                            <tr>
                              <td colSpan={8} className="p-6 text-center text-slate-400 font-medium">
                                Aucun mouvement de stock trouvé pour la période sélectionnée.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setIsMovReportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
