import { ConfirmModal } from "./ConfirmModal";
import React, { useState, useRef } from 'react';
import { Package, Plus, Search, Edit2, Trash2, Camera, Tag, DollarSign, Archive, Check, AlertTriangle, Printer, X, Filter, Building2 } from 'lucide-react';
import { ERPStoreType } from '../store';
import { ShopProduct } from '../types';

interface ShopProps { store: ERPStoreType; }

export const Shop: React.FC<ShopProps> = ({ store }) => {
  const { shopProducts, addShopProduct, updateShopProduct, deleteShopProduct, currentRole, users, config } = store;
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportFilter, setReportFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const reportRef = useRef<HTMLDivElement>(null);

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
                <th className="px-6 py-4 font-medium">Prix Vente</th>
                <th className="px-6 py-4 font-medium">Stock</th>
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
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">
                    {product.salePrice.toFixed(2)} DH
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                      (product.minStockAlert !== undefined && product.stockQuantity <= product.minStockAlert) || (product.minStockAlert === undefined && product.stockQuantity <= 0) ? 'bg-rose-100 text-rose-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {product.stockQuantity} en stock
                    </span>
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
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
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
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 mb-1">
                            {config?.logo && (config.logo.startsWith('data:') || config.logo.startsWith('http') || config.logo.length > 5) ? (
                              <img src={config.logo} alt="Logo" className="w-8 h-8 object-cover rounded" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                                <Building2 className="w-4 h-4" />
                              </div>
                            )}
                            <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">{config?.name || 'STATION ZIZ SERVICE'}</h1>
                          </div>
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
                      <div className="grid grid-cols-4 gap-3 mb-6">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Références</div>
                          <div className="text-base font-black text-slate-900 mt-0.5">{filtered.length} <span className="text-xs font-normal text-slate-500">produits</span></div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Quantité Totale</div>
                          <div className="text-base font-black text-slate-900 mt-0.5">{totalQty} <span className="text-xs font-normal text-slate-500">unités</span></div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Valeur Stock (Achat)</div>
                          <div className="text-base font-black text-slate-900 mt-0.5 font-mono">{totalPurchaseVal.toFixed(2)} <span className="text-xs font-normal text-slate-500">DH</span></div>
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
                              <th className="py-2.5 px-3 text-right">P. Achat</th>
                              <th className="py-2.5 px-3 text-right">P. Vente</th>
                              <th className="py-2.5 px-3 text-center">Quantité</th>
                              <th className="py-2.5 px-3 text-right">Total Achat</th>
                              <th className="py-2.5 px-3 text-right">Total Vente</th>
                              <th className="py-2.5 px-3 text-center">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filtered.map((p, idx) => {
                              const isLow = (p.minStockAlert !== undefined && p.stockQuantity <= p.minStockAlert) || (p.minStockAlert === undefined && p.stockQuantity <= 0);
                              const isOut = p.stockQuantity <= 0;
                              const purchaseVal = (p.stockQuantity || 0) * (p.purchasePrice || 0);
                              const saleVal = (p.stockQuantity || 0) * (p.salePrice || 0);

                              return (
                                <tr key={p.id} className="hover:bg-slate-50">
                                  <td className="py-2 px-3 text-slate-400 text-center">{idx + 1}</td>
                                  <td className="py-2 px-3 font-bold text-slate-900">{p.name}</td>
                                  <td className="py-2 px-3 text-right font-mono">{(p.purchasePrice || 0).toFixed(2)} DH</td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{(p.salePrice || 0).toFixed(2)} DH</td>
                                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">{p.stockQuantity || 0}</td>
                                  <td className="py-2 px-3 text-right font-mono font-medium text-slate-700">{purchaseVal.toFixed(2)} DH</td>
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
                                <td colSpan={8} className="py-6 text-center text-slate-400 font-medium">
                                  Aucun produit ne correspond aux filtres de recherche.
                                </td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                            <tr>
                              <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-[9px] text-slate-500">TOTAL GÉNÉRAL</td>
                              <td className="py-2.5 px-3 text-center font-mono text-xs">{totalQty}</td>
                              <td className="py-2.5 px-3 text-right font-mono">{totalPurchaseVal.toFixed(2)} DH</td>
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
    </div>
  );
};
