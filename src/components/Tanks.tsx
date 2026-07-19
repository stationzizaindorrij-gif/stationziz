import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { 
  Fuel, Plus, History, RotateCcw, AlertTriangle, CheckCircle, ArrowUpRight, 
  Settings, ClipboardList, Info, ArrowDown, Calendar, Search, Trash2, Sliders, X, Droplet, MoreVertical, Edit, FileText, BarChart2, CheckCircle2, XCircle, Power, Activity 
} from 'lucide-react';
import { ERPStoreType } from '../store';
import { Tank, Product, Nozzle, Pump, Supply, StockCorrection } from '../types';
import { ConfirmModal } from './ConfirmModal';

// Helper function to get fuel properties and colors: Vert -> Gazoil, Bleu -> Sans Plomb, Orange -> Mélange
const getFuelColor = (productNameOrId: string, customHex?: string) => {
  const pid = (productNameOrId || '').toLowerCase();
  const displayName = productNameOrId && !productNameOrId.startsWith('prod_') ? productNameOrId : undefined;
  
  let res;
  if (pid.includes('gazoil') || pid.includes('diesel')) {
    res = {
      name: displayName || 'Gazoil',
      hex: '#10b981', // green-500
      text: 'text-emerald-600',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      stroke: 'stroke-emerald-500',
      fill: 'fill-emerald-500'
    };
  } else if (pid.includes('sans_plomb') || pid.includes('sans plomb') || pid.includes('sp')) {
    res = {
      name: displayName || 'Sans Plomb',
      hex: '#3b82f6', // blue-500
      text: 'text-blue-600',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      stroke: 'stroke-blue-500',
      fill: 'fill-blue-500'
    };
  } else if (pid.includes('melange') || pid.includes('mélange')) {
    res = {
      name: displayName || 'Mélange',
      hex: '#f97316', // orange-500
      text: 'text-orange-600',
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      stroke: 'stroke-orange-500',
      fill: 'fill-orange-500'
    };
  } else {
    // Default / Unknown (uses the provided string or "Autre")
    res = {
      name: displayName || 'Carburant',
      hex: '#8b5cf6', // violet-500
      text: 'text-violet-600',
      bg: 'bg-violet-50 text-violet-700 border-violet-200',
      stroke: 'stroke-violet-500',
      fill: 'fill-violet-500'
    };
  }
  
  if (customHex) {
    res.hex = customHex;
  }
  return res;
}

interface TanksProps {
  store: ERPStoreType;
}

export default function Tanks({ store }: TanksProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setStartY(e.pageY - containerRef.current.offsetTop);
    setScrollLeft(containerRef.current.scrollLeft);
    setScrollTop(containerRef.current.scrollTop);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const y = e.pageY - containerRef.current.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    containerRef.current.scrollLeft = scrollLeft - walkX;
    containerRef.current.scrollTop = scrollTop - walkY;
  };

  const { 
    tanks, products, supplies, stockCorrections, addSupply, correctTankLevel, deleteStockCorrection, updateStockCorrection, currentRole,
    nozzles = [], pumps = [], sales = [], shifts = []
  } = store;

  const requiredHeight = Math.max(
    580,
    70 + tanks.length * 130 + 50,
    70 + pumps.length * 130 + 50,
    35 + nozzles.length * 52 + 50
  );


  // Navigation tab inside Tanks & Stock
  const [activeSubTab, setActiveSubTab] = useState<'visual' | 'deliveries' | 'corrections' | 'schema'>('visual');

  // Interactive schema selection states
  const [selectedNodeType, setSelectedNodeType] = useState<'tank' | 'pump' | 'nozzle' | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Helper to check if a specific nozzle/flow line is highlighted
  const isLineHighlighted = (noz: Nozzle) => {
    if (!selectedNodeType) return true;
    if (selectedNodeType === 'tank') return noz.tankId === selectedNodeId;
    if (selectedNodeType === 'pump') return noz.pumpId === selectedNodeId;
    if (selectedNodeType === 'nozzle') return noz.id === selectedNodeId;
    return false;
  };

  // Helper to determine the opacity of connection lines
  const getLineOpacity = (noz: Nozzle) => {
    if (!selectedNodeType) return '0.45';
    return isLineHighlighted(noz) ? '1' : '0.08';
  };

  // Helper to determine the width of connection lines
  const getLineWidth = (noz: Nozzle) => {
    if (!selectedNodeType) return '2';
    return isLineHighlighted(noz) ? '4' : '1.2';
  };

  // Form states
    const [confirmModalConfig, setConfirmModalConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void} | null>(null);
  const [isTankFormOpen, setIsTankFormOpen] = useState(false);
  const [editingTank, setEditingTank] = useState<Tank | null>(null);
  const [isTankDetailOpen, setIsTankDetailOpen] = useState(false);
  const [selectedTankDetail, setSelectedTankDetail] = useState<Tank | null>(null);
  const [isTankHistoryOpen, setIsTankHistoryOpen] = useState(false);
  const [selectedTankHistory, setSelectedTankHistory] = useState<Tank | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [tankToDelete, setTankToDelete] = useState<string | null>(null);
  const [tankToDeactivate, setTankToDeactivate] = useState<string | null>(null);

  const handleOpenTankForm = (tank?: Tank) => {
    setEditingTank(tank || null);
    setIsTankFormOpen(true);
  };

  const [isSupplyFormOpen, setIsSupplyFormOpen] = useState(false);
  const [supplyToDelete, setSupplyToDelete] = useState<string | null>(null);
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
  const [isCorrectionFormOpen, setIsCorrectionFormOpen] = useState(false);
  const [correctionToDelete, setCorrectionToDelete] = useState<string | null>(null);
  const [editingCorrection, setEditingCorrection] = useState<StockCorrection | null>(null);

  // Supply Delivery Form state
  const [supplier, setSupplier] = useState('');
  const [supplyTankId, setSupplyTankId] = useState('');
  const [qtyDelivered, setQtyDelivered] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplyDate, setSupplyDate] = useState((new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]));

  // Correction Form state
  const [corrTankId, setCorrTankId] = useState('');
  const [newLevel, setNewLevel] = useState('');
  const [corrReason, setCorrReason] = useState('');
  const [corrDate, setCorrDate] = useState((new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]));
  const [correctionFilterDate, setCorrectionFilterDate] = useState('');

  const hasWriteAccess = currentRole === 'admin' || currentRole === 'manager';

  const handleOpenSupplyForm = (tankId?: string, supply?: Supply) => {
    if (supply) {
      setEditingSupply(supply);
      setSupplier(supply.supplier);
      setSupplyTankId(supply.tankId);
      setQtyDelivered(supply.qtyDelivered.toString());
      setPurchasePrice(supply.purchasePrice.toString());
      setInvoiceNumber(supply.invoiceNumber);
      setSupplyDate(supply.date ? new Date(supply.date).toISOString().split('T')[0] : (new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]));
    } else {
      setEditingSupply(null);
      setSupplier('');
      setSupplyTankId(tankId || (tanks[0]?.id || ''));
      setQtyDelivered('5000');
      setPurchasePrice('');
      setInvoiceNumber(`INV-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      setSupplyDate((new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]));
      
      // Autofill purchase price from products price
      const initialTank = tanks.find(t => t.id === (tankId || tanks[0]?.id));
      if (initialTank) {
        const prod = products.find(p => p.id === initialTank.productId);
        if (prod) setPurchasePrice(prod.purchasePrice.toString());
      }
    }

    setIsSupplyFormOpen(true);
  };

  const handleSupplyTankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tankId = e.target.value;
    setSupplyTankId(tankId);
    const selectedTank = tanks.find(t => t.id === tankId);
    if (selectedTank) {
      const prod = products.find(p => p.id === selectedTank.productId);
      if (prod) setPurchasePrice(prod.purchasePrice.toString());
    }
  };

  const handleSupplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier || !supplyTankId || !qtyDelivered || !purchasePrice || !invoiceNumber) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const tank = tanks.find(t => t.id === supplyTankId);
    if (!tank) return;

    const qty = parseFloat(qtyDelivered);
    const price = parseFloat(purchasePrice);

    if (isNaN(qty) || qty <= 0) {
      alert("La quantité doit être un nombre supérieur à zéro.");
      return;
    }
    if (isNaN(price) || price <= 0) {
      alert("Le prix d'achat doit être un nombre supérieur à zéro.");
      return;
    }

    const executeSupply = () => {
      if (editingSupply) {
        store.updateSupply(editingSupply.id, {
          supplier,
          productId: tank.productId,
          productName: tank.productName,
          tankId: tank.id,
          tankNumber: tank.number,
          qtyDelivered: qty,
          purchasePrice: price,
          invoiceNumber,
          date: supplyDate ? new Date(supplyDate).toISOString() : new Date().toISOString()
        }, currentRole);
      } else {
        addSupply({
          supplier,
          productId: tank.productId,
          productName: tank.productName,
          tankId: tank.id,
          tankNumber: tank.number,
          qtyDelivered: qty,
          purchasePrice: price,
          invoiceNumber,
          date: supplyDate ? new Date(supplyDate).toISOString() : new Date().toISOString()
        }, currentRole);
      }

      setSupplier('');
      setSupplyTankId('');
      setQtyDelivered('');
      setPurchasePrice('');
      setInvoiceNumber('');
      setEditingSupply(null);
      setIsSupplyFormOpen(false);
    };

    // Check if delivery overflows tank
    const currentQty = editingSupply && editingSupply.tankId === tank.id ? editingSupply.qtyDelivered : 0;
    if (tank.currentLevel - currentQty + qty > tank.capacity) {
      setConfirmModalConfig({
        isOpen: true,
        title: 'Risque de débordement',
        message: `Attention: La quantité livrée (${qty} L) cumulée au niveau actuel (${tank.currentLevel.toFixed(2)} L) dépasse la capacité totale de la cuve (${tank.capacity} L). Souhaitez-vous quand même forcer la livraison au niveau maximum ?`,
        onConfirm: executeSupply
      });
      return;
    }

    executeSupply();
  };

  const handleOpenCorrectionForm = (tankId?: string, corr?: StockCorrection) => {
    if (corr) {
      setEditingCorrection(corr);
      setCorrTankId(corr.tankId);
      setNewLevel(corr.qtyAfter.toString());
      setCorrReason(corr.reason);
      setCorrDate(corr.date ? new Date(corr.date).toISOString().split('T')[0] : (new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]));
    } else {
      setEditingCorrection(null);
      setCorrTankId(tankId || (tanks[0]?.id || ''));
      const initialTank = tanks.find(t => t.id === (tankId || tanks[0]?.id));
      setNewLevel(initialTank ? initialTank.currentLevel.toString() : '0');
      setCorrReason('Vérification par jaugeage manuel (Règle graduée)');
      setCorrDate((new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]));
    }
    setIsCorrectionFormOpen(true);
  };

  const handleCorrectionTankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tankId = e.target.value;
    setCorrTankId(tankId);
    const selectedTank = tanks.find(t => t.id === tankId);
    if (selectedTank) {
      setNewLevel(selectedTank.currentLevel.toString());
    }
  };

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corrTankId || !newLevel || !corrReason) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const tank = tanks.find(t => t.id === corrTankId);
    if (!tank) return;

    const level = parseFloat(newLevel);
    if (isNaN(level) || level < 0 || level > tank.capacity) {
      alert(`Le nouveau niveau doit être un nombre compris entre 0 et la capacité max (${tank.capacity} L).`);
      return;
    }

    if (editingCorrection) {
      updateStockCorrection(editingCorrection.id, {
        tankId: corrTankId,
        tankNumber: tank.number,
        productId: tank.productId,
        qtyAfter: level,
        reason: corrReason,
        date: corrDate
      }, 'Directeur ERP');
    } else {
      correctTankLevel(corrTankId, level, corrReason + ' (' + corrDate + ')', 'Directeur ERP');
    }
    setEditingCorrection(null);
    setIsCorrectionFormOpen(false);
  };

  return (
    <div className="space-y-6" id="tanks-view">
      <ConfirmModal
        isOpen={!!correctionToDelete}
        title="Supprimer la correction"
        message="Voulez-vous vraiment supprimer cette correction manuelle de jaugeage ?"
        onConfirm={() => {
          if (correctionToDelete) {
            deleteStockCorrection(correctionToDelete, 'Administrateur');
            setCorrectionToDelete(null);
          }
        }}
        onCancel={() => setCorrectionToDelete(null)}
      />
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Gestion des Cuves & Approvisionnement</h1>
          <p className="text-sm text-slate-500">Supervisez les capacités de stockage, programmez les livraisons et ajustez les niveaux réels de vos cuves.</p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 shrink-0 flex-wrap gap-y-1">
          <button 
            onClick={() => setActiveSubTab('visual')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${activeSubTab === 'visual' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Niveaux des Cuves
          </button>
          <button 
            onClick={() => setActiveSubTab('corrections')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${activeSubTab === 'corrections' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Corrections Manuelles
          </button>
          <button 
            onClick={() => setActiveSubTab('deliveries')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${activeSubTab === 'deliveries' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Historique Livraisons
          </button>
          <button 
            onClick={() => setActiveSubTab('schema')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${activeSubTab === 'schema' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Schéma des Installations
          </button>
        </div>
      </div>

      {/* 1. VISUAL STATE & DIAGRAMS OF TANKS */}
      {activeSubTab === 'visual' && (
        <div className="space-y-6">
          {/* Action Row */}
          {hasWriteAccess && (
            <div className="flex flex-wrap items-center gap-3 bg-white p-4 border border-slate-200 rounded-xl shadow-xs justify-between">
              <span className="text-xs text-slate-500 font-medium">Réceptionner du carburant ou corriger une jauge ?</span>
              <div className="flex gap-2">
                                <button 
                  onClick={() => handleOpenTankForm()}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-[#f8fafc99] text-slate-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter une cuve
                </button>
                <button 
                  onClick={() => handleOpenCorrectionForm()}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Correction Manuelle Jauge
                </button>
                <button 
                  onClick={() => handleOpenSupplyForm()}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Réceptionner une Livraison (Fournisseur)
                </button>
              </div>
            </div>
          )}

          {/* Grid des cuves graphiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[...tanks].sort((a, b) => (b.currentLevel / b.capacity) - (a.currentLevel / a.capacity)).map(tank => {
              const currentPercent = Math.round((tank.currentLevel / tank.capacity) * 100);
              const isLow = tank.currentLevel <= tank.minLevel;
              
              // Custom colors depending on fuel type matching requirement:
              // Vert -> Gazoil | Bleu -> Sans Plomb | Orange -> Mélange
              const fuelColorInfo = getFuelColor(tank.productName || tank.productId, tank.color);
              const fuelTheme = {
                badgeBg: fuelColorInfo.bg,
                color: fuelColorInfo.text,
                fillColor: fuelColorInfo.hex
              };

              // Calculate associated pumps
              const tankNozzles = nozzles.filter(n => n.tankId === tank.id);
              const pumpIds = Array.from(new Set(tankNozzles.map(n => n.pumpId)));
              const fedPumps = pumps.filter(p => pumpIds.includes(p.id));
              const countPumps = fedPumps.length;
              const pumpNames = fedPumps.map(p => p.number.replace('Pompe ', '')).join(', ');

              // Calculate associated pistolets
              const countNozzles = tankNozzles.length;
              const nozzleNames = tankNozzles.map(n => n.name.replace('Pistolet ', '')).join(', ');

              // Calculate last delivery
              const tankSupplies = supplies.filter(s => s.tankId === tank.id);
              const lastSupply = tankSupplies.length > 0 
                ? [...tankSupplies].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] 
                : null;
              const lastSupplyDate = lastSupply ? new Date(lastSupply.date).toLocaleDateString('fr-FR') : 'Aucune';
              
              let lastSupplyQty = 0;
              if (lastSupply) {
                const targetDayStr = new Date(lastSupply.date).toISOString().split('T')[0];
                const sameDaySupplies = tankSupplies.filter(s => {
                  try {
                    const sDayStr = new Date(s.date).toISOString().split('T')[0];
                    return sDayStr === targetDayStr;
                  } catch (e) {
                    return false;
                  }
                });
                lastSupplyQty = sameDaySupplies.reduce((sum, s) => sum + s.qtyDelivered, 0);
              }

              // Calculate today and this month consumption (sales via shifts)
              const tankNozzleIds = tankNozzles.map(n => n.id);
              const todayStr = (new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
              const currentMonthStr = todayStr.substring(0, 7);
              const completedShifts = shifts.filter(s => s.status === 'completed' || s.status === 'ready_to_close');
              
              const consumptionToday = completedShifts.filter(s => s.date === todayStr).reduce((sum, shift) => {
                let sSum = 0;
                if (shift.litersSold) tankNozzleIds.forEach(nid => sSum += (shift.litersSold[nid] || 0));
                return sum + sSum;
              }, 0);
              const consumptionMonth = completedShifts.filter(s => s.date.startsWith(currentMonthStr)).reduce((sum, shift) => {
                let sSum = 0;
                if (shift.litersSold) tankNozzleIds.forEach(nid => sSum += (shift.litersSold[nid] || 0));
                return sum + sSum;
              }, 0);

              return (
                <div key={tank.id} className={`bg-white border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between ${isLow ? 'border-rose-400 ring-2 ring-rose-50' : 'border-slate-200'}`}>
                  <div className="p-5 space-y-4">
                    {/* Header tank card */}
                                        <div className="flex justify-between items-start gap-2 relative">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm font-display flex items-center gap-1">
                          {tank.status === 'maintenance' && <AlertTriangle className="w-3 h-3 text-amber-500" title="En maintenance" />}
                          {tank.status === 'offline' && <Power className="w-3 h-3 text-rose-500" title="Hors service" />}
                          {tank.number}
                        </h4>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-1 ${fuelTheme.badgeBg}`}>
                          {tank.productName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">{currentPercent}%</span>
                        <div className="relative">
                          <button 
                            onClick={() => setActiveDropdown(activeDropdown === tank.id ? null : tank.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {activeDropdown === tank.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1 overflow-hidden">
                              <button onClick={() => { setSelectedTankDetail(tank); setIsTankDetailOpen(true); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs text-slate-700 flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-slate-400" /> Voir les détails
                              </button>
                              <button onClick={() => { setSelectedTankHistory(tank); setIsTankHistoryOpen(true); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs text-slate-700 flex items-center gap-2">
                                <BarChart2 className="w-3.5 h-3.5 text-slate-400" /> Historique du niveau
                              </button>
                              {hasWriteAccess && (
                                <>
                                  <button onClick={() => { handleOpenTankForm(tank); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs text-slate-700 flex items-center gap-2">
                                    <Edit className="w-3.5 h-3.5 text-slate-400" /> Modifier
                                  </button>
                                  <button onClick={() => { setActiveSubTab('deliveries'); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs text-slate-700 flex items-center gap-2">
                                    <History className="w-3.5 h-3.5 text-slate-400" /> Historique
                                  </button>
                                  <button onClick={() => { handleOpenSupplyForm(tank.id); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs text-slate-700 flex items-center gap-2">
                                    <Droplet className="w-3.5 h-3.5 text-slate-400" /> Réception carburant
                                  </button>
                                  <button onClick={() => { handleOpenCorrectionForm(tank.id); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs text-slate-700 flex items-center gap-2">
                                    <Sliders className="w-3.5 h-3.5 text-slate-400" /> Ajuster la jauge
                                  </button>
                                  <div className="h-px bg-slate-100 my-1"></div>
                                  <button onClick={() => { 
                                      setTankToDeactivate(tank.id);
                                      setActiveDropdown(null);
                                    }} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs text-slate-700 flex items-center gap-2">
                                    <Power className="w-3.5 h-3.5 text-slate-400" /> Désactiver
                                  </button>
                                  <button onClick={() => { 
                                      if(tank.currentLevel > 0 || countPumps > 0) {
                                        setTankToDelete('error:' + tank.id);
                                      } else {
                                        setTankToDelete(tank.id);
                                      }
                                      setActiveDropdown(null);
                                    }} className="w-full text-left px-3 py-2 hover:bg-rose-50 text-xs text-rose-600 flex items-center gap-2 font-medium">
                                    <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Supprimer
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SVG cylinder visualization */}
                    <div className="flex justify-center py-2 relative">
                      <svg width="100" height="150" viewBox="0 0 100 150" className="overflow-visible">
                        {/* Tank frame */}
                        <rect x="15" y="10" width="70" height="130" rx="35" fill="none" stroke="#cbd5e1" strokeWidth="4" />
                        <rect x="15" y="10" width="70" height="130" rx="35" fill="#f8fafc" />
                        
                        {/* Mask to clip fuel rectangle to the rounded tank pill */}
                        <defs>
                          <clipPath id={`clip-${tank.id}`}>
                            <rect x="15" y="10" width="70" height="130" rx="35" />
                          </clipPath>
                        </defs>
                        
                        {/* Fuel Fill */}
                        <g clipPath={`url(#clip-${tank.id})`}>
                          <rect 
                            x="15" 
                            y={140 - (130 * (tank.currentLevel / tank.capacity))} 
                            width="70" 
                            height="130" 
                            fill={isLow ? '#f43f5e' : fuelTheme.fillColor} 
                            opacity="0.85" 
                            className="transition-all duration-700"
                          />
                        </g>

                        {/* Minimum trigger line */}
                        <line 
                          x1="12" 
                          y1={140 - (130 * (tank.minLevel / tank.capacity))} 
                          x2="88" 
                          y2={140 - (130 * (tank.minLevel / tank.capacity))} 
                          stroke="#f43f5e" 
                          strokeWidth="2" 
                          strokeDasharray="3,3" 
                        />
                      </svg>

                      {/* Display floating values */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-6">
                        <span className="text-slate-800 text-base font-extrabold font-mono leading-none">{tank.currentLevel.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500 font-semibold mt-1">/ {tank.capacity} L</span>
                      </div>
                    </div>

                    {/* Alerte de bas niveau */}
                    {isLow && (
                      <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-[10px] flex items-start gap-1.5 leading-normal">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        <div>
                          <strong>Niveau Critique Faible !</strong>
                          <p>Le stock est inférieur au seuil d'alerte ({tank.minLevel} L). Commandez une livraison.</p>
                        </div>
                      </div>
                    )}

                    {/* Données d'index de cuve */}
                    <div className="space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500 font-mono">
                      <div className="flex justify-between">
                        <span>Disponible :</span>
                        <strong className="text-slate-700">{(tank.currentLevel.toFixed(2))} L</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Creux (Volume libre) :</span>
                        <strong className="text-slate-700">{(tank.capacity - tank.currentLevel).toFixed(2)} L</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Seuil d'alerte Min :</span>
                        <strong className="text-slate-700">{(tank.minLevel)} L</strong>
                      </div>
                    </div>

                    {/* ENRICHED SAAS TELEMETRY DETAILS */}
                    <div className="border-t border-slate-100 pt-3.5 space-y-3.5 text-xs">
                      {/* Distribution Circuit Diagram */}
                      <div className="space-y-2">
                        <span className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-indigo-500" /> Circuit de Distribution
                        </span>
                        
                        {fedPumps.length === 0 ? (
                          <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-[10px] italic gap-1">
                            <Power className="w-3.5 h-3.5 text-slate-300" />
                            Aucun circuit raccordé
                          </div>
                        ) : (
                          <div className="relative pl-3 border-l-2 border-dashed border-slate-200 space-y-3 mt-1.5">
                            {/* Visual indicator showing flow starting from the tank */}
                            <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-50 animate-pulse" title="Départ de cuve" />
                            
                            {fedPumps.map((pump) => {
                              const pumpNozzles = tankNozzles.filter(n => n.pumpId === pump.id);
                              return (
                                <div key={pump.id} className="relative flex flex-col gap-1.5">
                                  {/* Horizontal line connector from vertical trunk to the pump card */}
                                  <div className="absolute -left-[13px] top-4 w-3 h-[1.5px] bg-slate-200" />
                                  
                                  {/* Pump header node */}
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all shadow-2xs">
                                      <div className={`w-1.5 h-1.5 rounded-full ${pump.status === 'active' ? 'bg-emerald-500 ring-2 ring-emerald-50' : 'bg-slate-300'}`} />
                                      <span className="font-sans font-bold text-[10px] text-slate-700">{pump.number}</span>
                                      {pump.serialNumber && (
                                        <span className="text-[8px] text-slate-400 font-mono border-l border-slate-200 pl-1">SN: {pump.serialNumber}</span>
                                      )}
                                    </div>
                                    
                                    {/* Connector line from pump to its nozzles */}
                                    <div className="flex-1 h-[1px] border-t border-dashed border-slate-200 min-w-[8px]" />
                                  </div>

                                  {/* Nozzles child container */}
                                  <div className="flex flex-wrap items-center gap-1 pl-4">
                                    {pumpNozzles.map(noz => {
                                      return (
                                        <div 
                                          key={noz.id} 
                                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border transition-all hover:scale-105 shadow-2xs ${fuelTheme.badgeBg}`}
                                          title={`${noz.name} - ${noz.productName}`}
                                        >
                                          <Droplet className={`w-2 h-2 ${fuelTheme.color}`} />
                                          <span>{noz.name.replace('Pistolet ', 'Pist. ')}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-dashed border-slate-100 pt-3.5 grid grid-cols-2 gap-2 text-slate-500 leading-tight">
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-slate-400">Dernière livraison</span>
                          <span className="font-semibold text-slate-700">{lastSupplyDate}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-slate-400">Quantité reçue</span>
                          <span className="font-semibold text-slate-700 font-mono">{lastSupplyQty > 0 ? `${lastSupplyQty} L` : '0 L'}</span>
                        </div>
                      </div>

                      <div className="border-t border-dashed border-slate-100 pt-2 grid grid-cols-2 gap-2 text-slate-500 leading-tight">
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-slate-400">Consommation jour</span>
                          <span className="font-extrabold text-emerald-600 font-mono">{consumptionToday.toFixed(2)} L</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-slate-400">Consommation mois</span>
                          <span className="font-extrabold text-indigo-600 font-mono">{consumptionMonth.toFixed(2)} L</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'action rapides sur la cuve */}
                  {hasWriteAccess && (
                    <div className="bg-slate-50 border-t border-slate-100 p-3 grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleOpenCorrectionForm(tank.id)}
                        className="py-1 border border-slate-200 bg-white hover:bg-slate-50 rounded text-[10px] font-bold text-slate-600 transition-colors"
                      >
                        Ajuster Jauge
                      </button>
                      <button 
                        onClick={() => handleOpenSupplyForm(tank.id)}
                        className="py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-[10px] font-bold text-white transition-colors"
                      >
                        Livrer Carburant
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1.1 SCHÉMA INTERACTIF DES INSTALLATIONS */}
      {activeSubTab === 'schema' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Top Info Bar */}
          <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Info className="w-3.5 h-3.5" />
                Schéma Réseau Interactif
              </span>
              <p className="text-xs text-slate-500">
                Visualisez la distribution de carburant en temps réel de vos cuves vers les pistolets à travers les pompes. Cliquez sur n'importe quel équipement pour l'inspecter et tracer son circuit.
              </p>
            </div>
            {selectedNodeId && (
              <button 
                onClick={() => { setSelectedNodeType(null); setSelectedNodeId(null); }}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 bg-white shadow-xs shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                Réinitialiser la sélection
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* The Topology Map Card */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Graphique des flux de distribution</span>
                <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold uppercase">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Gazoil</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Sans Plomb</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Mélange</span>
                </div>
              </div>

              {/* Responsive SVG container */}
              <div 
                ref={containerRef}
                className="w-full h-[580px] overflow-auto pb-2 cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
              >
                <div 
                  className="min-w-[780px] relative bg-[#f8fafc80] rounded-lg border border-slate-100 p-2"
                  style={{ height: `${requiredHeight}px` }}
                >
                  <svg viewBox={`0 0 900 ${requiredHeight}`} className="w-full h-full select-none">
                    {/* Definitions for arrow markers */}
                    <defs>
                      <marker id="arrow-gazoil" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                      </marker>
                      <marker id="arrow-sp" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
                      </marker>
                      <marker id="arrow-melange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#f97316" />
                      </marker>
                    </defs>

                    {/* CONNECTIONS (drawn behind nodes) */}
                    <g id="connections-group">
                      {nozzles.map((noz) => {
                        const tankIndex = tanks.findIndex(t => t.id === noz.tankId);
                        const pumpIndex = pumps.findIndex(p => p.id === noz.pumpId);
                        const nozIndex = nozzles.findIndex(n => n.id === noz.id);

                        if (tankIndex === -1 || pumpIndex === -1 || nozIndex === -1) return null;

                        // Coordinates
                        const xTank = 140;
                        const yTank = 70 + tankIndex * 130;

                        const xPump = 440;
                        const yPump = 70 + pumpIndex * 130;

                        const xNoz = 760;
                        const yNoz = 35 + nozIndex * 52;

                        const fuelInfo = getFuelColor(noz.productName || noz.productId);
                        const activeLine = isLineHighlighted(noz);
                        const lineOpacity = getLineOpacity(noz);
                        const lineWidth = getLineWidth(noz);
                        
                        const isPumpIndisponible = pumps.find(p => p.id === noz.pumpId)?.status !== 'active';
                        const strokeDash = isPumpIndisponible ? "5,5" : "";
                        const markerId = noz.productId === 'prod_gazoil' ? 'arrow-gazoil' : noz.productId === 'prod_sans_plomb' || noz.productId === 'prod_melange' ? 'arrow-sp' : 'arrow-melange';

                        return (
                          <g key={`flow-${noz.id}`} className="transition-all duration-300">
                            {/* Cuve -> Pompe */}
                            <path 
                              d={`M ${xTank + 65} ${yTank} C ${xTank + 180} ${yTank}, ${xPump - 180} ${yPump}, ${xPump - 65} ${yPump}`}
                              fill="none"
                              stroke={fuelInfo.hex}
                              strokeWidth={lineWidth}
                              strokeOpacity={lineOpacity}
                              strokeDasharray={strokeDash}
                              markerEnd={`url(#${markerId})`}
                              className="transition-all duration-300"
                            />
                            {/* Pompe -> Pistolet */}
                            <path 
                              d={`M ${xPump + 65} ${yPump} C ${xPump + 130} ${yPump}, ${xNoz - 130} ${yNoz}, ${xNoz - 60} ${yNoz}`}
                              fill="none"
                              stroke={fuelInfo.hex}
                              strokeWidth={lineWidth}
                              strokeOpacity={lineOpacity}
                              strokeDasharray={strokeDash}
                              markerEnd={`url(#${markerId})`}
                              className="transition-all duration-300"
                            />
                          </g>
                        );
                      })}
                    </g>

                    {/* NODES: CUVES (Left Column) */}
                    <g id="tanks-group">
                      <text x="140" y="25" textAnchor="middle" className="text-[11px] font-extrabold fill-slate-400 font-sans uppercase tracking-wider">Cuves de Stockage</text>
                      {tanks.map((tank, idx) => {
                        const x = 140;
                        const y = 70 + idx * 130;
                        const fuelInfo = getFuelColor(tank.productName || tank.productId, tank.color);
                        const isSelected = selectedNodeType === 'tank' && selectedNodeId === tank.id;
                        
                        // Check if tank is in highlight list
                        const isHighlighted = !selectedNodeType || isSelected || (
                          selectedNodeType === 'pump' && nozzles.some(n => n.pumpId === selectedNodeId && n.tankId === tank.id)
                        ) || (
                          selectedNodeType === 'nozzle' && nozzles.some(n => n.id === selectedNodeId && n.tankId === tank.id)
                        );

                        const currentPercent = Math.round((tank.currentLevel / tank.capacity) * 100);

                        return (
                          <g 
                            key={`node-tank-${tank.id}`}
                            transform={`translate(${x - 65}, ${y - 45})`}
                            onClick={() => { setSelectedNodeType('tank'); setSelectedNodeId(tank.id); }}
                            className="cursor-pointer transition-all duration-200"
                          >
                            {/* Card container */}
                            <rect 
                              width="130" 
                              height="90" 
                              rx="8" 
                              fill="#ffffff" 
                              stroke={isSelected ? fuelInfo.hex : isHighlighted ? '#cbd5e1' : '#f1f5f9'}
                              strokeWidth={isSelected ? '3' : '1.5'}
                              className="shadow-sm transition-all duration-200"
                              opacity={isHighlighted ? '1' : '0.35'}
                            />
                            {/* Top colored strip */}
                            <path 
                              d="M 0 8 A 8 8 0 0 1 8 0 L 122 0 A 8 8 0 0 1 130 8 L 130 16 L 0 16 Z" 
                              fill={fuelInfo.hex}
                              opacity={isHighlighted ? '1' : '0.35'}
                            />
                            {/* Card title inside */}
                            <text x="65" y="12" textAnchor="middle" fill="#ffffff" className="text-[10px] font-extrabold tracking-wide uppercase font-sans">
                              {tank.number}
                            </text>
                            {/* Level Visualizer Bar */}
                            <text x="12" y="42" fill="#64748b" className="text-[9px] font-bold">Vol :</text>
                            <text x="118" y="42" textAnchor="end" fill="#334155" className="text-[9px] font-bold font-mono">
                              {tank.currentLevel.toFixed(2)} L
                            </text>
                            {/* Miniature Progress Bar */}
                            <rect x="12" y="48" width="106" height="6" rx="3" fill="#e2e8f0" opacity={isHighlighted ? '1' : '0.35'} />
                            <rect 
                              x="12" 
                              y="48" 
                              width={106 * (tank.currentLevel / tank.capacity)} 
                              height="6" 
                              rx="3" 
                              fill={tank.currentLevel <= tank.minLevel ? '#ef4444' : fuelInfo.hex} 
                              opacity={isHighlighted ? '1' : '0.35'}
                            />
                            {/* Alert state indicator */}
                            {tank.currentLevel <= tank.minLevel && isHighlighted && (
                              <g transform="translate(10, 61)">
                                <circle cx="5" cy="5" r="4" fill="#ef4444" />
                                <text x="14" y="8" fill="#ef4444" className="text-[8px] font-extrabold uppercase tracking-wider">STOCK CRITIQUE</text>
                              </g>
                            )}
                            {tank.currentLevel > tank.minLevel && (
                              <text x="65" y="68" textAnchor="middle" fill="#94a3b8" className="text-[8px] font-medium font-sans">
                                Rempli à {currentPercent}%
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </g>

                    {/* NODES: POMPES (Middle Column) */}
                    <g id="pumps-group">
                      <text x="440" y="25" textAnchor="middle" className="text-[11px] font-extrabold fill-slate-400 font-sans uppercase tracking-wider">Pompes actives</text>
                      {pumps.map((pump, idx) => {
                        const x = 440;
                        const y = 70 + idx * 130;
                        const isSelected = selectedNodeType === 'pump' && selectedNodeId === pump.id;
                        
                        const isHighlighted = !selectedNodeType || isSelected || (
                          selectedNodeType === 'tank' && nozzles.some(n => n.tankId === selectedNodeId && n.pumpId === pump.id)
                        ) || (
                          selectedNodeType === 'nozzle' && nozzles.some(n => n.id === selectedNodeId && n.pumpId === pump.id)
                        );

                        // Count nozzles on this pump
                        const pumpNozzles = nozzles.filter(n => n.pumpId === pump.id);

                        return (
                          <g 
                            key={`node-pump-${pump.id}`}
                            transform={`translate(${x - 65}, ${y - 45})`}
                            onClick={() => { setSelectedNodeType('pump'); setSelectedNodeId(pump.id); }}
                            className="cursor-pointer transition-all duration-200"
                          >
                            {/* Card container */}
                            <rect 
                              width="130" 
                              height="90" 
                              rx="8" 
                              fill="#ffffff" 
                              stroke={isSelected ? '#3b82f6' : isHighlighted ? '#cbd5e1' : '#f1f5f9'}
                              strokeWidth={isSelected ? '3' : '1.5'}
                              className="shadow-sm transition-all duration-200"
                              opacity={isHighlighted ? '1' : '0.35'}
                            />
                            {/* Top strip */}
                            <path 
                              d="M 0 8 A 8 8 0 0 1 8 0 L 122 0 A 8 8 0 0 1 130 8 L 130 16 L 0 16 Z" 
                              fill="#334155"
                              opacity={isHighlighted ? '1' : '0.35'}
                            />
                            <text x="65" y="12" textAnchor="middle" fill="#ffffff" className="text-[10px] font-extrabold tracking-wide uppercase font-sans">
                              {pump.number}
                            </text>

                            {/* Status indicator */}
                            <circle cx="18" cy="32" r="4.5" fill={pump.status === 'active' ? '#10b981' : pump.status === 'maintenance' ? '#f59e0b' : '#ef4444'} opacity={isHighlighted ? '1' : '0.35'} />
                            <text x="28" y="35" fill="#334155" className="text-[9px] font-extrabold font-sans">
                              {pump.status === 'active' ? 'Disponible' : pump.status === 'maintenance' ? 'Maintenance' : 'Hors service'}
                            </text>

                            {/* Additional metadata */}
                            <text x="12" y="54" fill="#64748b" className="text-[8px] uppercase tracking-wider font-extrabold">Fabricant :</text>
                            <text x="118" y="54" textAnchor="end" fill="#334155" className="text-[9px] font-semibold">{pump.manufacturer}</text>

                            <text x="12" y="67" fill="#64748b" className="text-[8px] uppercase tracking-wider font-extrabold">S/N :</text>
                            <text x="118" y="67" textAnchor="end" fill="#334155" className="text-[8px] font-mono">{pump.serialNumber}</text>

                            {/* Mini line connect badge */}
                            <rect x="8" y="73" width="114" height="11" rx="2" fill="#f1f5f9" opacity={isHighlighted ? '1' : '0.35'} />
                            <text x="65" y="81" textAnchor="middle" fill="#475569" className="text-[8px] font-extrabold font-sans">
                              {pumpNozzles.length} pistolets connectés
                            </text>
                          </g>
                        );
                      })}
                    </g>

                    {/* NODES: PISTOLETS (Right Column) */}
                    <g id="nozzles-group">
                      <text x="760" y="25" textAnchor="middle" className="text-[11px] font-extrabold fill-slate-400 font-sans uppercase tracking-wider">Pistolets</text>
                      {nozzles.map((noz, idx) => {
                        const x = 760;
                        const y = 35 + idx * 52;
                        const isSelected = selectedNodeType === 'nozzle' && selectedNodeId === noz.id;

                        const isHighlighted = !selectedNodeType || isSelected || (
                          selectedNodeType === 'tank' && noz.tankId === selectedNodeId
                        ) || (
                          selectedNodeType === 'pump' && noz.pumpId === selectedNodeId
                        );

                        const fuelInfo = getFuelColor(noz.productName || noz.productId);

                        return (
                          <g 
                            key={`node-nozzle-${noz.id}`}
                            transform={`translate(${x - 60}, ${y - 21})`}
                            onClick={() => { setSelectedNodeType('nozzle'); setSelectedNodeId(noz.id); }}
                            className="cursor-pointer transition-all duration-200"
                          >
                            {/* Container */}
                            <rect 
                              width="120" 
                              height="42" 
                              rx="6" 
                              fill="#ffffff" 
                              stroke={isSelected ? fuelInfo.hex : isHighlighted ? '#cbd5e1' : '#f1f5f9'}
                              strokeWidth={isSelected ? '2.5' : '1.2'}
                              className="shadow-sm transition-all duration-200"
                              opacity={isHighlighted ? '1' : '0.35'}
                            />
                            {/* Indicator colored vertical line on left */}
                            <rect 
                              x="0" 
                              y="0" 
                              width="5" 
                              height="42" 
                              rx="2"
                              fill={fuelInfo.hex}
                              opacity={isHighlighted ? '1' : '0.35'}
                            />

                            <text x="12" y="16" fill="#1e293b" className="text-[9px] font-extrabold font-sans">
                              {noz.name}
                            </text>
                            
                            <text x="12" y="26" fill="#64748b" className="text-[8px] font-semibold tracking-wide uppercase">
                              {noz.pumpNumber}
                            </text>

                            {/* Status circle right */}
                            <circle cx="108" cy="14" r="3" fill={noz.status === 'active' ? '#10b981' : '#ef4444'} opacity={isHighlighted ? '1' : '0.35'} />

                            {/* Fuel small badge */}
                            <rect x="12" y="30" width="96" height="8" rx="1.5" fill={fuelInfo.bg.split(' ')[0]} opacity={isHighlighted ? '1' : '0.35'} />
                            <text x="60" y="36" textAnchor="middle" fill={fuelInfo.hex} className="text-[7px] font-extrabold tracking-wide uppercase font-sans">
                              {fuelInfo.name}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  </svg>
                </div>
              </div>

              {/* LEGEND ROW UNDER THE SCHEMA */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-3.5 rounded-xl text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider mr-2">Légende :</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600 text-[11px] font-medium">Gazoil</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-slate-600 text-[11px] font-medium">Sans Plomb</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    <span className="text-slate-600 text-[11px] font-medium">Mélange</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 border-t md:border-t-0 pt-2 md:pt-0">
                  <div className="flex items-center gap-2">
                    <svg width="24" height="4" className="overflow-visible">
                      <line x1="0" y1="2" x2="24" y2="2" stroke="#64748b" strokeWidth="2.5" />
                    </svg>
                    <span className="text-slate-600 text-[11px] font-medium">Liaison active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg width="24" height="4" className="overflow-visible">
                      <line x1="0" y1="2" x2="24" y2="2" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3,3" />
                    </svg>
                    <span className="text-slate-600 text-[11px] font-medium">Pompe indisponible</span>
                  </div>
                </div>
              </div>
            </div>

            {/* The Inspector Sidebar */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Inspecteur d'Équipement
                  </h3>
                </div>

                {!selectedNodeType || !selectedNodeId ? (
                  <div className="py-24 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400 border border-slate-100 shadow-2xs">
                      <Info className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-700">Aucune sélection</p>
                      <p className="text-xs text-slate-400 px-4 leading-normal">
                        Cliquez sur une cuve, une pompe ou un pistolet dans le schéma pour analyser ses caractéristiques et tracer son réseau de distribution.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in-50 duration-200 space-y-4">
                    {/* TANK INSPECTOR DETAILS */}
                    {selectedNodeType === 'tank' && (() => {
                      const tank = tanks.find(t => t.id === selectedNodeId);
                      if (!tank) return null;

                      const fuelInfo = getFuelColor(tank.productName || tank.productId, tank.color);
                      const currentPercent = Math.round((tank.currentLevel / tank.capacity) * 100);

                      // Connected items calculations
                      const tNozzles = nozzles.filter(n => n.tankId === tank.id);
                      const tPumpIds = Array.from(new Set(tNozzles.map(n => n.pumpId)));
                      const tPumps = pumps.filter(p => tPumpIds.includes(p.id));

                      // Supplies for tank
                      const tSupplies = supplies.filter(s => s.tankId === tank.id);
                      const lastSup = tSupplies.length > 0 
                        ? [...tSupplies].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] 
                        : null;
                      
                      let lastSupQty = 0;
                      if (lastSup) {
                        const targetDayStr = new Date(lastSup.date).toISOString().split('T')[0];
                        const sameDaySupplies = tSupplies.filter(s => {
                          try {
                            const sDayStr = new Date(s.date).toISOString().split('T')[0];
                            return sDayStr === targetDayStr;
                          } catch (e) {
                            return false;
                          }
                        });
                        lastSupQty = sameDaySupplies.reduce((sum, s) => sum + s.qtyDelivered, 0);
                      }

                      // Sales consumption via shifts
                      const todayStr = (new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
                      const currentMonthStr = todayStr.substring(0, 7);
                      const tNozIds = tNozzles.map(n => n.id);
                      const completedShifts = shifts.filter(s => s.status === 'completed' || s.status === 'ready_to_close');
                      
                      const consToday = completedShifts.filter(s => s.date === todayStr).reduce((sum, shift) => {
                        let sSum = 0;
                        if (shift.litersSold) tNozIds.forEach(nid => sSum += (shift.litersSold[nid] || 0));
                        return sum + sSum;
                      }, 0);
                      const consMonth = completedShifts.filter(s => s.date.startsWith(currentMonthStr)).reduce((sum, shift) => {
                        let sSum = 0;
                        if (shift.litersSold) tNozIds.forEach(nid => sSum += (shift.litersSold[nid] || 0));
                        return sum + sSum;
                      }, 0);

                      return (
                        <div className="space-y-4 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Équipement jaugé</span>
                              <h4 className="text-base font-extrabold text-slate-900 font-display">{tank.number}</h4>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${fuelInfo.bg}`}>
                              {fuelInfo.name}
                            </span>
                          </div>

                          <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-0.5">
                                <span className="text-slate-400 text-[10px] uppercase font-bold">Produit</span>
                                <span className="text-slate-800 font-bold block">{tank.productName}</span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-slate-400 text-[10px] uppercase font-bold">Seuil Alerte</span>
                                <span className="text-rose-600 font-bold font-mono block">{tank.minLevel} L</span>
                              </div>
                            </div>

                            <div className="border-t border-[#e2e8f099] pt-2 grid grid-cols-2 gap-3">
                              <div className="space-y-0.5">
                                <span className="text-slate-400 text-[10px] uppercase font-bold">Niveau actuel</span>
                                <span className="text-slate-900 font-extrabold font-mono text-sm block">{tank.currentLevel.toFixed(2)} L</span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-slate-400 text-[10px] uppercase font-bold">Capacité Totale</span>
                                <span className="text-slate-700 font-bold font-mono block">{tank.capacity} L</span>
                              </div>
                            </div>

                            <div className="border-t border-[#e2e8f099] pt-2 space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span>Taux de remplissage</span>
                                <span className={tank.currentLevel <= tank.minLevel ? 'text-rose-600' : 'text-slate-700'}>{currentPercent}%</span>
                              </div>
                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full transition-all duration-500" 
                                  style={{ width: `${currentPercent}%`, backgroundColor: tank.currentLevel <= tank.minLevel ? '#ef4444' : fuelInfo.hex }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Technical connections */}
                          <div className="space-y-2.5">
                            <h5 className="font-bold text-slate-700 border-b border-slate-100 pb-1 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-indigo-500" /> Tracé des liaisons
                            </h5>
                            
                            {tPumps.length === 0 ? (
                              <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-[10px] italic gap-1">
                                <Power className="w-3.5 h-3.5 text-slate-300" />
                                Aucun circuit raccordé
                              </div>
                            ) : (
                              <div className="relative pl-3 border-l-2 border-dashed border-slate-200 space-y-3 mt-1.5">
                                {/* Visual indicator showing flow starting from the tank */}
                                <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-50 animate-pulse" title="Départ de cuve" />
                                
                                {tPumps.map((pump) => {
                                  const pumpNozzles = tNozzles.filter(n => n.pumpId === pump.id);
                                  return (
                                    <div key={pump.id} className="relative flex flex-col gap-1.5">
                                      {/* Horizontal line connector from vertical trunk to the pump card */}
                                      <div className="absolute -left-[13px] top-4 w-3 h-[1.5px] bg-slate-200" />
                                      
                                      {/* Pump header node */}
                                      <div className="flex items-center gap-1.5">
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all shadow-2xs">
                                          <div className={`w-1.5 h-1.5 rounded-full ${pump.status === 'active' ? 'bg-emerald-500 ring-2 ring-emerald-50' : 'bg-slate-300'}`} />
                                          <span className="font-sans font-bold text-[10px] text-slate-700">{pump.number}</span>
                                          {pump.serialNumber && (
                                            <span className="text-[8px] text-slate-400 font-mono border-l border-slate-200 pl-1">SN: {pump.serialNumber}</span>
                                          )}
                                        </div>
                                        
                                        {/* Connector line from pump to its nozzles */}
                                        <div className="flex-1 h-[1px] border-t border-dashed border-slate-200 min-w-[8px]" />
                                      </div>

                                      {/* Nozzles child container */}
                                      <div className="flex flex-wrap items-center gap-1 pl-4">
                                        {pumpNozzles.map(noz => {
                                          return (
                                            <div 
                                              key={noz.id} 
                                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border transition-all hover:scale-105 shadow-2xs ${fuelInfo.bg}`}
                                              title={`${noz.name} - ${noz.productName}`}
                                            >
                                              <Droplet className={`w-2 h-2 ${fuelInfo.color}`} />
                                              <span>{noz.name.replace('Pistolet ', 'Pist. ')}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Supplies */}
                          <div className="space-y-2.5 pt-1">
                            <h5 className="font-bold text-slate-700 border-b border-slate-100 pb-1 uppercase text-[10px] tracking-wider">Historique Récent</h5>
                            <div className="space-y-1.5 text-slate-600 leading-normal">
                              <div>
                                <strong>Dernière livraison : </strong>
                                <span className="text-slate-800 font-semibold">
                                  {lastSup ? new Date(lastSup.date).toLocaleDateString('fr-FR') : 'Aucune'}
                                </span>
                              </div>
                              <div>
                                <strong>Quantité de la dernière livraison : </strong>
                                <span className="text-slate-800 font-bold font-mono">
                                  {lastSup ? `${lastSupQty} L` : '0 L'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Daily statistics */}
                          <div className="space-y-2.5 pt-1">
                            <h5 className="font-bold text-slate-700 border-b border-slate-100 pb-1 uppercase text-[10px] tracking-wider">Débits et Consommation</h5>
                            <div className="grid grid-cols-2 gap-2 text-slate-600">
                              <div className="bg-[#ecfdf580] p-2 rounded-lg border border-emerald-100">
                                <span className="text-[9px] uppercase font-bold text-emerald-700 block">Aujourd'hui</span>
                                <span className="text-xs font-extrabold text-emerald-800 font-mono block mt-0.5">{consToday.toFixed(2)} L</span>
                              </div>
                              <div className="bg-[#eff6ff80] p-2 rounded-lg border border-blue-100">
                                <span className="text-[9px] uppercase font-bold text-blue-700 block">Ce Mois (Juillet)</span>
                                <span className="text-xs font-extrabold text-blue-800 font-mono block mt-0.5">{consMonth.toFixed(2)} L</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* PUMP INSPECTOR DETAILS */}
                    {selectedNodeType === 'pump' && (() => {
                      const pump = pumps.find(p => p.id === selectedNodeId);
                      if (!pump) return null;

                      const pumpNozzles = nozzles.filter(n => n.pumpId === pump.id);
                      const sourceTanks = Array.from(new Set(pumpNozzles.map(n => n.tankNumber))).join(', ');

                      return (
                        <div className="space-y-4 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Équipement de piste</span>
                            <h4 className="text-base font-extrabold text-slate-900 font-display">{pump.number}</h4>
                          </div>

                          <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-bold">État de service :</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                pump.status === 'active' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : pump.status === 'maintenance'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {pump.status === 'active' ? 'Disponible (Actif)' : pump.status === 'maintenance' ? 'En maintenance' : 'Hors service'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center border-t border-[#e2e8f099] pt-2">
                              <span className="text-slate-500 font-semibold">Fabricant :</span>
                              <span className="text-slate-800 font-semibold">{pump.manufacturer}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-semibold">N° de Série :</span>
                              <span className="text-slate-800 font-mono font-medium">{pump.serialNumber}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-[#e2e8f099] pt-2">
                              <span className="text-slate-500 font-semibold">Alimenté par :</span>
                              <span className="text-slate-800 font-semibold text-right max-w-[140px] truncate" title={sourceTanks}>{sourceTanks || 'Aucune cuve'}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h5 className="font-bold text-slate-700 border-b border-slate-100 pb-1 uppercase text-[10px] tracking-wider">Pistolets associés</h5>
                            <div className="space-y-2">
                              {pumpNozzles.map(noz => {
                                const fuelInfo = getFuelColor(noz.productName || noz.productId);
                                return (
                                  <div key={noz.id} className="p-2 border border-slate-200 rounded-lg flex justify-between items-center hover:bg-[#f8fafc80] transition-colors bg-white shadow-3xs">
                                    <div className="space-y-0.5">
                                      <span className="font-bold text-slate-800 block">{noz.name}</span>
                                      <span className="text-[9px] text-slate-400 block truncate max-w-[150px]">{noz.tankNumber}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold border ${fuelInfo.bg}`}>
                                        {fuelInfo.name}
                                      </span>
                                      <span className={`w-2 h-2 rounded-full ${noz.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    </div>
                                  </div>
                                );
                              })}
                              {pumpNozzles.length === 0 && (
                                <p className="text-slate-400 italic text-[10px]">Aucun pistolet branché.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* NOZZLE INSPECTOR DETAILS */}
                    {selectedNodeType === 'nozzle' && (() => {
                      const noz = nozzles.find(n => n.id === selectedNodeId);
                      if (!noz) return null;

                      const fuelInfo = getFuelColor(noz.productName || noz.productId);

                      return (
                        <div className="space-y-4 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Terminal de piste</span>
                              <h4 className="text-base font-extrabold text-slate-900 font-display">{noz.name}</h4>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${fuelInfo.bg}`}>
                              {fuelInfo.name}
                            </span>
                          </div>

                          <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                            <div className="space-y-0.5">
                              <span className="text-slate-400 text-[10px] uppercase font-bold">Produit distribué</span>
                              <span className="text-slate-800 font-bold block text-sm">{noz.productName}</span>
                            </div>

                            <div className="border-t border-[#e2e8f099] pt-2 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-semibold">Cuve d'alimentation :</span>
                                <span className="text-slate-900 font-bold text-right">{noz.tankNumber}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-semibold">Pompe d'association :</span>
                                <span className="text-slate-900 font-bold text-right">{noz.pumpNumber}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-semibold">Statut :</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  noz.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {noz.status === 'active' ? 'Opérationnel / Actif' : 'Indisponible / Défectueux'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Index counters */}
                          <div className="space-y-2.5">
                            <h5 className="font-bold text-slate-700 border-b border-slate-100 pb-1 uppercase text-[10px] tracking-wider">Relevés des index</h5>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-slate-50 p-2.5 rounded-lg border border-[#e2e8f099] space-y-1">
                                <span className="text-slate-400 text-[9px] uppercase font-bold block">Dernier index mécanique</span>
                                <span className="text-xs font-bold text-slate-800 font-mono block">{noz.currentMechCounter} L</span>
                              </div>
                              <div className="bg-slate-50 p-2.5 rounded-lg border border-[#e2e8f099] space-y-1">
                                <span className="text-slate-400 text-[9px] uppercase font-bold block">Dernier index électronique</span>
                                <span className="text-xs font-bold text-slate-800 font-mono block">{parseFloat(noz.currentElecCounter as any).toFixed(3)} L</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {selectedNodeId && (
                <div className="pt-4 border-t border-slate-100 mt-4">
                  <button 
                    onClick={() => { setSelectedNodeType(null); setSelectedNodeId(null); }}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors text-center"
                  >
                    Fermer l'Inspecteur
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. HISTORIQUE DES LIVRAISONS (APPROVISIONNEMENT) */}
      {activeSubTab === 'deliveries' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              Journal des réceptions et livraisons fournisseur
            </h3>
            {hasWriteAccess && (
              <button 
                onClick={() => handleOpenSupplyForm()}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                + Enregistrer une Livraison
              </button>
            )}
          </div>
          <div className="overflow-x-auto text-xs text-left">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600">
                  <th className="p-3">Facture N°</th>
                  <th className="p-3">Fournisseur</th>
                  <th className="p-3">Carburant</th>
                  <th className="p-3">Cuve de dépot</th>
                  <th className="p-3">Quantité Livrée</th>
                  <th className="p-3">Prix d'Achat Unitaire</th>
                  <th className="p-3">Coût Total d'Acquisition</th>
                  <th className="p-3">Date Réception</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplies.map(sup => (
                  <tr key={sup.id} className="hover:bg-[#f8fafc99] transition-colors font-mono">
                    <td className="p-3 font-sans font-bold text-indigo-600">{sup.invoiceNumber}</td>
                    <td className="p-3 font-sans text-slate-700">{sup.supplier}</td>
                    <td className="p-3 font-sans">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                        {sup.productName}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-slate-500">{sup.tankNumber}</td>
                    <td className="p-3 font-bold text-slate-800 text-right">{sup.qtyDelivered} L</td>
                    <td className="p-3 text-right">{sup.purchasePrice.toFixed(2)} MAD/L</td>
                    <td className="p-3 font-bold text-slate-900 text-right">{(sup.qtyDelivered * sup.purchasePrice).toFixed(2)}</td>
                    <td className="p-3 font-sans text-slate-500">{new Date(sup.date).toLocaleDateString('fr-FR')}</td>
                    <td className="p-3 text-right">
                      {hasWriteAccess && (
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleOpenSupplyForm(sup.tankId, sup)}
                            className="p-1.5 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 rounded transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setSupplyToDelete(sup.id)}
                            className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {supplies.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                      Aucun approvisionnement enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. HISTORIQUE DES CORRECTIONS MANUELLES */}
      {activeSubTab === 'corrections' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-400" />
              Journal des corrections et jaugeages manuels de sécurité
            </h3>
            {hasWriteAccess && (
              <button 
                onClick={() => handleOpenCorrectionForm()}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                + Enregistrer Jaugeage Manuel
              </button>
            )}
          </div>
          <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                value={correctionFilterDate}
                onChange={(e) => setCorrectionFilterDate(e.target.value)}
                className="w-full max-w-xs border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                placeholder="Filtrer par date..."
              />
              {correctionFilterDate && (
                <button onClick={() => setCorrectionFilterDate('')} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto text-xs text-left">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600">
                  <th className="p-3">ID Log</th>
                  <th className="p-3">Cuve</th>
                  <th className="p-3">Quantité Avant</th>
                  <th className="p-3">Quantité Corrigée</th>
                  <th className="p-3">Écart d'Ajustement</th>
                                    <th className="p-3">Date</th>
                  {hasWriteAccess && <th className="p-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {stockCorrections.map(corr => {
                  const diff = parseFloat((corr.qtyAfter - corr.qtyBefore).toFixed(2));
                  return (
                    <tr key={corr.id} className="hover:bg-[#f8fafc99] transition-colors">
                      <td className="p-3 text-slate-400">#{corr.id.split('_')[1] || corr.id}</td>
                      <td className="p-3 font-sans text-slate-800">{corr.tankNumber}</td>
                      <td className="p-3 text-slate-500">{Number(corr.qtyBefore).toFixed(2)} L</td>
                      <td className="p-3 font-bold text-slate-800">{Number(corr.qtyAfter).toFixed(2)} L</td>
                      <td className="p-3">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${diff < 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(2)} L
                        </span>
                      </td>
                                            <td className="p-3 font-sans text-slate-500">{new Date(corr.date).toLocaleDateString('fr-FR')}</td>
                      {hasWriteAccess && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenCorrectionForm(undefined, corr)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title="Modifier la correction"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setCorrectionToDelete(corr.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                              title="Supprimer la correction"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {stockCorrections.length === 0 && (
                  <tr>
                    <td colSpan={hasWriteAccess ? 8 : 7} className="p-6 text-center text-slate-400 italic font-sans">
                      Aucune correction manuelle effectuée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

            {/* CONFIRMATION MODAL FOR SUPPLY DELETION */}
      {supplyToDelete && (
        <div className="fixed inset-0 bg-[#0f172a99] backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 font-display text-lg mb-1">Confirmer la suppression</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer cette livraison ? Le volume sera déduit de la cuve associée. Cette action est irréversible.
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setSupplyToDelete(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  store.deleteSupply(supplyToDelete, 'Directeur ERP');
                  setSupplyToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg shadow-xs transition-colors"
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}

            {/* Modal de Confirmation Générique */}
      {confirmModalConfig && confirmModalConfig.isOpen && (
        <div className="fixed inset-0 bg-[#0f172a99] backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 font-display text-lg mb-1">{confirmModalConfig.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {confirmModalConfig.message}
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setConfirmModalConfig(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  confirmModalConfig.onConfirm();
                  setConfirmModalConfig(null);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg shadow-xs transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORMULAIRE LIVRAISON MODAL */}
      {isSupplyFormOpen && (
        <div className="fixed inset-0 bg-[#0f172a99] backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex justify-between items-center bg-slate-900 text-white px-5 py-4">
              <h3 className="font-bold font-display">{editingSupply ? 'Modifier une Livraison' : 'Réceptionner une Livraison'}</h3>
              <button onClick={() => { setIsSupplyFormOpen(false); setEditingSupply(null); }} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSupplySubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Fournisseur</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: TotalEnergies Distribution"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Cuve de réception</label>
                  <select 
                    value={supplyTankId}
                    onChange={handleSupplyTankChange}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    {tanks.map(t => (
                      <option key={t.id} value={t.id}>{t.number} - {t.productName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Numéro de Facture</label>
                  <input 
                    type="text" 
                    required
                    placeholder="INV-XXXX"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Quantité Livrée (L)</label>
                  <input 
                    type="number" 
                    required
                    value={qtyDelivered}
                    onChange={(e) => setQtyDelivered(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Prix d'Achat (MAD/L)</label>
                  <input 
                    type="number" 
                    step="any"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Date de Livraison</label>
                <input 
                  type="date" 
                  value={supplyDate}
                  onChange={(e) => setSupplyDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsSupplyFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Valider & Incrémenter Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORMULAIRE CORRECTION MODAL */}
      {isCorrectionFormOpen && (
        <div className="fixed inset-0 bg-[#0f172a99] backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex justify-between items-center bg-slate-900 text-white px-5 py-4">
              <h3 className="font-bold font-display">{editingCorrection ? 'Modifier la Correction Manuelle' : 'Correction Manuelle Jauge'}</h3>
              <button onClick={() => { setIsCorrectionFormOpen(false); setEditingCorrection(null); }} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCorrectionSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Cuve à calibrer</label>
                  <select 
                    value={corrTankId}
                    onChange={handleCorrectionTankChange}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    {tanks.map(t => (
                      <option key={t.id} value={t.id}>{t.number}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Volume Jaugé Réel (L)</label>
                  <input 
                    type="number" 
                    required
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              
              {(() => {
                const tank = tanks.find(t => t.id === corrTankId);
                const theorique = tank ? tank.currentLevel : 0;
                const reel = parseFloat(newLevel) || 0;
                const ecart = reel - theorique;
                return (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Volume Théorique: <strong className="text-slate-700">{theorique.toFixed(2)} L</strong></span>
                      <span className="text-xs text-slate-500 block">Écart constaté:</span>
                    </div>
                    <div className={`text-lg font-bold font-mono px-3 py-1 rounded ${ecart < 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {ecart > 0 ? '+' : ''}{ecart.toFixed(2)} L
                    </div>
                  </div>
                );
              })()}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Date du jaugeage</label>
                <input 
                  type="date" 
                  required
                  value={corrDate}
                  onChange={(e) => setCorrDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none focus:border-indigo-500 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Motif de la régulation de stock</label>
                <textarea 
                  required
                  placeholder="Ex: Écart d'évaporation de fin de mois ou calibrage sonde IoT..."
                  value={corrReason}
                  onChange={(e) => setCorrReason(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { setIsCorrectionFormOpen(false); setEditingCorrection(null); }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  {editingCorrection ? 'Mettre à jour' : 'Enregistrer la note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals for Tank Form */}
      {isTankFormOpen && (
        <TankFormModal 
          store={store} 
          tank={editingTank} 
          onClose={() => setIsTankFormOpen(false)} 
        />
      )}

      {/* Tank Detail Modal */}
      {isTankHistoryOpen && selectedTankHistory && (
        <TankHistoryModal 
          store={store}
          tank={selectedTankHistory} 
          onClose={() => setIsTankHistoryOpen(false)} 
        />
      )}

      {isTankDetailOpen && selectedTankDetail && (
        <TankDetailModal 
          store={store} 
          tank={selectedTankDetail} 
          onClose={() => setIsTankDetailOpen(false)} 
        />
      )}


      {tankToDeactivate && (
        <div className="fixed inset-0 bg-[#0f172a99] backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Désactiver la cuve</h3>
              <p className="text-sm text-slate-500 mb-6">Voulez-vous désactiver cette cuve ?</p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setTankToDeactivate(null)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => {
                    store.updateTank(tankToDeactivate, { status: 'offline' }, 'Directeur ERP');
                    setTankToDeactivate(null);
                  }}
                  className="px-4 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                >
                  Désactiver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tankToDelete && (
        <div className="fixed inset-0 bg-[#0f172a99] backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              {tankToDelete.startsWith('error:') ? (
                <>
                  <h3 className="text-lg font-bold text-rose-600 mb-2">Impossible de supprimer</h3>
                  <p className="text-sm text-slate-500 mb-6">Impossible de supprimer une cuve qui contient du carburant ou qui est reliée à des pompes. Vous pouvez seulement la désactiver.</p>
                  <div className="flex gap-3 justify-end">
                    <button 
                      onClick={() => setTankToDelete(null)}
                      className="px-4 py-2 text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmer la suppression</h3>
                  <p className="text-sm text-slate-500 mb-6">Voulez-vous vraiment supprimer cette cuve ? Cette action est irréversible.</p>
                  <div className="flex gap-3 justify-end">
                    <button 
                      onClick={() => setTankToDelete(null)}
                      className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                    <button 
                      onClick={() => {
                        store.deleteTank(tankToDelete, 'Directeur ERP');
                        setTankToDelete(null);
                      }}
                      className="px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


interface TankFormModalProps {
  store: ERPStoreType;
  tank: Tank | null;
  onClose: () => void;
}

function TankFormModal({ store, tank, onClose }: TankFormModalProps) {
  const [number, setNumber] = useState(tank?.number || '');
  const [productId, setProductId] = useState(tank?.productId || (store.products.length > 0 ? store.products[0].id : ''));
  const [capacity, setCapacity] = useState(tank?.capacity?.toString() || '');
  const [currentLevel, setCurrentLevel] = useState(tank?.currentLevel?.toString() || '0');
  const [minLevel, setMinLevel] = useState(tank?.minLevel?.toString() || '4000');
  const [location, setLocation] = useState(tank?.location || '');
  const [status, setStatus] = useState(tank?.status || 'active');
  const [connectedPumps, setConnectedPumps] = useState<string[]>(tank?.connectedPumpIds || []);
  const [color, setColor] = useState(tank?.color || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = store.products.find(p => p.id === productId);
    if (!product) {
      alert("Veuillez sélectionner un produit valide. Si la liste est vide, vous devez d'abord ajouter un produit dans la section Installations.");
      return;
    }
    
    const nextTank: Partial<Tank> = {
      number,
      productId,
      productName: product.name,
      capacity: parseInt(capacity),
      currentLevel: parseInt(currentLevel) || 0,
      minLevel: parseInt(minLevel),
      maxLevel: parseInt(capacity) * 0.95,
      location,
      status: status as any,
      connectedPumpIds: connectedPumps,
      color
    };

    if (tank) {
      store.updateTank(tank.id, nextTank, 'Directeur ERP');
    } else {
      store.addTank(nextTank as Omit<Tank, 'id'>, 'Directeur ERP');
    }
    onClose();
  };

  const togglePump = (pumpId: string) => {
    if (connectedPumps.includes(pumpId)) {
      setConnectedPumps(connectedPumps.filter(id => id !== pumpId));
    } else {
      setConnectedPumps([...connectedPumps, pumpId]);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a80] backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-[#f8fafc80]">
          <h3 className="font-black text-slate-800 text-lg">
            {tank ? 'Modifier la cuve' : 'Ajouter une cuve'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          <form id="tank-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nom / Numéro de la cuve</label>
              <input type="text" value={number} onChange={e => setNumber(e.target.value)} required className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500" placeholder="Ex: Cuve N°5 (Gazoil)" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Produit contenu</label>
              <select value={productId} onChange={e => setProductId(e.target.value)} required className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 bg-white">
                {store.products.length === 0 && <option value="" disabled>Aucun produit disponible</option>}
                {store.products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Capacité totale (L)</label>
                <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required min="1000" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Seuil d'alerte (L)</label>
                <input type="number" value={minLevel} onChange={e => setMinLevel(e.target.value)} required min="0" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Niveau actuel (L)</label>
                <input type="number" value={currentLevel} onChange={e => setCurrentLevel(e.target.value)} required min="0" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Statut</label>
                <select value={status} onChange={e => setStatus(e.target.value as any)} required className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500 bg-white">
                  <option value="active">Active</option>
                  <option value="maintenance">En maintenance</option>
                  <option value="offline">Hors service</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Emplacement (Optionnel)</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500" placeholder="Ex: Zone Nord" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Couleur de la Cuve</label>
                <div className="flex gap-2 items-center">
                  {(() => {
                    const defaultHex = getFuelColor(store.products.find(p => p.id === productId)?.name || productId).hex;
                    const displayColor = color || defaultHex;
                    return (
                      <>
                        <input type="color" value={displayColor} onChange={e => setColor(e.target.value)} className="w-10 h-10 cursor-pointer rounded border border-slate-200 p-0.5" />
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500 font-mono">{displayColor}</span>
                          {color && (
                            <button type="button" onClick={() => setColor('')} className="text-[10px] text-rose-500 hover:text-rose-700 text-left">Réinitialiser</button>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Pompes alimentées</label>
                  <p className="text-[10px] text-slate-500 mt-0.5">Les pompes sélectionnées seront alimentées par cette cuve.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConnectedPumps(store.pumps.filter(p => p.status === 'active').map(p => p.id))}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-2 py-1 rounded"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    type="button"
                    onClick={() => setConnectedPumps([])}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors bg-slate-100 px-2 py-1 rounded"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                {store.pumps.map(pump => {
                  const pumpNozzles = store.nozzles.filter(n => n.pumpId === pump.id);
                  const products = Array.from(new Set(pumpNozzles.map(n => n.productName)));
                  const isActive = pump.status === 'active';
                  const isSelected = connectedPumps.includes(pump.id);
                  const isMaintenance = pump.status === 'maintenance';
                  
                  return (
                    <div 
                      key={pump.id} 
                      onClick={() => {
                        if (isActive) togglePump(pump.id);
                      }}
                      className={`relative border rounded-xl p-3 transition-all ${!isActive ? 'bg-slate-50 border-slate-200 opacity-75 cursor-not-allowed' : isSelected ? 'border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500 cursor-pointer shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'}`}
                    >
                      {/* Checkmark Badge */}
                      {isActive && isSelected && (
                        <div className="absolute top-3 right-3 text-indigo-600">
                          <CheckCircle2 className="w-5 h-5 fill-indigo-100" />
                        </div>
                      )}
                      
                      {/* Unavailable Badges */}
                      {!isActive && (
                        <div className="absolute top-3 right-3">
                          <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${isMaintenance ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                            {isMaintenance ? 'Maintenance' : 'Hors service'}
                          </span>
                        </div>
                      )}

                      <div className="mb-2">
                        <h5 className="font-bold text-slate-800 text-sm">{pump.number}</h5>
                        {isActive && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] text-emerald-700 font-bold uppercase">Disponible</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-xs text-slate-600 flex items-center justify-between">
                          <span className="text-slate-400">Pistolets :</span>
                          <span className="font-semibold">{pumpNozzles.length}</span>
                        </div>
                        <div className="text-xs text-slate-600">
                          <span className="text-slate-400 block mb-0.5">Produits :</span>
                          <div className="flex flex-wrap gap-1">
                            {products.length > 0 ? products.map(prod => (
                              <span key={prod} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-medium border border-slate-200">
                                {prod}
                              </span>
                            )) : (
                              <span className="text-[9px] text-slate-400 italic">Aucun</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </form>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors">Annuler</button>
          <button form="tank-form" type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

interface TankDetailModalProps {
  store: ERPStoreType;
  tank: Tank;
  onClose: () => void;
}

function TankDetailModal({ store, tank, onClose }: TankDetailModalProps) {
  const currentPercent = Math.round((tank.currentLevel / tank.capacity) * 100);
  const fuelColorInfo = getFuelColor(tank.productName || tank.productId, tank.color);
  
  const tankNozzles = store.nozzles.filter(n => n.tankId === tank.id);
  const pumpIds = tank.connectedPumpIds?.length ? tank.connectedPumpIds : Array.from(new Set(tankNozzles.map(n => n.pumpId)));
  const fedPumps = store.pumps.filter(p => pumpIds.includes(p.id));
  
  const tankSupplies = store.supplies.filter(s => s.tankId === tank.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastSupply = tankSupplies[0];
  
  const tankCorrections = store.stockCorrections.filter(c => c.tankId === tank.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Consommation (Sales via shifts)
  const todayStr = (new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
  const monthStr = todayStr.substring(0, 7);
  const tankNozzleIds = tankNozzles.map(n => n.id);
  const completedShifts = store.shifts.filter(s => s.status === 'completed' || s.status === 'ready_to_close');
  
  const consumedToday = completedShifts.filter(s => s.date === todayStr).reduce((sum, shift) => {
    let sSum = 0;
    if (shift.litersSold) tankNozzleIds.forEach(nid => sSum += (shift.litersSold[nid] || 0));
    return sum + sSum;
  }, 0);
  const consumedMonth = completedShifts.filter(s => s.date.startsWith(monthStr)).reduce((sum, shift) => {
    let sSum = 0;
    if (shift.litersSold) tankNozzleIds.forEach(nid => sSum += (shift.litersSold[nid] || 0));
    return sum + sSum;
  }, 0);

  return (
    <div className="fixed inset-0 bg-[#0f172a80] backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-[#f8fafc80]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${fuelColorInfo.bg}`}>
              <Droplet className={`w-5 h-5 ${fuelColorInfo.text}`} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                {tank.number}
                {tank.status === 'maintenance' && <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">En maintenance</span>}
                {tank.status === 'offline' && <span className="text-[10px] uppercase font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded">Hors service</span>}
              </h3>
              <p className="text-xs text-slate-500">{tank.productName} • {tank.capacity}L</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Colonne gauche : Jauge et Infos principales */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-center">
                <h4 className="text-sm font-bold text-slate-800 mb-4 font-display">Niveau Actuel</h4>
                <div className="relative inline-block">
                  <svg width="120" height="180" viewBox="0 0 100 150" className="mx-auto">
                    <rect x="15" y="10" width="70" height="130" rx="35" fill="none" stroke="#cbd5e1" strokeWidth="4" />
                    <rect x="15" y="10" width="70" height="130" rx="35" fill="#f8fafc" />
                    <defs>
                      <clipPath id={`clip-detail-${tank.id}`}>
                        <rect x="15" y="10" width="70" height="130" rx="35" />
                      </clipPath>
                    </defs>
                    <g clipPath={`url(#clip-detail-${tank.id})`}>
                      <rect x="15" y={140 - (130 * (currentPercent / 100))} width="70" height={130 * (currentPercent / 100)} fill={fuelColorInfo.hex} opacity="0.8" />
                    </g>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-800 drop-shadow-md bg-white/70 px-2 py-1 rounded-lg backdrop-blur-sm">{currentPercent}%</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">Volume Actuel</span>
                    <span className="font-mono text-sm font-bold text-slate-800">{tank.currentLevel.toFixed(2)} L</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">Seuil Alerte</span>
                    <span className="font-mono text-sm font-bold text-slate-800">{tank.minLevel} L</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-4 font-display">Pompes & Pistolets alimentés</h4>
                {fedPumps.length > 0 ? (
                  <div className="space-y-3">
                    {fedPumps.map(pump => (
                      <div key={pump.id} className="text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                        <div className="font-bold text-slate-700 flex items-center gap-2">
                          <Fuel className="w-3.5 h-3.5 text-slate-400" /> {pump.number}
                        </div>
                        <div className="pl-5 mt-1 flex flex-wrap gap-1">
                          {tankNozzles.filter(n => n.pumpId === pump.id).map(noz => (
                            <span key={noz.id} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">{noz.name}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">Aucune pompe connectée à cette cuve.</p>
                )}
              </div>
            </div>

            {/* Colonne droite : Statistiques et Historiques */}
            <div className="lg:col-span-2 space-y-6">
              
              
              {/* Graphique d'évolution du niveau */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-4 font-display">Évolution du niveau (7 derniers jours)</h4>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { day: 'J-6', level: tank.capacity * 0.3 },
                      { day: 'J-5', level: tank.capacity * 0.2 },
                      { day: 'J-4', level: tank.capacity * 0.15 },
                      { day: 'J-3', level: tank.capacity * 0.8 },
                      { day: 'J-2', level: tank.capacity * 0.6 },
                      { day: 'J-1', level: tank.capacity * 0.4 },
                      { day: 'Auj', level: tank.currentLevel }
                    ]} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={fuelColorInfo.hex} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={fuelColorInfo.hex} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis hide domain={[0, tank.capacity]} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`${Math.round(value)} L`, 'Niveau']}
                      />
                      <Area type="monotone" dataKey="level" stroke={fuelColorInfo.hex} strokeWidth={2} fillOpacity={1} fill="url(#colorLevel)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <BarChart2 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Consommation Aujourd'hui</span>
                    <span className="text-lg font-black text-slate-800">{consumedToday.toFixed(2)} L</span>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Consommation Mois ({new Date().toLocaleString('fr-FR', {month:'short'})})</span>
                    <span className="text-lg font-black text-slate-800">{consumedMonth.toFixed(2)} L</span>
                  </div>
                </div>
              </div>

              {/* Historique des Livraisons */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 font-display flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-indigo-500" /> Historique des Livraisons
                  </h4>
                </div>
                {tankSupplies.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                      <tr>
                        <th className="p-3 font-medium">Date</th>
                        <th className="p-3 font-medium">Fournisseur</th>
                        <th className="p-3 font-medium">N° Facture</th>
                        <th className="p-3 font-medium text-right">Quantité (L)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tankSupplies.slice(0, 5).map(sup => (
                        <tr key={sup.id} className="hover:bg-slate-50">
                          <td className="p-3 font-medium text-slate-700">{new Date(sup.date).toLocaleDateString('fr-FR')}</td>
                          <td className="p-3 text-slate-600">{sup.supplier}</td>
                          <td className="p-3 text-slate-500 font-mono text-xs">{sup.invoiceNumber}</td>
                          <td className="p-3 font-mono font-bold text-indigo-600 text-right">+{sup.qtyDelivered}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center text-slate-500 text-sm">Aucune livraison enregistrée.</div>
                )}
              </div>

              {/* Historique des Corrections */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 font-display flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-500" /> Corrections Manuelles
                  </h4>
                </div>
                {tankCorrections.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                      <tr>
                        <th className="p-3 font-medium">Date</th>
                        <th className="p-3 font-medium">Avant/Après</th>
                        <th className="p-3 font-medium text-right">Écart (L)</th>
                        <th className="p-3 font-medium">Raison</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tankCorrections.slice(0, 5).map(corr => {
                        const diff = corr.qtyAfter - corr.qtyBefore;
                        return (
                          <tr key={corr.id} className="hover:bg-slate-50">
                            <td className="p-3 font-medium text-slate-700">{new Date(corr.date).toLocaleDateString('fr-FR')}</td>
                            <td className="p-3 text-slate-500 font-mono text-xs">{corr.qtyBefore} → {corr.qtyAfter}</td>
                            <td className={`p-3 font-mono font-bold text-right ${diff < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {diff > 0 ? '+' : ''}{diff}
                            </td>
                            <td className="p-3 text-slate-600 text-xs">{corr.reason}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center text-slate-500 text-sm">Aucune correction enregistrée.</div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


interface TankHistoryModalProps {
  store: ERPStoreType;
  tank: Tank;
  onClose: () => void;
}

function TankHistoryModal({ store, tank, onClose }: TankHistoryModalProps) {
  const fuelColorInfo = getFuelColor(tank.productName || tank.productId, tank.color);

  // Generate 15 days of mock history based on the current level
    const data = React.useMemo(() => {
    const getLocalYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const tankNozzleIds = store.nozzles.filter(n => n.tankId === tank.id).map(n => n.id);
    
    const salesPerDay: Record<string, number> = {};
    store.shifts.filter(s => s.status === 'completed' || s.status === 'ready_to_close').forEach(shift => {
      const d = shift.date.split('T')[0];
      let shiftSales = 0;
      if (shift.litersSold) {
        tankNozzleIds.forEach(nid => {
          if (shift.litersSold![nid]) {
            shiftSales += shift.litersSold![nid];
          }
        });
      }
      salesPerDay[d] = (salesPerDay[d] || 0) + shiftSales;
    });

    const deliveriesPerDay: Record<string, number> = {};
    store.supplies.forEach(s => {
      if (s.tankId === tank.id) {
        const d = s.date.split('T')[0];
        deliveriesPerDay[d] = (deliveriesPerDay[d] || 0) + s.qtyDelivered;
      }
    });

    const correctionsPerDay: Record<string, number> = {};
    store.stockCorrections.forEach(c => {
      if (c.tankId === tank.id) {
        const d = c.date.split('T')[0];
        const diff = c.qtyAfter - c.qtyBefore;
        correctionsPerDay[d] = (correctionsPerDay[d] || 0) + diff;
      }
    });

    let currentLvl = tank.currentLevel;
    const levels = [];

    const today = new Date();

    for (let i = 0; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dStr = getLocalYMD(date);
      
      levels.unshift({
        dateStr: dStr,
        displayDate: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        level: Math.max(0, Math.min(tank.capacity, currentLvl)),
      });

      // Go backwards to the previous day's end level
      const sales = salesPerDay[dStr] || 0;
      const deliveries = deliveriesPerDay[dStr] || 0;
      const corrections = correctionsPerDay[dStr] || 0;
      
      currentLvl = currentLvl - deliveries - corrections + sales;
    }

    return levels.map(l => ({ date: l.displayDate, level: Math.round(l.level) }));
  }, [tank, store]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-display font-bold text-slate-800">
            Historique du niveau de carburant dans la citerne : {tank.number}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  domain={[0, tank.capacity]}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <RechartsTooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} L`, 'Niveau']} 
                  labelStyle={{color: '#64748b', marginBottom: '0.25rem'}}
                />
                <Bar 
                  dataKey="level" 
                  name="Niveau" 
                  fill="#1e3a8a" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
