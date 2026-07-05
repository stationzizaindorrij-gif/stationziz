import React, { useState } from 'react';
import { 
  Fuel, Plus, CheckCircle, AlertTriangle, Edit2, Trash2, 
  Settings, Layers, Link, Sliders, Play, X, SlidersHorizontal 
} from 'lucide-react';
import { ERPStoreType } from '../store';
import { Product, Pump, Nozzle } from '../types';

interface AssetsProps {
  store: ERPStoreType;
}

export default function Assets({ store }: AssetsProps) {
  const { 
    products, pumps, nozzles, tanks, addProduct, updateProduct, 
    addPump, updatePump, deletePump, addNozzle, updateNozzle, deleteNozzle, currentRole 
  } = store;

  // Tab for products vs pumps vs nozzles
  const [activeTab, setActiveTab] = useState<'products' | 'pumps' | 'nozzles'>('products');

  // Addition forms toggles
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isPumpFormOpen, setIsPumpFormOpen] = useState(false);
  const [isNozzleFormOpen, setIsNozzleFormOpen] = useState(false);

  // Edit states
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editPump, setEditPump] = useState<Pump | null>(null);
  const [editNozzle, setEditNozzle] = useState<Nozzle | null>(null);

  // Form Fields - Product
  const [pName, setPName] = useState('');
  const [pType, setPType] = useState<Product['type']>('gazoil');
  const [pPurchasePrice, setPPurchasePrice] = useState('');
  const [pSalePrice, setPSalePrice] = useState('');
  const [pVat, setPVat] = useState('20');
  const [pStatus, setPStatus] = useState<'active' | 'inactive'>('active');

  // Form Fields - Pump
  const [pNumber, setPNumber] = useState('');
  const [pManufacturer, setPManufacturer] = useState('');
  const [pSerial, setPSerial] = useState('');
  const [pPumpStatus, setPPumpStatus] = useState<Pump['status']>('active');

  // Form Fields - Nozzle
  const [nozName, setNozName] = useState('');
  const [nozProdId, setNozProdId] = useState('');
  const [nozPumpId, setNozPumpId] = useState('');
  const [nozTankId, setNozTankId] = useState('');
  const [nozMech, setNozMech] = useState('10000');
  const [nozElec, setNozElec] = useState('10000');
  const [nozStatus, setNozStatus] = useState<Nozzle['status']>('active');

  const hasWriteAccess = currentRole === 'admin' || currentRole === 'manager';

  // 1. PRODUCTS SUBMISSION
  const handleOpenProductForm = (prod?: Product) => {
    if (prod) {
      setEditProduct(prod);
      setPName(prod.name);
      setPType(prod.type);
      setPPurchasePrice(prod.purchasePrice.toString());
      setPSalePrice(prod.salePrice.toString());
      setPVat(prod.vatRate.toString());
      setPStatus(prod.status);
    } else {
      setEditProduct(null);
      setPName('');
      setPType('gazoil');
      setPPurchasePrice('1.45');
      setPSalePrice('1.85');
      setPVat('20');
      setPStatus('active');
    }
    setIsProductFormOpen(true);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const purchase = parseFloat(pPurchasePrice);
    const sale = parseFloat(pSalePrice);
    const vat = parseFloat(pVat);

    if (isNaN(purchase) || isNaN(sale) || isNaN(vat)) {
      alert("Veuillez saisir des montants numériques valides.");
      return;
    }

    const payload = {
      name: pName,
      type: pType,
      purchasePrice: purchase,
      salePrice: sale,
      vatRate: vat,
      status: pStatus
    };

    if (editProduct) {
      updateProduct(editProduct.id, payload, 'Directeur ERP');
    } else {
      addProduct(payload, 'Directeur ERP');
    }
    setIsProductFormOpen(false);
  };

  // 2. PUMPS SUBMISSION
  const handleOpenPumpForm = (pump?: Pump) => {
    if (pump) {
      setEditPump(pump);
      setPNumber(pump.number);
      setPManufacturer(pump.manufacturer);
      setPSerial(pump.serialNumber);
      setPPumpStatus(pump.status);
    } else {
      setEditPump(null);
      setPNumber(`Pompe ${String(pumps.length + 1).padStart(2, '0')}`);
      setPManufacturer('Tokheim');
      setPSerial(`TK-${Math.floor(10000 + Math.random() * 90000)}-A`);
      setPPumpStatus('active');
    }
    setIsPumpFormOpen(true);
  };

  const handlePumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      number: pNumber,
      manufacturer: pManufacturer,
      serialNumber: pSerial,
      status: pPumpStatus
    };

    if (editPump) {
      updatePump(editPump.id, payload, 'Directeur ERP');
    } else {
      addPump(payload, 'Directeur ERP');
    }
    setIsPumpFormOpen(false);
  };

  // 3. NOZZLES SUBMISSION
  const handleOpenNozzleForm = (noz?: Nozzle) => {
    if (noz) {
      setEditNozzle(noz);
      setNozName(noz.name);
      setNozProdId(noz.productId);
      setNozPumpId(noz.pumpId);
      setNozTankId(noz.tankId);
      setNozMech(noz.currentMechCounter.toString());
      setNozElec(noz.currentElecCounter.toString());
      setNozStatus(noz.status);
    } else {
      setEditNozzle(null);
      setNozName(`Pistolet ${nozzles.length + 1}`);
      setNozProdId(products[0]?.id || '');
      setNozPumpId(pumps[0]?.id || '');
      setNozTankId(tanks[0]?.id || '');
      setNozMech('50000');
      setNozElec('50000');
      setNozStatus('active');
    }
    setIsNozzleFormOpen(true);
  };

  const handleNozzleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mech = parseFloat(nozMech);
    const elec = parseFloat(nozElec);

    if (isNaN(mech) || isNaN(elec)) {
      alert("Les compteurs doivent être des nombres.");
      return;
    }

    const pumpObj = pumps.find(p => p.id === nozPumpId);
    const prodObj = products.find(p => p.id === nozProdId);
    const tankObj = tanks.find(t => t.id === nozTankId);

    if (!pumpObj || !prodObj || !tankObj) {
      alert("Associez une pompe, un carburant et une cuve existante.");
      return;
    }

    const payload = {
      name: nozName,
      productId: nozProdId,
      productName: prodObj.name,
      pumpId: nozPumpId,
      pumpNumber: pumpObj.number,
      tankId: nozTankId,
      tankNumber: tankObj.number,
      currentMechCounter: mech,
      currentElecCounter: elec,
      status: nozStatus
    };

    if (editNozzle) {
      updateNozzle(editNozzle.id, payload, 'Directeur ERP');
    } else {
      addNozzle(payload, 'Directeur ERP');
    }
    setIsNozzleFormOpen(false);
  };

  return (
    <div className="space-y-6" id="assets-view">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Installations & Equipements</h1>
          <p className="text-sm text-slate-500">Configurez votre grille tarifaire, declarez de nouvelles pompes de distribution et étalonnez les pistolets.</p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 shrink-0">
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'products' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Carburants & Prix
          </button>
          <button 
            onClick={() => setActiveTab('pumps')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'pumps' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Distributeurs (Pompes)
          </button>
          <button 
            onClick={() => setActiveTab('nozzles')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'nozzles' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Pistolets & Compteurs
          </button>
        </div>
      </div>

      {/* 1. CARBURANTS ET PRIX */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Grille des tarifs réglementés de distribution de carburant.</span>
            {hasWriteAccess && (
              <button 
                onClick={() => handleOpenProductForm()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                + Ajouter Carburant
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map(prod => (
              <div key={prod.id} className={`bg-white border rounded-xl overflow-hidden p-5 shadow-xs flex flex-col justify-between ${prod.status === 'inactive' ? 'border-slate-200 opacity-60' : 'border-slate-200'}`}>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="p-2.5 bg-sky-50 text-sky-600 rounded-lg">
                      <Fuel className="w-5 h-5" />
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      prod.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {prod.status === 'active' ? 'En vente' : 'Suspendu'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 font-display text-base">{prod.name}</h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Taxe (TVA): {prod.vatRate}%</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs font-mono">
                    <div className="bg-slate-50 p-2 rounded text-center border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-sans block">Achat (Moyenne)</span>
                      <strong className="text-slate-700">{prod.purchasePrice.toFixed(3)} MAD</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded text-center border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-sans block">Vente Pompe</span>
                      <strong className="text-indigo-600">{prod.salePrice.toFixed(3)} MAD</strong>
                    </div>
                  </div>
                </div>

                {hasWriteAccess && (
                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
                    <button 
                      onClick={() => handleOpenProductForm(prod)}
                      className="px-2.5 py-1 hover:bg-slate-100 rounded text-xs font-semibold text-indigo-600 transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Modifier Prix
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. DISTRIBUTEURS (POMPES) */}
      {activeTab === 'pumps' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Réseau de terminaux de piste de la station.</span>
            {hasWriteAccess && (
              <button 
                onClick={() => handleOpenPumpForm()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                + Ajouter une Pompe
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {pumps.map(pump => {
              const pumpNozzles = nozzles.filter(n => n.pumpId === pump.id);
              return (
                <div key={pump.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden p-5 shadow-xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-900 font-display text-base">{pump.number}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        pump.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : pump.status === 'maintenance' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-rose-50 text-rose-700'
                      }`}>
                        {pump.status === 'active' ? 'Disponible' : pump.status === 'maintenance' ? 'Maintenance' : 'Hors Service'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                      <div>Fabricant: <strong className="text-slate-700">{pump.manufacturer}</strong></div>
                      <div>N° Série: <strong className="text-slate-700 font-mono text-[11px]">{pump.serialNumber}</strong></div>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Pistolets installés ({pumpNozzles.length})</span>
                      <div className="flex flex-col gap-1 text-[11px]">
                        {pumpNozzles.map(noz => (
                          <div key={noz.id} className="flex justify-between items-center text-slate-500 py-0.5">
                            <span className="font-medium text-slate-700">{noz.name}</span>
                            <span>{noz.productName.split(' ')[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {hasWriteAccess && (
                    <div className="flex justify-end gap-1 pt-3 border-t border-slate-100 mt-4">
                      <button 
                        onClick={() => handleOpenPumpForm(pump)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => deletePump(pump.id, 'Directeur ERP')}
                        className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. PISTOLETS ET COMPTEURS */}
      {activeTab === 'nozzles' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Étalonnage et journal d'indexation des pistolets</h3>
            {hasWriteAccess && (
              <button 
                onClick={() => handleOpenNozzleForm()}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                + Ajouter un Pistolet
              </button>
            )}
          </div>

          <div className="overflow-x-auto text-xs text-left">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600">
                  <th className="p-3">Désignation</th>
                  <th className="p-3">Carburant</th>
                  <th className="p-3">Distributeur</th>
                  <th className="p-3">Cuve reliée</th>
                  <th className="p-3">Index Électronique</th>
                  <th className="p-3">Index Mécanique</th>
                  <th className="p-3">Statut</th>
                  {hasWriteAccess && <th className="p-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {nozzles.map(noz => (
                  <tr key={noz.id} className="hover:bg-[#f8fafc99] transition-colors">
                    <td className="p-3 font-sans font-bold text-slate-800">{noz.name}</td>
                    <td className="p-3 font-sans">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold">
                        {noz.productName}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-slate-600">{noz.pumpNumber}</td>
                    <td className="p-3 font-sans text-slate-400">{noz.tankNumber}</td>
                    <td className="p-3 text-right text-slate-700 font-bold">{noz.currentElecCounter.toLocaleString()} L</td>
                    <td className="p-3 text-right text-slate-700 font-bold">{noz.currentMechCounter.toLocaleString()} L</td>
                    <td className="p-3">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border font-sans ${
                        noz.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {noz.status === 'active' ? 'Opérationnel' : 'Défectueux'}
                      </span>
                    </td>
                    {hasWriteAccess && (
                      <td className="p-3 text-right font-sans">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => handleOpenNozzleForm(noz)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => deleteNozzle(noz.id, 'Directeur ERP')}
                            className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORMULAIRE CARBURANT MODAL */}
      {isProductFormOpen && (
        <div className="fixed inset-0 bg-[#0f172a99] backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex justify-between items-center bg-slate-900 text-white px-5 py-4">
              <h3 className="font-bold font-display">{editProduct ? 'Modifier Tarifs Carburant' : 'Ajouter un Carburant'}</h3>
              <button onClick={() => setIsProductFormOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Désignation du produit</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Sans Plomb"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Type carburant</label>
                  <select 
                    value={pType}
                    onChange={(e) => setPType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="gazoil">Gazoil / Diesel</option>
                    <option value="sans_plomb">Sans Plomb</option>
                    <option value="melange">Mélange</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Taux TVA (%)</label>
                  <input 
                    type="number" 
                    required
                    value={pVat}
                    onChange={(e) => setPVat(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Prix Achat Estimé (MAD/L)</label>
                  <input 
                    type="number" 
                    step="any"
                    required
                    value={pPurchasePrice}
                    onChange={(e) => setPPurchasePrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Prix Vente Pompe (MAD/L)</label>
                  <input 
                    type="number" 
                    step="any"
                    required
                    value={pSalePrice}
                    onChange={(e) => setPSalePrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Statut commercial</label>
                <select 
                  value={pStatus}
                  onChange={(e) => setPStatus(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="active">Actif (En vente)</option>
                  <option value="inactive">Suspendu</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsProductFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORMULAIRE POMPE MODAL */}
      {isPumpFormOpen && (
        <div className="fixed inset-0 bg-[#0f172a99] backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex justify-between items-center bg-slate-900 text-white px-5 py-4">
              <h3 className="font-bold font-display">{editPump ? 'Modifier Pompe' : 'Ajouter une Pompe'}</h3>
              <button onClick={() => setIsPumpFormOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePumpSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Numéro/Nom du terminal</label>
                <input 
                  type="text" 
                  required
                  value={pNumber}
                  onChange={(e) => setPNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Fabricant</label>
                  <input 
                    type="text" 
                    required
                    value={pManufacturer}
                    onChange={(e) => setPManufacturer(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Numéro de série</label>
                  <input 
                    type="text" 
                    required
                    value={pSerial}
                    onChange={(e) => setPSerial(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Statut opérationnel</label>
                <select 
                  value={pPumpStatus}
                  onChange={(e) => setPPumpStatus(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="active">Actif (Opérationnel)</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="offline">Hors ligne / En panne</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsPumpFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORMULAIRE PISTOLET MODAL */}
      {isNozzleFormOpen && (
        <div className="fixed inset-0 bg-[#0f172a99] backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex justify-between items-center bg-slate-900 text-white px-5 py-4">
              <h3 className="font-bold font-display">{editNozzle ? 'Modifier Pistolet' : 'Ajouter un Pistolet'}</h3>
              <button onClick={() => setIsNozzleFormOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleNozzleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Désignation pistolet</label>
                <input 
                  type="text" 
                  required
                  value={nozName}
                  onChange={(e) => setNozName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Carburant</label>
                  <select 
                    value={nozProdId}
                    onChange={(e) => setNozProdId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name.split(' ')[0]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Pompe</label>
                  <select 
                    value={nozPumpId}
                    onChange={(e) => setNozPumpId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    {pumps.map(p => (
                      <option key={p.id} value={p.id}>{p.number}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Cuve relie</label>
                  <select 
                    value={nozTankId}
                    onChange={(e) => setNozTankId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    {tanks.map(t => (
                      <option key={t.id} value={t.id}>{t.number.split(' ')[1]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Compteur Électronique (L)</label>
                  <input 
                    type="number" 
                    required
                    value={nozElec}
                    onChange={(e) => setNozElec(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Compteur Mécanique (L)</label>
                  <input 
                    type="number" 
                    required
                    value={nozMech}
                    onChange={(e) => setNozMech(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Statut matériel</label>
                <select 
                  value={nozStatus}
                  onChange={(e) => setNozStatus(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="active">Opérationnel</option>
                  <option value="defective">Défectueux</option>
                  <option value="maintenance">En maintenance</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsNozzleFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
