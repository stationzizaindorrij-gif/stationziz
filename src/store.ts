import { supabase } from './lib/supabase';
import React, { useState
, useEffect } from 'react';
import { 
  Supplier, Client, PurchaseInvoice, SalesInvoice, ShopProduct, PriceChange, 
  AuditLog, CashRegistry, Shift, Alert, Supply, Tank, Product, Attendant,
  StationConfig, UserRole, User, StockCorrection, Pump, Nozzle, Sale
} from './types';

export interface ERPStoreType {
  loadInitialData: (data?: any) => void;
  products: Product[];
  shopProducts: ShopProduct[];
  tanks: Tank[];
  pumps: Pump[];
  nozzles: Nozzle[];
  attendants: Attendant[];
  shifts: Shift[];
  sales: Sale[];
  supplies: Supply[];
  cashRegistry: CashRegistry;
  stockCorrections: StockCorrection[];
  auditLogs: AuditLog[];
  alerts: Alert[];
  users: User[];
  config: StationConfig;
  currentRole: UserRole;
  priceChanges: PriceChange[];
  suppliers: Supplier[];
  clients: Client[];
  purchaseInvoices: PurchaseInvoice[];
  salesInvoices: SalesInvoice[];
  deliveryInvoices: SalesInvoice[];

  switchRole: (role: UserRole) => void;
  markAlertAsRead: (id: string) => void;
  clearAllAlerts: () => void;
  resetAllData: () => Promise<void>;

  addAttendant: (attendant: Omit<Attendant, 'id'>, author: string) => void;
  updateAttendant: (id: string, updates: Partial<Attendant>, author: string) => void;
  deleteAttendant: (id: string, author: string) => void;

  addShopProduct: (product: Omit<ShopProduct, 'id'>, author: string) => void;
  updateShopProduct: (id: string, updates: Partial<ShopProduct>, author: string) => void;
  deleteShopProduct: (id: string, author: string) => void;

  addProduct: (product: Omit<Product, 'id'>, author: string) => void;
  updateProduct: (id: string, updates: Partial<Product>, author: string) => void;
  deleteProduct: (id: string, author: string) => void;

  addTank: (tank: Omit<Tank, 'id'>, author: string) => void;
  updateTank: (id: string, updates: Partial<Tank>, author: string) => void;
  deleteTank: (id: string, author: string) => void;
  correctTankLevel: (tankId: string, newLevel: number, reason: string, author: string) => void;
  deleteStockCorrection: (id: string, author: string) => void;

  addPump: (pump: Omit<Pump, 'id'>, author: string) => void;
  updatePump: (id: string, updates: Partial<Pump>, author: string) => void;
  deletePump: (id: string, author: string) => void;
  reorderPumps: (pumps: Pump[]) => void;

  addNozzle: (nozzle: Omit<Nozzle, 'id'>, author: string) => void;
  updateNozzle: (id: string, updates: Partial<Nozzle>, author: string) => void;
  deleteNozzle: (id: string, author: string) => void;

  addSupply: (supply: Omit<Supply, 'id'>, author: string) => void;
  deleteSupply: (id: string, author: string) => void;

  addSupplier: (supplier: Omit<Supplier, 'id'>, author: string) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>, author: string) => void;
  deleteSupplier: (id: string, author: string) => void;

  addClient: (client: Omit<Client, 'id'>, author: string) => void;
  addClients: (newClients: Omit<Client, 'id'>[], author: string) => void;
  updateClient: (id: string, updates: Partial<Client>, author: string) => void;
  deleteClient: (id: string, author: string) => void;

  addPurchaseInvoice: (invoice: Omit<PurchaseInvoice, 'id'>, author: string) => void;
  updatePurchaseInvoiceStatus: (id: string, status: 'pending' | 'paid', author: string) => void;
  updatePurchaseInvoice: (id: string, updates: Partial<PurchaseInvoice>, author: string) => void;
  deletePurchaseInvoice: (id: string, author: string) => void;

  addSalesInvoice: (invoice: Omit<SalesInvoice, 'id'>, author: string) => void;
  updateSalesInvoice: (id: string, updates: Partial<SalesInvoice>, author: string) => void;
  deleteSalesInvoice: (id: string, author: string) => void;

  addDeliveryInvoice: (invoice: Omit<SalesInvoice, 'id'>, author: string) => void;
  updateDeliveryInvoice: (id: string, updates: Partial<SalesInvoice>, author: string) => void;
  deleteDeliveryInvoice: (id: string, author: string) => void;

  openCashRegistry: (amount: number, author: string) => void;
  addCashMovement: (type: 'input' | 'output', amount: number, label: string, author: string) => void;
  closeCashRegistry: (realCash: number, author: string) => void;

  startShift: (attendantId: string, shiftName: Shift['shiftName'], assignedPumpIds: string[], author: string, customStartCounters?: Shift['startCounters']) => void;
  submitShiftCounters: (shiftId: string, endCounters: any, author: string) => void;
  finalizeShiftClosing: (shiftId: string, realCash: number, theoreticalCash: number, notes: string, author: string, updatedTotals?: any) => void;
  deleteShift: (id: string, author: string) => void;
  updateShift: (id: string, updates: Partial<Shift>, author: string) => void;
  
  updateConfig?: (fields: Partial<StationConfig>, author: string) => void;
  addCompletedShift?: (data: any, author: string) => void;
}

export function useERPStore(): ERPStoreType {
  const [products, setProducts] = useState<Product[]>([]);
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [nozzles, setNozzles] = useState<Nozzle[]>([]);
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  
  // Migration for dummy data dates
  React.useEffect(() => {
    const localToday = (new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
    if (shifts.length > 0 && shifts.some(s => s.id === 'shift_past_1' && s.date !== localToday)) {
      const updatedShifts = shifts.map(s => {
        if (s.id.startsWith('shift_past')) {
          return { ...s, date: localToday };
        }
        return s;
      });
      setShifts(updatedShifts);
      localStorage.setItem('erp_state_shifts', JSON.stringify(updatedShifts));
    }
  }, [shifts]);

  const [sales, setSales] = useState<Sale[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [cashRegistry, setCashRegistry] = useState<CashRegistry>({
    id: 'cash_session_current', isOpen: false, openedAt: '', openedBy: '', openingCash: 0, inputs: [], outputs: [], theoreticalCash: 0
  });
  const [stockCorrections, setStockCorrections] = useState<StockCorrection[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<StationConfig>({
    name: 'Station ERP', logo: '⛽', address: '', phone: '', taxId: '', autoBackup: true, language: 'fr', theme: 'light', printerIp: '', iotConfigured: false
  });
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [deliveryInvoices, setDeliveryInvoices] = useState<SalesInvoice[]>([]);

  // Forced migration for specific historical prices
  React.useEffect(() => {
    if (products.length > 0) {
       const isFixed = localStorage.getItem('erp_price_history_fixed_v6');
       if (!isFixed) {
          const sp = products.find(p => p.name.toLowerCase().includes('sans plom') || p.name.toLowerCase().includes('sans-plom'));
          const melange = products.find(p => p.name.toLowerCase().includes('lange') || p.name.toLowerCase().includes('mélange'));
          const gasoil = products.find(p => p.name.toLowerCase().includes('gasoil') || p.name.toLowerCase().includes('gazoil'));
          
          // Keep existing non-fuel price changes
          const otherChanges = priceChanges.filter(pc => 
             (!sp || pc.productId !== sp.id) && 
             (!melange || pc.productId !== melange.id) && 
             (!gasoil || pc.productId !== gasoil.id)
          );
          
          let newChanges = [...otherChanges];
          
          if (sp) {
             newChanges.push({ id: `fixed_sp_1`, date: '2026-07-03T08:00:00.000Z', productId: sp.id, productType: sp.type, purchasePrice: 11.71, salePrice: 12.71, oldPurchasePrice: 11.71, oldSalePrice: 12.71 });
             newChanges.push({ id: `fixed_sp_2`, date: '2026-07-06T08:00:00.000Z', productId: sp.id, productType: sp.type, purchasePrice: 12.71, salePrice: 13.71, oldPurchasePrice: 11.71, oldSalePrice: 12.71 });
             newChanges.push({ id: `fixed_sp_3`, date: '2026-07-09T08:00:00.000Z', productId: sp.id, productType: sp.type, purchasePrice: 15.90, salePrice: 16.45, oldPurchasePrice: 12.71, oldSalePrice: 13.71 });
          }
          if (melange) {
             newChanges.push({ id: `fixed_mel_1`, date: '2026-07-03T08:00:00.000Z', productId: melange.id, productType: melange.type, purchasePrice: 11.71, salePrice: 12.71, oldPurchasePrice: 11.71, oldSalePrice: 12.71 });
             newChanges.push({ id: `fixed_mel_2`, date: '2026-07-06T08:00:00.000Z', productId: melange.id, productType: melange.type, purchasePrice: 12.71, salePrice: 13.71, oldPurchasePrice: 11.71, oldSalePrice: 12.71 });
             newChanges.push({ id: `fixed_mel_3`, date: '2026-07-09T08:00:00.000Z', productId: melange.id, productType: melange.type, purchasePrice: 15.90, salePrice: 16.45, oldPurchasePrice: 12.71, oldSalePrice: 13.71 });
          }
          if (gasoil) {
             newChanges.push({ id: `fixed_gas_1`, date: '2026-07-03T08:00:00.000Z', productId: gasoil.id, productType: gasoil.type, purchasePrice: 13.45, salePrice: 14.45, oldPurchasePrice: 13.45, oldSalePrice: 14.45 });
             newChanges.push({ id: `fixed_gas_2`, date: '2026-07-06T08:00:00.000Z', productId: gasoil.id, productType: gasoil.type, purchasePrice: 14.45, salePrice: 15.45, oldPurchasePrice: 13.45, oldSalePrice: 14.45 });
             newChanges.push({ id: `fixed_gas_3`, date: '2026-07-09T08:00:00.000Z', productId: gasoil.id, productType: gasoil.type, purchasePrice: 14.27, salePrice: 14.71, oldPurchasePrice: 14.45, oldSalePrice: 15.45 });
          }
          
          saveState('price_changes', newChanges, setPriceChanges);
          
          // Force update products current prices as well
          const updatedProducts = products.map(p => {
             if (sp && p.id === sp.id) return { ...p, purchasePrice: 15.90, salePrice: 16.45 };
             if (melange && p.id === melange.id) return { ...p, purchasePrice: 15.90, salePrice: 16.45 };
             if (gasoil && p.id === gasoil.id) return { ...p, purchasePrice: 14.27, salePrice: 14.71 };
             return p;
          });
          saveState('products', updatedProducts, setProducts);
          
          localStorage.setItem('erp_price_history_fixed_v6', 'true');
       }
    }
  }, [products, priceChanges]);

// Migration to reconstruct missing price changes from past sales and supplies
  React.useEffect(() => {
    if (products.length > 0 && (sales.length > 0 || supplies.length > 0)) {
      const generatedChanges: PriceChange[] = [];
      const now = new Date().getTime();
      
      products.forEach(p => {
        // Find all unique sale prices and purchase prices over time
        const pSales = sales.filter(s => s.productId === p.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const pSupplies = supplies.filter(s => s.productId === p.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let lastKnownSale = p.salePrice;
        let lastKnownPurchase = p.purchasePrice;
        
        // Reverse chronological order to find when prices changed
        const allEvents = [
          ...pSales.map(s => ({ type: 'sale', date: s.date, time: s.time || '00:00:00', price: s.price })),
          ...pSupplies.map(s => ({ type: 'supply', date: s.date, time: '00:00:00', price: s.purchasePrice }))
        ].sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
        
        allEvents.forEach((ev, idx) => {
           if (ev.type === 'sale' && ev.price !== lastKnownSale) {
              const oldSalePrice = ev.price;
              // It means before this point, the price was different from the CURRENT lastKnownSale.
              // We need to create a price change at the boundary!
           }
        });
        
        // Actually, a simpler way is to just generate a price change for EVERY distinct price we see historically,
        // placed at the timestamp of the first sale/supply that had that price.
        
        // Let's go chronologically instead.
        const chronoEvents = [...allEvents].reverse();
        
        let currentPurchase = chronoEvents.find(e => e.type === 'supply')?.price || p.purchasePrice;
        let currentSale = chronoEvents.find(e => e.type === 'sale')?.price || p.salePrice;
        
        let hasChanges = false;
        
        chronoEvents.forEach(ev => {
           let changed = false;
           let oldP = currentPurchase;
           let oldS = currentSale;
           
           if (ev.type === 'sale' && ev.price !== currentSale) {
              currentSale = ev.price;
              changed = true;
           }
           if (ev.type === 'supply' && ev.price !== currentPurchase) {
              currentPurchase = ev.price;
              changed = true;
           }
           
           if (changed) {
              hasChanges = true;
              generatedChanges.push({
                id: `migrated_price_${p.id}_${ev.date}_${ev.time}_${Math.random()}`,
                date: `${ev.date}T${ev.time}`,
                productId: p.id,
                productType: p.type,
                purchasePrice: currentPurchase,
                salePrice: currentSale,
                oldPurchasePrice: oldP,
                oldSalePrice: oldS
              });
           }
        });
        
        // If current prices in products array are different from the last inferred event,
        // add one more change for the current state.
        if (currentPurchase !== p.purchasePrice || currentSale !== p.salePrice) {
            generatedChanges.push({
                id: `migrated_price_current_${p.id}_${Math.random()}`,
                date: new Date(now - 1000).toISOString(),
                productId: p.id,
                productType: p.type,
                purchasePrice: p.purchasePrice,
                salePrice: p.salePrice,
                oldPurchasePrice: currentPurchase,
                oldSalePrice: currentSale
            });
        }
      });
      
      if (generatedChanges.length > 0) {
        // Find changes that are older than any existing recorded price change for the product
        // Or if no price changes exist at all
        const newChangesToSave = generatedChanges.filter(gc => {
            const existingForProduct = priceChanges.filter(pc => pc.productId === gc.productId);
            if (existingForProduct.length === 0) return true;
            
            // If the generated change is strictly older than the OLDEST recorded change
            const oldestRecorded = Math.min(...existingForProduct.map(pc => new Date(pc.date).getTime()));
            return new Date(gc.date).getTime() < oldestRecorded;
        });
        
        if (newChangesToSave.length > 0) {
           saveState('price_changes', [...priceChanges, ...newChangesToSave], setPriceChanges);
        }
      }
    }
  }, [sales, supplies, products, priceChanges]);
  



  const loadInitialData = (externalData?: any) => {
    try {
      const dataStr = localStorage.getItem('erp_data');
      const data = externalData || (dataStr ? JSON.parse(dataStr) : null);
      if (data) {
        if (data.products) setProducts(data.products);
        if (data.shop_products) setShopProducts(data.shop_products);
        if (data.tanks) setTanks(data.tanks);
        if (data.pumps) setPumps(data.pumps);
        if (data.nozzles) setNozzles(data.nozzles);
        if (data.attendants) setAttendants(data.attendants);
        if (data.shifts) setShifts(data.shifts);
        if (data.sales) setSales(data.sales);
        if (data.supplies) setSupplies(data.supplies);
        if (data.cash_registry) setCashRegistry(data.cash_registry);
        if (data.stock_corrections) setStockCorrections(data.stock_corrections);
        if (data.audit_logs) setAuditLogs(data.audit_logs);
        if (data.alerts) setAlerts(data.alerts);
        if (data.users) setUsers(data.users);
        if (data.config) setConfig(data.config);
        if (data.price_changes) setPriceChanges(data.price_changes);
        if (data.suppliers) setSuppliers(data.suppliers);
        if (data.clients) setClients(data.clients);
        if (data.purchase_invoices) setPurchaseInvoices(data.purchase_invoices);
        if (data.sales_invoices) setSalesInvoices(data.sales_invoices);
        if (data.delivery_invoices) setDeliveryInvoices(data.delivery_invoices);
      }
    } catch (e) {
      console.error("Failed to load initial data", e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const saveState = (key: string, data: any, setter: React.Dispatch<React.SetStateAction<any>>) => {
    setter(data);
    try {
      const existingStr = localStorage.getItem('erp_data');
      const existing = existingStr ? JSON.parse(existingStr) : {};
      existing[key] = data;
      localStorage.setItem('erp_data', JSON.stringify(existing));
      
      // Async sync to Supabase
      setTimeout(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.user) {
             const user_id = session.user.id;
             if (Array.isArray(data)) {
                 const items = data.map(item => ({ ...item, user_id }));
                 
                 // Smart sync: Upsert existing/new, delete removed
                 let currentItems = [];
                 let from = 0;
                 const step = 1000;
                 let hasMore = true;
                 while(hasMore) {
                   const { data } = await supabase.from(`erp_${key}`).select('id').eq('user_id', user_id).range(from, from + step - 1);
                   if (!data || data.length === 0) {
                     hasMore = false;
                   } else {
                     currentItems = [...currentItems, ...data];
                     if (data.length < step) hasMore = false;
                     from += step;
                   }
                 }
                 if (currentItems) {
                     const currentIds = currentItems.map(i => i.id);
                     const newIds = items.map(i => i.id);
                     const idsToDelete = currentIds.filter(id => !newIds.includes(id));
                     
                     if (idsToDelete.length > 0) {
                         await supabase.from(`erp_${key}`).delete().in('id', idsToDelete).eq('user_id', user_id);
                     }
                 }
                 
                 if (items.length > 0) {
                     const chunkSize = 100;
                     for (let i = 0; i < items.length; i += chunkSize) {
                         await supabase.from(`erp_${key}`).upsert(items.slice(i, i + chunkSize));
                     }
                 }
             } else if (typeof data === 'object' && data !== null) {
                 // For config and cash_registry
                 await supabase.from(`erp_${key}`).delete().eq('user_id', user_id);
                 await supabase.from(`erp_${key}`).insert({ ...data, user_id });
             }
          }
        } catch(err) {
          console.error('Supabase sync error', err);
        }
      }, 0);
      
    } catch (e) {
      console.error("Failed to save state", e);
    }
  };

  const logAction = (user: string, action: string, module: string, details: string) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      date: (new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]),
      time: new Date().toTimeString().split(' ')[0],
      user,
      action,
      module,
      details
    };
    saveState('audit_logs', [newLog, ...auditLogs], setAuditLogs);
  };

  const triggerAlert = (severity: 'info' | 'warning' | 'danger', message: string, type: Alert['type']) => {
    const newAlert: Alert = {
      id: `alert_${Date.now()}`,
      date: (new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]),
      severity,
      message,
      isRead: false,
      type
    };
    saveState('alerts', [newAlert, ...alerts], setAlerts);
  };

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
  };

  const markAlertAsRead = (id: string) => {
    saveState('alerts', alerts.map(a => a.id === id ? { ...a, isRead: true } : a), setAlerts);
  };

  const clearAllAlerts = () => {
    saveState('alerts', [], setAlerts);
  };

  const addAttendant = (attendant: Omit<Attendant, 'id'>, author: string) => {
    const newAtt = { ...attendant, id: `att_${Date.now()}` };
    saveState('attendants', [...attendants, newAtt], setAttendants);
    logAction(author, 'Ajout Pompiste', 'Pompistes', `Pompiste ${attendant.firstName} ${attendant.lastName} ajouté`);
  };

  const updateAttendant = (id: string, updates: Partial<Attendant>, author: string) => {
    saveState('attendants', attendants.map(a => a.id === id ? { ...a, ...updates } : a), setAttendants);
    logAction(author, 'Modification Pompiste', 'Pompistes', `Pompiste modifié`);
  };

  const deleteAttendant = (id: string, author: string) => {
    saveState('attendants', attendants.filter(a => a.id !== id), setAttendants);
    logAction(author, 'Suppression Pompiste', 'Pompistes', `Pompiste supprimé`);
  };

  const addShopProduct = (product: Omit<ShopProduct, 'id'>, author: string) => {
    saveState('shop_products', [...shopProducts, { ...product, id: `sp_${Date.now()}` }], setShopProducts);
  };

  const updateShopProduct = (id: string, updates: Partial<ShopProduct>, author: string) => {
    saveState('shop_products', shopProducts.map(p => p.id === id ? { ...p, ...updates } : p), setShopProducts);
  };

  const deleteShopProduct = (id: string, author: string) => {
    saveState('shop_products', shopProducts.filter(p => p.id !== id), setShopProducts);
  };

  const addProduct = (product: Omit<Product, 'id'>, author: string) => {
    saveState('products', [...products, { ...product, id: `prod_${Date.now()}` }], setProducts);
  };

  const updateProduct = (id: string, updates: Partial<Product>, author: string) => {
    const existingProduct = products.find(p => p.id === id);
    if (existingProduct) {
      const purchaseChanged = updates.purchasePrice !== undefined && updates.purchasePrice !== existingProduct.purchasePrice;
      const saleChanged = updates.salePrice !== undefined && updates.salePrice !== existingProduct.salePrice;
      
      if (purchaseChanged || saleChanged) {
        const newChange: PriceChange = {
          id: `price_change_${Date.now()}`,
          date: new Date().toISOString(),
          productId: id,
          productType: existingProduct.type,
          purchasePrice: updates.purchasePrice !== undefined ? updates.purchasePrice : existingProduct.purchasePrice,
          salePrice: updates.salePrice !== undefined ? updates.salePrice : existingProduct.salePrice,
          oldPurchasePrice: existingProduct.purchasePrice,
          oldSalePrice: existingProduct.salePrice
        };
        saveState('price_changes', [...priceChanges, newChange], setPriceChanges);
      }
    }
    saveState('products', products.map(p => p.id === id ? { ...p, ...updates } : p), setProducts);
  };

  const deleteProduct = (id: string, author: string) => {
    saveState('products', products.filter(p => p.id !== id), setProducts);
  };

  const addTank = (tank: Omit<Tank, 'id'>, author: string) => {
    saveState('tanks', [...tanks, { ...tank, id: `tank_${Date.now()}` }], setTanks);
  };

  const updateTank = (id: string, updates: Partial<Tank>, author: string) => {
    saveState('tanks', tanks.map(t => t.id === id ? { ...t, ...updates } : t), setTanks);
  };

  const deleteTank = (id: string, author: string) => {
    saveState('tanks', tanks.filter(t => t.id !== id), setTanks);
  };

  const correctTankLevel = (tankId: string, newLevel: number, reason: string, author: string) => {
    const tank = tanks.find(t => t.id === tankId);
    if (!tank) return;
    const qtyBefore = tank.currentLevel;
    saveState('tanks', tanks.map(t => t.id === tankId ? { ...t, currentLevel: newLevel } : t), setTanks);
    const corr: StockCorrection = {
      id: `corr_${Date.now()}`,
      date: (new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]),
      tankId, tankNumber: tank.number, productId: tank.productId, qtyBefore, qtyAfter: newLevel, reason, user: author
    };
    saveState('stock_corrections', [corr, ...stockCorrections], setStockCorrections);
  };

  const deleteStockCorrection = (id: string, author: string) => {
    saveState('stock_corrections', stockCorrections.filter(c => c.id !== id), setStockCorrections);
  };

  const addPump = (pump: Omit<Pump, 'id'>, author: string) => {
    saveState('pumps', [...pumps, { ...pump, id: `pump_${Date.now()}` }], setPumps);
  };

  const updatePump = (id: string, updates: Partial<Pump>, author: string) => {
    saveState('pumps', pumps.map(p => p.id === id ? { ...p, ...updates } : p), setPumps);
  };

  const deletePump = (id: string, author: string) => {
    saveState('pumps', pumps.filter(p => p.id !== id), setPumps);
  };

  const reorderPumps = (newPumps: Pump[]) => {
    saveState('pumps', newPumps, setPumps);
  };

  const addNozzle = (nozzle: Omit<Nozzle, 'id'>, author: string) => {
    saveState('nozzles', [...nozzles, { ...nozzle, id: `noz_${Date.now()}` }], setNozzles);
  };

  const updateNozzle = (id: string, updates: Partial<Nozzle>, author: string) => {
    saveState('nozzles', nozzles.map(n => n.id === id ? { ...n, ...updates } : n), setNozzles);
  };

  const deleteNozzle = (id: string, author: string) => {
    saveState('nozzles', nozzles.filter(n => n.id !== id), setNozzles);
  };

  const addSupply = (supply: Omit<Supply, 'id'>, author: string) => {
    const newSupply: Supply = { ...supply, id: `sup_${Date.now()}` };
    const updatedSupplies = [newSupply, ...supplies];
    saveState('supplies', updatedSupplies, setSupplies);

    // Automatically increase tank level
    const tank = tanks.find(t => t.id === supply.tankId);
    if (tank) {
      const newLevel = Math.min(tank.capacity, tank.currentLevel + supply.qtyDelivered);
      updateTank(tank.id, { currentLevel: newLevel }, author);
      
      // Trigger overflow alert if applicable
      if (tank.currentLevel + supply.qtyDelivered > tank.maxLevel) {
        triggerAlert('danger', `ALERTE DE DÉBORDEMENT de la ${tank.number} évitée de justesse. Niveau après livraison de ${newLevel} L.`, 'overflow');
      }
    }

    logAction(author, 'Réception Livraison', 'Approvisionnement', `Livraison de ${newSupply.qtyDelivered} L de ${newSupply.productName} (Facture: ${newSupply.invoiceNumber}) de ${newSupply.supplier}`);
  };

  const deleteSupply = (id: string, author: string) => {
    const supplyToDelete = supplies.find(s => s.id === id);
    if (!supplyToDelete) return;

    // Remove from supplies
    const updatedSupplies = supplies.filter(s => s.id !== id);
    saveState('supplies', updatedSupplies, setSupplies);

    // Automatically decrease tank level
    const tank = tanks.find(t => t.id === supplyToDelete.tankId);
    if (tank) {
      const newLevel = Math.max(0, tank.currentLevel - supplyToDelete.qtyDelivered);
      updateTank(tank.id, { currentLevel: newLevel }, author);
    }

    logAction(author, 'Suppression Livraison', 'Approvisionnement', `Suppression de livraison de ${supplyToDelete.qtyDelivered} L de ${supplyToDelete.productName} (Facture: ${supplyToDelete.invoiceNumber})`);
  };

  // MODULE 10: CASH REGISTRY (CAISSE)
  const openCashRegistry = (amount: number, author: string) => {
    const now = new Date().toISOString();
    const newRegistry: CashRegistry = {
      id: `cash_${Date.now()}`,
      isOpen: true,
      openedAt: now,
      openedBy: author,
      openingCash: amount,
      inputs: [],
      outputs: [],
      theoreticalCash: amount
    };
    saveState('cash_registry', newRegistry, setCashRegistry);
    logAction(author, 'Ouverture Caisse', 'Caisse', `Caisse ouverte avec un fond de roulement de ${amount} MAD`);
  };

  const addCashMovement = (type: 'input' | 'output', amount: number, label: string, author: string) => {
    if (!cashRegistry.isOpen) return;

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
    const movement = {
      id: `mvt_${Date.now()}`,
      amount,
      label,
      time: timeStr
    };

    const nextCash = { ...cashRegistry };
    if (type === 'input') {
      nextCash.inputs = [...nextCash.inputs, movement];
      nextCash.theoreticalCash += amount;
    } else {
      nextCash.outputs = [...nextCash.outputs, movement];
      nextCash.theoreticalCash -= amount;
    }

    saveState('cash_registry', nextCash, setCashRegistry);
    logAction(author, `Flux caisse (${type === 'input' ? 'Entrée' : 'Sortie'})`, 'Caisse', `${label} : ${amount} MAD`);
  };

  const closeCashRegistry = (realCash: number, author: string) => {
    if (!cashRegistry.isOpen) return;

    const discrepancy = realCash - cashRegistry.theoreticalCash;
    const now = new Date().toISOString();
    const closed: CashRegistry = {
      ...cashRegistry,
      isOpen: false,
      closedAt: now,
      closedBy: author,
      realCash,
      discrepancy
    };

    saveState('cash_registry', closed, setCashRegistry);
    
    if (discrepancy !== 0) {
      triggerAlert(
        Math.abs(discrepancy) > 10 ? 'danger' : 'warning',
        `Écart de caisse détecté à la fermeture générale : ${discrepancy > 0 ? '+' : ''}${discrepancy.toFixed(2)} MAD. (Réel: ${realCash} MAD / Théorique: ${cashRegistry.theoreticalCash} MAD)`,
        'cash_discrepancy'
      );
    }

    logAction(author, 'Clôture Caisse', 'Caisse', `Caisse clôturée. Réel: ${realCash} MAD, Écart: ${discrepancy.toFixed(2)} MAD`);
  };

  // MODULE 3: SHIFTS
  const startShift = (
    attendantId: string, 
    shiftName: Shift['shiftName'], 
    assignedPumpIds: string[], 
    author: string,
    customStartCounters?: Shift['startCounters']
  ) => {
    const attendant = attendants.find(a => a.id === attendantId);
    if (!attendant) return;

    // Get assigned nozzles to prep starting counters
    const assignedNozzles = nozzles.filter(n => assignedPumpIds.includes(n.pumpId));
    const startCounters: Shift['startCounters'] = {};
    assignedNozzles.forEach(noz => {
      if (customStartCounters && customStartCounters[noz.id]) {
        startCounters[noz.id] = {
          mech: customStartCounters[noz.id].mech,
          elec: customStartCounters[noz.id].elec
        };
      } else {
        startCounters[noz.id] = {
          mech: noz.currentMechCounter,
          elec: noz.currentElecCounter
        };
      }
    });

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    const newShift: Shift = {
      id: `shift_${Date.now()}`,
      attendantId,
      attendantName: `${attendant.firstName} ${attendant.lastName}`,
      date: now.toISOString().split('T')[0],
      shiftName,
      pumpIds: assignedPumpIds,
      status: 'active',
      startTime: timeStr,
      startCounters
    };

    // Update nozzles state if custom start counters were supplied
    if (customStartCounters) {
      const updatedNozzles = nozzles.map(noz => {
        if (customStartCounters[noz.id]) {
          return {
            ...noz,
            currentMechCounter: customStartCounters[noz.id].mech,
            currentElecCounter: customStartCounters[noz.id].elec
          };
        }
        return noz;
      });
      saveState('nozzles', updatedNozzles, setNozzles);
    }

    const updatedShifts = [newShift, ...shifts];
    saveState('shifts', updatedShifts, setShifts);
    logAction(author, 'Ouverture de Shift', 'Shifts', `Shift "${shiftName}" ouvert pour le pompiste ${newShift.attendantName}`);
  };

  const submitShiftCounters = (
    shiftId: string, 
    endCounters: { [nozzleId: string]: { mech: number; elec: number } }, 
    author: string
  ) => {
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) return;

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    // Calculate details for each nozzle
    const litersSold: { [nozzleId: string]: number } = {};
    const amountSold: { [nozzleId: string]: number } = {};
    let totalLiters = 0;
    let totalAmount = 0;

    let currentTanks = [...tanks];
    let tanksChanged = false;
    
    const updatedNozzles = nozzles.map(noz => {
      const endCount = endCounters[noz.id];
      const startCount = shift.startCounters[noz.id];

      if (endCount && startCount) {
        const endElecNum = parseFloat(endCount.elec) || parseFloat(startCount.elec) || 0;
        const startElecNum = parseFloat(startCount.elec) || 0;
        const diffLiters = endElecNum - startElecNum;
        let roundedDiff = Math.max(0, parseFloat(diffLiters.toFixed(2)));
        
        // Fallback to mechanical if electronic is 0
        if (roundedDiff === 0 && endCount.mech && startCount.mech) {
           const endMechNum = parseFloat(endCount.mech) || parseFloat(startCount.mech) || 0;
           const startMechNum = parseFloat(startCount.mech) || 0;
           roundedDiff = Math.max(0, parseFloat((endMechNum - startMechNum).toFixed(2)));
        }
        
        litersSold[noz.id] = roundedDiff;
        
        // Find product price
        const prod = products.find(p => p.id === noz.productId);
        const price = prod?.salePrice || 1.80;
        const amount = parseFloat((roundedDiff * price).toFixed(2));
        amountSold[noz.id] = amount;

        totalLiters += roundedDiff;
        totalAmount += amount;

        // Decrease tank level
        const tankIndex = currentTanks.findIndex(t => t.id === noz.tankId);
        if (tankIndex !== -1 && roundedDiff > 0) {
          const tank = currentTanks[tankIndex];
          const nextLevel = Math.max(0, tank.currentLevel - roundedDiff);
          currentTanks[tankIndex] = { ...tank, currentLevel: nextLevel };
          tanksChanged = true;
          
          if (nextLevel <= tank.minLevel) {
            // Check if we already have an unread alert for this
            const hasAlert = alerts.some(a => a.type === 'low_stock' && a.message.includes(tank.number) && !a.isRead);
            if (!hasAlert) {
              triggerAlert('warning', `Le niveau de la ${tank.number} est faible : ${nextLevel} L restants.`, 'low_stock');
            }
          }
        }

        // Return updated counters for Nozzle
        return {
          ...noz,
          currentMechCounter: endCount.mech,
          currentElecCounter: endCount.elec
        };
      }
      return noz;
    });

    if (tanksChanged) {
      saveState('tanks', currentTanks, setTanks);
    }
    
    // Save updated nozzles to state/localstorage
    saveState('nozzles', updatedNozzles, setNozzles);

    const roundedTotalAmount = parseFloat(totalAmount.toFixed(2));
    const roundedTotalLiters = parseFloat(totalLiters.toFixed(2));
    // Automatically record sales for each nozzle to populate general sales log
    const newSales: Sale[] = [];
    Object.keys(litersSold).forEach((nozId, idx) => {
      const noz = nozzles.find(n => n.id === nozId);
      const qty = litersSold[nozId];
      if (qty > 0 && noz) {
        const prod = products.find(p => p.id === noz.productId);
        const price = prod?.salePrice || 1.80;
        const saleAmount = amountSold[nozId];
        
        newSales.push({
          id: `sale_${Date.now()}_${idx}`,
          date: now.toISOString().split('T')[0],
          time: timeStr,
          productId: noz.productId,
          productName: noz.productName,
          qty,
          price,
          total: saleAmount,
          pumpId: noz.pumpId,
          pumpNumber: noz.pumpNumber,
          nozzleId: noz.id,
          nozzleName: noz.name,
          attendantId: shift.attendantId,
          attendantName: shift.attendantName,
          shiftId: shift.id
        });
      }
    });

    if (newSales.length > 0) {
      saveState('sales', [...newSales, ...sales], setSales);
    }

    // Automatically deposit to cash registry if open
    

    // Update Shift record
    const updatedShifts = shifts.map(s => {
      if (s.id === shiftId) {
        return {
          ...s,
          status: 'ready_to_close' as const,
          endTime: timeStr,
          endCounters,
          litersSold,
          amountSold,
          totalLiters: roundedTotalLiters,
          totalAmount: roundedTotalAmount,
          duration: 8 // Standard 8 hours shift duration
        };
      }
      return s;
    });

    saveState('shifts', updatedShifts, setShifts);

    logAction(author, 'Saisie Index', 'Shifts', `Index saisis pour "${shift.shiftName}" (${shift.attendantName}). Prêt à clôturer.`);
  };
  
  const finalizeShiftClosing = (
    shiftId: string,
    realCash: number,
    theoreticalCash: number,
    notes: string,
    author: string,
    updatedTotals?: { totalLiters: number; totalAmount: number; endCounters?: any }
  ) => {
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) return;
    
    const discrepancy = parseFloat((realCash - theoreticalCash).toFixed(2));
    
    if (cashRegistry.isOpen) {
      addCashMovement('input', realCash, `Clôture journalière (${shift.attendantName} - Shift ${shift.shiftName})`, author);
    }
    
    const updatedShifts = shifts.map(s => {
      if (s.id === shiftId) {
        return {
          ...s,
          status: 'completed' as const,
          theoreticalCash,
          realCashReceived: realCash,
          discrepancy,
          notes,
          ...(updatedTotals ? {
            totalLiters: updatedTotals.totalLiters,
            totalAmount: updatedTotals.totalAmount,
            ...(updatedTotals.endCounters ? { endCounters: updatedTotals.endCounters } : {})
          } : {})
        };
      }
      return s;
    });
    
    saveState('shifts', updatedShifts, setShifts);
    
    if (discrepancy !== 0) {
      triggerAlert(
        Math.abs(discrepancy) > 10 ? 'danger' : 'warning',
        `Écart de caisse de ${discrepancy > 0 ? '+' : ''}${discrepancy} MAD à la clôture du shift de ${shift.attendantName}`,
        'cash_discrepancy'
      );
    }
    
    logAction(author, 'Clôture Journalière', 'Shifts', `Clôture validée pour le shift "${shift.shiftName}". Écart: ${discrepancy} MAD.`);
  };

  // MODULE 15: CONFIGURATION
  
  const addCompletedShift = (
    shiftData: Omit<Shift, 'id' | 'status' | 'discrepancy' | 'totalLiters' | 'totalAmount' | 'litersSold' | 'amountSold' | 'theoreticalCash' | 'realCashReceived' | 'notes'> & {
      realCashReceived: number;
      theoreticalCash: number;
      discrepancy: number;
      notes: string;
      litersSold: { [nozzleId: string]: number };
      amountSold: { [nozzleId: string]: number };
      totalLiters: number;
      totalAmount: number;
      productsSold: Sale[];
      servicesSold: any[];
      expenses: any[];
      nonCashPayments?: { carteSntl: { amount: number; clientId?: string; date?: string }[]; espece: { amount: number; clientId?: string; date?: string }[]; bonCarburantsVivo: { amount: number; clientId?: string; date?: string }[]; vignette: { amount: number; clientId?: string; date?: string }[]; bonClient: { amount: number; clientName?: string; date?: string }[]; };
    },
    author: string
  ) => {
    const now = new Date();
    const newShift: Shift = {
      ...shiftData,
      id: shiftData.id || `shift_${Date.now()}`,
      status: 'completed'
    };

    // Update nozzle counters and tank levels
    let currentTanks = [...tanks];
    let tanksChanged = false;

    const updatedNozzles = nozzles.map(noz => {
      if (shiftData.pumpIds.includes(noz.pumpId) && shiftData.endCounters) {
        const endCount = shiftData.endCounters[noz.id];
        if (endCount) {
          const startCount = shiftData.startCounters[noz.id];
const eElec = Number(endCount.elec) || Number(startCount.elec) || 0;
          const eMech = Number(endCount.mech) || Number(startCount.mech) || 0;
          
          // Use the exactly calculated litersSold from the shift data
          const roundedDiff = shiftData.litersSold[noz.id] || 0;
          
          // Decrease tank level
          const tankIndex = currentTanks.findIndex(t => t.id === noz.tankId);
          if (tankIndex !== -1 && roundedDiff > 0) {
            const tank = currentTanks[tankIndex];
            const nextLevel = Math.max(0, tank.currentLevel - roundedDiff);
            currentTanks[tankIndex] = { ...tank, currentLevel: nextLevel };
            tanksChanged = true;
            
            if (nextLevel <= tank.minLevel) {
              const hasAlert = alerts.some(a => a.type === 'low_stock' && a.message.includes(tank.number) && !a.isRead);
              if (!hasAlert) {
                triggerAlert('warning', `Le niveau de la ${tank.number} est faible : ${nextLevel} L restants.`, 'low_stock');
              }
            }
          }
          
return {
            ...noz,
            currentMechCounter: eMech,
            currentElecCounter: eElec
          };
        }
      }
      return noz;
    });

    if (tanksChanged) {
      saveState('tanks', currentTanks, setTanks);
    }
    saveState('nozzles', updatedNozzles, setNozzles);

    // Save fuel sales
    const newSales: Sale[] = [];
    Object.keys(shiftData.litersSold).forEach((nozId, idx) => {
      const noz = nozzles.find(n => n.id === nozId);
      const qty = shiftData.litersSold[nozId];
      if (qty > 0 && noz) {
        const prod = products.find(p => p.id === noz.productId);
        const price = prod?.salePrice || 1.80;
        const saleAmount = shiftData.amountSold[nozId];
        
        newSales.push({
          id: `sale_${Date.now()}_${idx}`,
          date: shiftData.date,
          time: shiftData.endTime || shiftData.startTime,
          productId: noz.productId,
          productName: noz.productName,
          qty,
          price,
          total: saleAmount,
          pumpId: noz.pumpId,
          pumpNumber: noz.pumpNumber,
          nozzleId: noz.id,
          nozzleName: noz.name,
          attendantId: shiftData.attendantId,
          attendantName: shiftData.attendantName,
          shiftId: newShift.id
        });
      }
    });

    // Also include product sales if any
    let updatedShopProducts = [...shopProducts];
    shiftData.productsSold.forEach((p, idx) => {
       newSales.push({
         ...p,
         id: `sale_${Date.now()}_prod_${idx}`,
         date: shiftData.date,
         time: shiftData.endTime || shiftData.startTime,
         attendantId: shiftData.attendantId,
         attendantName: shiftData.attendantName,
         shiftId: newShift.id
       });
       
       if (p.shopProductId) {
         updatedShopProducts = updatedShopProducts.map(sp => {
            if (sp.id === p.shopProductId) {
                const newStock = Math.max(0, sp.stockQuantity - p.qty);
                // Trigger alert if stock falls below or equals minStockAlert
                if (sp.minStockAlert !== undefined && newStock <= sp.minStockAlert && sp.stockQuantity > sp.minStockAlert) {
                    triggerAlert('warning', `Le produit ${sp.name} est en rupture ou proche de la rupture de stock (${newStock} restants).`, 'low_stock');
                } else if (sp.minStockAlert !== undefined && newStock <= sp.minStockAlert && sp.stockQuantity <= sp.minStockAlert) {
                    // Already alerted, but maybe still trigger or not. We'll trigger it anyway to be safe, or only when it crosses the threshold.
                    // Actually, let's only trigger if it crossed the threshold to avoid spamming alerts on every sale.
                    // Wait, if they sell it again while it's low, they might still want an alert. 
                    // Let's keep it simple: trigger it every time if they sell a low stock item.
                    triggerAlert('warning', `Le produit ${sp.name} est en rupture ou proche de la rupture de stock (${newStock} restants).`, 'low_stock');
                }
                return { ...sp, stockQuantity: newStock };
            }
            return sp;
         });
       }
    });
    
    if (shiftData.productsSold.some(p => p.shopProductId)) {
       saveState('shop_products', updatedShopProducts, setShopProducts);
    }

    if (newSales.length > 0) {
      saveState('sales', [...newSales, ...sales], setSales);
    }

    if (cashRegistry.isOpen) {
      addCashMovement('input', shiftData.realCashReceived, `Clôture journalière (${shiftData.attendantName} - Shift ${shiftData.shiftName})`, author);
    }

    if (shiftData.id) {
      saveState('shifts', shifts.map(s => s.id === shiftData.id ? newShift : s), setShifts);
    } else {
      saveState('shifts', [newShift, ...shifts], setShifts);
    }

    logAction(author, 'Saisie Shift', 'Shifts', `Shift "${shiftData.shiftName}" de ${shiftData.attendantName} saisi manuellement. Écart: ${shiftData.discrepancy} MAD.`);
  };

  const updateConfig = (updatedFields: Partial<StationConfig>, author: string) => {
    const nextConfig = { ...config, ...updatedFields };
    saveState('config', nextConfig, setConfig);
    logAction(author, 'Mise à jour configuration', 'Paramètres', `Informations de la station modifiées.`);
  };

  // RESET SYSTEM
  const resetAllData = async () => {
    setProducts([]);
    setShopProducts([]);
    setTanks([]);
    setPumps([]);
    setNozzles([]);
    setAttendants([]);
    setShifts([]);
    setSales([]);
    setSupplies([]);
    setCashRegistry({
      id: 'cash_session_current', isOpen: false, openedAt: '', openedBy: '', openingCash: 0, inputs: [], outputs: [], theoreticalCash: 0
    });
    setStockCorrections([]);
    setAuditLogs([]);
    setAlerts([]);
    setUsers([]);
    setConfig({
      name: 'Station ERP', logo: '⛽', address: '', phone: '', taxId: '', autoBackup: true, language: 'fr', theme: 'light', printerIp: '', iotConfigured: false
    });
    setCurrentRole('admin');
  };

  const addSupplier = (supplier: Omit<Supplier, 'id'>, author: string) => {
    const newSupplier = { ...supplier, id: `supp_${Date.now()}` };
    const updated = [...suppliers, newSupplier];
    saveState('suppliers', updated, setSuppliers);
    logAction(author, 'Création Fournisseur', 'Achats', `Création du fournisseur ${newSupplier.name}`);
  };

  const updateSupplier = (id: string, updatedFields: Partial<Supplier>, author: string) => {
    const updated = suppliers.map(s => s.id === id ? { ...s, ...updatedFields } : s);
    saveState('suppliers', updated, setSuppliers);
    logAction(author, 'Modification Fournisseur', 'Achats', `Mise à jour du fournisseur ${id}`);
  };

  const deleteSupplier = (id: string, author: string) => {
    const updated = suppliers.filter(s => s.id !== id);
    saveState('suppliers', updated, setSuppliers);
    logAction(author, 'Suppression Fournisseur', 'Achats', `Fournisseur ${id} supprimé`);
  };

  const addClient = (client: Omit<Client, 'id'>, author: string) => {
    const newClient = { ...client, id: `client_${Date.now()}` };
    const updated = [...clients, newClient];
    saveState('clients', updated, setClients);
    logAction(author, 'Création Client', 'Ventes', `Création du client pro ${newClient.name}`);
  };

  const addClients = (newClients: Omit<Client, 'id'>[], author: string) => {
    if (newClients.length === 0) return;
    const clientsToAdd = newClients.map((client, idx) => ({ ...client, id: `client_${Date.now()}_${idx}` }));
    const updated = [...clients, ...clientsToAdd];
    saveState('clients', updated, setClients);
    logAction(author, 'Création Clients', 'Ventes', `Création de ${clientsToAdd.length} clients pro`);
  };

  const updateClient = (id: string, updatedFields: Partial<Client>, author: string) => {
    const updated = clients.map(c => c.id === id ? { ...c, ...updatedFields } : c);
    saveState('clients', updated, setClients);
    logAction(author, 'Modification Client', 'Ventes', `Mise à jour du client pro ${id}`);
  };

  const deleteClient = (id: string, author: string) => {
    const updated = clients.filter(c => c.id !== id);
    saveState('clients', updated, setClients);
    logAction(author, 'Suppression Client', 'Ventes', `Client pro ${id} supprimé`);
  };

  const addPurchaseInvoice = (invoice: Omit<PurchaseInvoice, 'id'>, author: string) => {
    const newInvoice = { ...invoice, id: `pinv_${Date.now()}` };
    const updated = [...purchaseInvoices, newInvoice];
    saveState('purchase_invoices', updated, setPurchaseInvoices);
    
    logAction(author, 'Facture Client', 'Ventes', `Facture ${newInvoice.invoiceNumber} enregistrée`);
  };

  const updatePurchaseInvoiceStatus = (id: string, status: 'pending' | 'paid', author: string) => {
    const updated = purchaseInvoices.map(p => p.id === id ? { ...p, status } : p);
    saveState('purchase_invoices', updated, setPurchaseInvoices);
    logAction(author, 'Statut Facture', 'Achats', `Facture ${id} marquée comme ${status}`);
  };

  const updatePurchaseInvoice = (id: string, updates: Partial<PurchaseInvoice>, author: string) => {
    const updated = purchaseInvoices.map(p => p.id === id ? { ...p, ...updates } : p);
    saveState('purchase_invoices', updated, setPurchaseInvoices);
    logAction(author, 'Modification', 'Achats', `Facture ${id} modifiée`);
  };

  const deletePurchaseInvoice = (id: string, author: string) => {
    const updated = purchaseInvoices.filter(p => p.id !== id);
    saveState('purchase_invoices', updated, setPurchaseInvoices);
    logAction(author, 'Suppression', 'Achats', `Facture ${id} supprimée`);
  };

  const addSalesInvoice = (invoice: Omit<SalesInvoice, 'id'>, author: string) => {
    const newInvoice = { ...invoice, id: `sinv_${Date.now()}` };
    const updated = [...salesInvoices, newInvoice];
    saveState('sales_invoices', updated, setSalesInvoices);
    logAction(author, 'Facture Vente', 'Ventes', `Facture de vente pro ${newInvoice.invoiceNumber} générée`);
  };

  const updateSalesInvoice = (id: string, updates: Partial<SalesInvoice>, author: string) => {
    const updated = salesInvoices.map(s => s.id === id ? { ...s, ...updates } : s);
    saveState('sales_invoices', updated, setSalesInvoices);
    logAction(author, 'Modification', 'Ventes', `Facture ${id} modifiée`);
  };

  const deleteSalesInvoice = (id: string, author: string) => {
    const updated = salesInvoices.filter(s => s.id !== id);
    saveState('sales_invoices', updated, setSalesInvoices);
    logAction(author, 'Suppression', 'Ventes', `Facture ${id} supprimée`);
  };

  const addDeliveryInvoice = (invoice: Omit<SalesInvoice, 'id'>, userId: string) => {
    const newInvoice = { ...invoice, id: 'bl_' + Date.now().toString() };
    setDeliveryInvoices([...deliveryInvoices, newInvoice]);
    
    
    // Auto-increment BL number
    if (config.documentNumbering) {
      setConfig({
        ...config,
        documentNumbering: {
          ...config.documentNumbering,
          bonLivraison: {
            ...config.documentNumbering.bonLivraison,
            nextNumber: config.documentNumbering.bonLivraison.nextNumber + 1
          }
        }
      });
    }
  };

  const updateDeliveryInvoice = (id: string, updates: Partial<SalesInvoice>, userId: string) => {
    setDeliveryInvoices(deliveryInvoices.map(i => i.id === id ? { ...i, ...updates } : i));
    
  };

  const deleteDeliveryInvoice = (id: string, userId: string) => {
    setDeliveryInvoices(deliveryInvoices.filter(i => i.id !== id));
    
  };

  return {
    loadInitialData,
    products,
    shopProducts,
    tanks,
    pumps,
    nozzles,
    attendants,
    shifts,
    sales,
    supplies,
    cashRegistry,
    stockCorrections,
    auditLogs,
    alerts,
    users,
    config,
    currentRole,
    priceChanges,
    suppliers,
    clients,
    purchaseInvoices,
    salesInvoices,
    
    // Actions
    switchRole,
    markAlertAsRead,
    clearAllAlerts,
    resetAllData,

    // Attendant CRUD
    addAttendant,
    updateAttendant,
    deleteAttendant,

    // Product CRUD
    addShopProduct,
    updateShopProduct,
    deleteShopProduct,
    addProduct,
    updateProduct,
    deleteProduct,

    // Tank Level Correction
    addTank,
    updateTank,
    deleteTank,
    correctTankLevel,
    deleteStockCorrection,

    // Pump & Nozzles CRUD
    addPump,
    updatePump,
    deletePump,
    reorderPumps,
    addNozzle,
    updateNozzle,
    deleteNozzle,

    // Deliveries (Supply)
    addSupply,
    deleteSupply,

    // Billing
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addClient,
    addClients,
    updateClient,
    deleteClient,
    addPurchaseInvoice,
    updatePurchaseInvoiceStatus,
    updatePurchaseInvoice,
    deletePurchaseInvoice,
    addSalesInvoice,
    updateSalesInvoice,
    deleteSalesInvoice,
    deliveryInvoices,
    addDeliveryInvoice,
    updateDeliveryInvoice,
    deleteDeliveryInvoice,

    // Cash session Management
    openCashRegistry,
    addCashMovement,
    closeCashRegistry,

    // Shifts management
    startShift,
    submitShiftCounters,
    finalizeShiftClosing,
    deleteShift: (id: string, author: string) => {
      const shift = shifts.find(s => s.id === id);
      if (!shift) return;

      // 1. Constraint: check if any newer shift uses the same pumps.
      let hasDependentShift = false;
      if (shift.status === 'completed' && shift.endCounters) {
        const nozzlesModified = Object.keys(shift.endCounters);
        for (const nozId of nozzlesModified) {
          const noz = nozzles.find(n => n.id === nozId);
          if (noz) {
            // Check if current counters have advanced beyond this shift's end counters
            if (parseFloat(noz.currentElecCounter as any) > parseFloat(shift.endCounters[nozId].elec as any) || parseFloat(noz.currentMechCounter as any) > parseFloat(shift.endCounters[nozId].mech as any)) {
              hasDependentShift = true;
              break;
            }
          }
        }
      } else if (shift.status !== 'completed' && shift.startCounters) {
         // Active shift check
         const newerCompletedShifts = shifts.filter(s => s.id !== id && s.status === 'completed' && new Date(s.startTime).getTime() > new Date(shift.startTime).getTime());
         if (newerCompletedShifts.some(s => s.pumpIds.some(pid => shift.pumpIds.includes(pid)))) {
           hasDependentShift = true;
         }
      }

      if (hasDependentShift) {
        window.alert("Impossible de supprimer ce shift car un shift plus récent dépend de ses données.");
        return;
      }

      // Rollback Transaction

      // 1. Rollback Nozzles
      let nextNozzles = [...nozzles];
      if (shift.startCounters && Object.keys(shift.startCounters).length > 0) {
        Object.entries(shift.startCounters).forEach(([nozzleId, startCount]) => {
          const nozIndex = nextNozzles.findIndex(n => n.id === nozzleId);
          if (nozIndex !== -1) {
            nextNozzles[nozIndex] = {
              ...nextNozzles[nozIndex],
              currentElecCounter: parseFloat((startCount as any).elec) || 0,
              currentMechCounter: parseFloat((startCount as any).mech) || 0
            };
          }
        });
        saveState('nozzles', nextNozzles, setNozzles);
      } else if (shift.endCounters && shift.litersSold) {
        // Fallback if startCounters is missing or empty
        Object.keys(shift.endCounters).forEach(nozId => {
          const nozIndex = nextNozzles.findIndex(n => n.id === nozId);
          if (nozIndex !== -1) {
            const qty = shift.litersSold[nozId] || 0;
            nextNozzles[nozIndex] = {
              ...nextNozzles[nozIndex],
              currentElecCounter: Math.max(0, parseFloat((nextNozzles[nozIndex].currentElecCounter as any)) - qty),
              currentMechCounter: Math.max(0, parseFloat((nextNozzles[nozIndex].currentMechCounter as any)) - qty)
            };
          }
        });
        saveState('nozzles', nextNozzles, setNozzles);
      }

      // 2. Rollback Tanks
      let nextTanks = [...tanks];
      const associatedSales = sales.filter(s => s.shiftId === id);
      associatedSales.forEach(sale => {
        if (sale.nozzleId) {
          const noz = nozzles.find(n => n.id === sale.nozzleId);
          if (noz) {
            const tankIndex = nextTanks.findIndex(t => t.id === noz.tankId);
            if (tankIndex !== -1) {
              nextTanks[tankIndex] = {
                ...nextTanks[tankIndex],
                currentLevel: parseFloat((nextTanks[tankIndex].currentLevel + sale.qty).toFixed(2))
              };
            }
          }
        }
      });
      saveState('tanks', nextTanks, setTanks);

      // 3. Rollback Shop Products
      let nextShopProducts = [...shopProducts];
      if (shift.productsSold && shift.productsSold.length > 0) {
        shift.productsSold.forEach(p => {
          if (p.shopProductId) {
             const spIndex = nextShopProducts.findIndex(sp => sp.id === p.shopProductId);
             if (spIndex !== -1) {
                nextShopProducts[spIndex] = {
                  ...nextShopProducts[spIndex],
                  stockQuantity: nextShopProducts[spIndex].stockQuantity + p.qty
                };
             }
          }
        });
        saveState('shop_products', nextShopProducts, setShopProducts);
      }

      // 4. Rollback Sales
      const nextSales = sales.filter(s => s.shiftId !== id);
      saveState('sales', nextSales, setSales);

      // 5. Rollback Cash Registry
      if (shift.status === 'completed' && cashRegistry.isOpen && shift.realCashReceived !== undefined) {
        const expectedLabel = `Clôture journalière (${shift.attendantName} - Shift ${shift.shiftName})`;
        const matchingInputIndex = cashRegistry.inputs.findIndex(i => i.label === expectedLabel && i.amount === shift.realCashReceived);
        
        if (matchingInputIndex !== -1) {
          const matchingInput = cashRegistry.inputs[matchingInputIndex];
          const nextInputs = [...cashRegistry.inputs];
          nextInputs.splice(matchingInputIndex, 1);
          
          saveState('cash_registry', {
            ...cashRegistry,
            inputs: nextInputs,
            theoreticalCash: cashRegistry.theoreticalCash - matchingInput.amount
          }, setCashRegistry);
        }
      }

      // 6. Delete Shift
      const nextShifts = shifts.filter(s => s.id !== id);
      saveState('shifts', nextShifts, setShifts);

      logAction(author, 'Suppression Shift', 'Shifts', `Suppression avec rollback du shift ${id} (Pompiste: ${shift.attendantName})`);
    },
    updateShift: (id: string, updatedFields: Partial<Shift>, author: string) => {
      const oldShift = shifts.find(s => s.id === id);
      if (!oldShift) return;

      const isCompleted = oldShift.status === 'completed' || oldShift.status === 'ready_to_close';

      // If the shift was completed, we need to rollback old tanks and apply new tanks
      let currentTanks = [...tanks];
      let tanksChanged = false;

      if (isCompleted && updatedFields.litersSold) {
        // Rollback old liters
        if (oldShift.litersSold) {
           Object.keys(oldShift.litersSold).forEach(nozId => {
             const qty = oldShift.litersSold[nozId];
             const noz = nozzles.find(n => n.id === nozId);
             if (noz && qty > 0) {
               const tankIndex = currentTanks.findIndex(t => t.id === noz.tankId);
               if (tankIndex !== -1) {
                 currentTanks[tankIndex] = { ...currentTanks[tankIndex], currentLevel: currentTanks[tankIndex].currentLevel + qty };
                 tanksChanged = true;
               }
             }
           });
        }
        
        // Apply new liters
        Object.keys(updatedFields.litersSold).forEach(nozId => {
             const qty = updatedFields.litersSold[nozId];
             const noz = nozzles.find(n => n.id === nozId);
             if (noz && qty > 0) {
               const tankIndex = currentTanks.findIndex(t => t.id === noz.tankId);
               if (tankIndex !== -1) {
                 currentTanks[tankIndex] = { ...currentTanks[tankIndex], currentLevel: Math.max(0, currentTanks[tankIndex].currentLevel - qty) };
                 tanksChanged = true;
               }
             }
        });
      }

      if (tanksChanged) {
        saveState('tanks', currentTanks, setTanks);
      }

      const updated = shifts.map(s => s.id === id ? { ...s, ...updatedFields } : s);
      saveState('shifts', updated, setShifts);
    },
    addCompletedShift,

    // Config updating
    updateConfig
  };
}

