import { supabase } from './lib/supabase';
import { useState, useEffect } from 'react';
import {
  Product, Tank, Pump, Nozzle, Attendant, Shift, Sale, Supply,
  CashRegistry, StockCorrection, AuditLog, Alert, User, StationConfig, UserRole,
  Supplier, Client, PurchaseInvoice, SalesInvoice, ShopProduct
} from './types';
export function useERPStore() {
  // Initialize Storage
  
  


  const [products, setProducts] = useState<Product[]>([]);
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [nozzles, setNozzles] = useState<Nozzle[]>([]);
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return (localStorage.getItem('station_erp_current_user_role') as UserRole) || 'admin';
  });

  // Sync state helpers
  
  const loadInitialData = (data: any) => {
    if (data.products) {
      const realProducts = data.products.filter((p: any) => !p.id.startsWith('sprod_'));
      setProducts(realProducts);

      const spProducts = data.products.filter((p: any) => p.id.startsWith('sprod_')).map((p: any) => {
        let name = p.name;
        let photo = '';
        if (name.includes('|__PHOTO:')) {
          const match = name.match(/\|__PHOTO:(.*?)__\|/);
          if (match) {
            photo = match[1];
            name = name.replace(match[0], '');
          }
        }
        return {
          id: p.id,
          name,
          photo,
          purchasePrice: p.purchasePrice,
          salePrice: p.salePrice,
          stockQuantity: p.vatRate,
          status: p.status
        };
      });

      const storedShopProducts = localStorage.getItem('erp_shop_products');
      let localProducts = [];
      if (storedShopProducts) {
        try {
          localProducts = JSON.parse(storedShopProducts);
        } catch(e) {}
      }

      const allSpProducts = [...spProducts];
      const toMigrate = [];
      for (const lp of localProducts) {
        if (!allSpProducts.find(p => p.id === lp.id)) {
          allSpProducts.push(lp);
          toMigrate.push(lp);
        }
      }
      setShopProducts(allSpProducts);
      
      // Fire-and-forget background migration to Supabase
      if (toMigrate.length > 0) {
        setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
             const mapShopToProduct = (sp: any) => ({
                id: sp.id,
                name: sp.photo ? `${sp.name}|__PHOTO:${sp.photo}__|` : sp.name,
                type: 'gazoil',
                purchasePrice: sp.purchasePrice,
                salePrice: sp.salePrice,
                vatRate: sp.stockQuantity,
                status: sp.status,
                user_id: session.user.id
             });
             const mappedToMigrate = toMigrate.map(mapShopToProduct);
             await supabase.from('erp_products').insert(mappedToMigrate);
             localStorage.removeItem('erp_shop_products');
          }
        }, 1000);
      }
    }
    if (data.tanks) setTanks(data.tanks);
    if (data.pumps) setPumps(data.pumps);
    if (data.nozzles) setNozzles(data.nozzles);
    if (data.attendants) {
      setAttendants(data.attendants.map(a => {
        if (a.notes && typeof a.notes === 'string' && a.notes.includes('|__PHOTO:')) {
          const match = a.notes.match(/\|__PHOTO:(.*?)__\|/);
          if (match) {
            a.photo = match[1];
            a.notes = a.notes.replace(match[0], '');
          }
        }
        return a;
      }));
    }
    if (data.shifts) {
      setShifts(data.shifts.map(s => {
        if (s.notes && typeof s.notes === 'string' && s.notes.includes('|__END_DATE:')) {
          const match = s.notes.match(/\|__END_DATE:(.*?)__\|/);
          if (match) {
            s.endDate = match[1];
            s.notes = s.notes.replace(match[0], '');
          }
        }
        return s;
      }));
    }
    if (data.sales) setSales(data.sales);
    if (data.supplies) setSupplies(data.supplies);
    if (data.cash_registry) setCashRegistry(data.cash_registry);
    if (data.stock_corrections) setStockCorrections(data.stock_corrections);
    if (data.audit_logs) setAuditLogs(data.audit_logs);
    if (data.alerts) setAlerts(data.alerts);
    if (data.users) setUsers(data.users);
    if (data.config) setConfig(data.config);
    if (data.suppliers) setSuppliers(data.suppliers);
    if (data.clients) setClients(data.clients);
    if (data.purchase_invoices) setPurchaseInvoices(data.purchase_invoices);
    if (data.sales_invoices) setSalesInvoices(data.sales_invoices);
  };

  
  const syncArrayToSupabase = async (table: string, oldArray: any[], newArray: any[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const oldMap = new Map(oldArray.map(item => [item.id, item]));
    const newMap = new Map(newArray.map(item => [item.id, item]));

    const added = newArray.filter(item => !oldMap.has(item.id)).map(i => ({...i, user_id: session.user.id}));
    const deleted = oldArray.filter(item => !newMap.has(item.id));
    const updated = newArray.filter(item => {
      const old = oldMap.get(item.id);
      return old && JSON.stringify(old) !== JSON.stringify(item);
    }).map(i => ({...i, user_id: session.user.id}));

    const cleanItem = (item) => {
      if (table === 'erp_attendants') {
        const { photo, ...rest } = item;
        if (photo) {
          rest.notes = (rest.notes || '') + `|__PHOTO:${photo}__|`;
        }
        return rest;
      }
      if (table === 'erp_shifts') {
        const { endDate, ...rest } = item;
        if (endDate) {
          rest.notes = (rest.notes || '') + `|__END_DATE:${endDate}__|`;
        }
        return rest;
      }
      return item;
    };

    const addedClean = added.map(cleanItem);
    const updatedClean = updated.map(cleanItem);

    try {
      if (added.length > 0) {
        const { error } = await supabase.from(table).insert(addedClean);
        if (error) throw error;
      }
      if (updated.length > 0) {
        for (const item of updatedClean) {
          const { error } = await supabase.from(table).update(item).eq('id', item.id).eq('user_id', session.user.id);
          if (error) throw error;
        }
      }
      if (deleted.length > 0) {
        const ids = deleted.map(i => i.id);
        const { error } = await supabase.from(table).delete().in('id', ids).eq('user_id', session.user.id);
        if (error) throw error;
      }
      return true;
    } catch (error: any) {
      console.error(`Erreur de synchronisation ${table}:`, error);
      alert(`Erreur réseau: Impossible de sauvegarder dans ${table}. Vérifiez votre connexion.`);
      return false;
    }
  };

  const saveState = async (key: string, newValue: any, setter: Function) => {
    let oldValue: any = null;
    switch(key) {
      case 'products': oldValue = products; break;
      case 'shop_products': oldValue = shopProducts; break;
      case 'tanks': oldValue = tanks; break;
      case 'pumps': oldValue = pumps; break;
      case 'nozzles': oldValue = nozzles; break;
      case 'attendants': oldValue = attendants; break;
      case 'shifts': oldValue = shifts; break;
      case 'sales': oldValue = sales; break;
      case 'supplies': oldValue = supplies; break;
      case 'cash_registry': oldValue = cashRegistry; break;
      case 'stock_corrections': oldValue = stockCorrections; break;
      case 'audit_logs': oldValue = auditLogs; break;
      case 'alerts': oldValue = alerts; break;
      case 'users': oldValue = users; break;
      case 'config': oldValue = config; break;
      case 'suppliers': oldValue = suppliers; break;
      case 'clients': oldValue = clients; break;
      case 'purchase_invoices': oldValue = purchaseInvoices; break;
      case 'sales_invoices': oldValue = salesInvoices; break;
    }

    setter(newValue);

    const isArray = Array.isArray(newValue);
    if (isArray) {
      if (key === 'shop_products') {
        const mapShopToProduct = (sp: any) => ({
          id: sp.id,
          name: sp.photo ? `${sp.name}|__PHOTO:${sp.photo}__|` : sp.name,
          type: 'gazoil',
          purchasePrice: sp.purchasePrice,
          salePrice: sp.salePrice,
          vatRate: sp.stockQuantity,
          status: sp.status
        });
        const mappedShopProducts = newValue.map(mapShopToProduct);
        const mappedOldValue = (oldValue || []).map(mapShopToProduct);
        await syncArrayToSupabase('erp_products', mappedOldValue, mappedShopProducts);
      } else {
        await syncArrayToSupabase(`erp_${key}`, oldValue || [], newValue);
      }
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase.from(`erp_${key}`).upsert({ ...newValue, id: newValue.id || 'default', user_id: session.user.id }, { onConflict: 'id' });
        if (error) {
          console.error(`Erreur de sauvegarde ${key}:`, error);
          alert(`Erreur de sauvegarde pour ${key}`);
        }
      }
    }
  };


    

  const logAction = (user: string, action: string, module: string, details: string) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      date: dateStr,
      time: timeStr,
      user,
      action,
      module,
      details
    };
    const updated = [newLog, ...auditLogs];
    saveState('audit_logs', updated, setAuditLogs);
  };

  const triggerAlert = (severity: 'info' | 'warning' | 'danger', message: string, type: Alert['type']) => {
    const now = new Date();
    const newAlert: Alert = {
      id: `alert_${Date.now()}`,
      date: now.toISOString(),
      severity,
      message,
      isRead: false,
      type
    };
    const updated = [newAlert, ...alerts];
    saveState('alerts', updated, setAlerts);
  };

  const markAlertAsRead = (alertId: string) => {
    const updated = alerts.map(a => a.id === alertId ? { ...a, isRead: true } : a);
    saveState('alerts', updated, setAlerts);
  };

  const clearAllAlerts = () => {
    saveState('alerts', [], setAlerts);
  };

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem('station_erp_current_user_role', role);
  };

  // MODULE 2: ATTENDANTS
  const addAttendant = (att: Omit<Attendant, 'id'>, author: string) => {
    const newAtt: Attendant = {
      ...att,
      id: `att_${Date.now()}`
    };
    const updated = [...attendants, newAtt];
    saveState('attendants', updated, setAttendants);
    logAction(author, 'Création Pompiste', 'Pompistes', `Création du pompiste ${newAtt.firstName} ${newAtt.lastName} (Matricule: ${newAtt.matricule})`);
  };

  const updateAttendant = (id: string, updatedFields: Partial<Attendant>, author: string) => {
    const updated = attendants.map(a => a.id === id ? { ...a, ...updatedFields } : a);
    saveState('attendants', updated, setAttendants);
    const original = attendants.find(a => a.id === id);
    logAction(author, 'Modification Pompiste', 'Pompistes', `Modification de ${original?.firstName} ${original?.lastName}`);
  };

  const deleteAttendant = (id: string, author: string) => {
    const original = attendants.find(a => a.id === id);
    const updated = attendants.filter(a => a.id !== id);
    saveState('attendants', updated, setAttendants);
    logAction(author, 'Suppression Pompiste', 'Pompistes', `Suppression du pompiste ${original?.firstName} ${original?.lastName}`);
  };

  // MODULE 4: PRODUCTS
  
  const addShopProduct = (product: Omit<ShopProduct, 'id'>, author: string) => {
    const newProduct = { ...product, id: `sprod_${Date.now()}` };
    const updated = [...shopProducts, newProduct];
    saveState('shop_products', updated, setShopProducts);
    logAction(author, 'Création Produit Boutique', 'Boutique', `Création du produit boutique ${newProduct.name}`);
  };

  const updateShopProduct = (id: string, updatedFields: Partial<ShopProduct>, author: string) => {
    const updated = shopProducts.map(p => p.id === id ? { ...p, ...updatedFields } : p);
    saveState('shop_products', updated, setShopProducts);
    logAction(author, 'Modification Produit Boutique', 'Boutique', `Mise à jour du produit boutique ${id}`);
  };

  const deleteShopProduct = (id: string, author: string) => {
    const updated = shopProducts.filter(p => p.id !== id);
    saveState('shop_products', updated, setShopProducts);
    logAction(author, 'Suppression Produit Boutique', 'Boutique', `Produit boutique ${id} supprimé`);
  };

  const addProduct = (prod: Omit<Product, 'id'>, author: string) => {
    const newProd: Product = { ...prod, id: `prod_${Date.now()}` };
    const updated = [...products, newProd];
    saveState('products', updated, setProducts);
    logAction(author, 'Création Produit', 'Produits', `Carburant ajouté : ${newProd.name} (${newProd.salePrice} MAD/L)`);
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>, author: string) => {
    const updated = products.map(p => p.id === id ? { ...p, ...updatedFields } : p);
    saveState('products', updated, setProducts);
    const original = products.find(p => p.id === id);
    logAction(author, 'Modification Produit', 'Produits', `Prix de ${original?.name} mis à jour`);
  };

  // MODULE 5: TANKS (CUVES)
  const addTank = (tank: Omit<Tank, 'id'>, author: string) => {
    const newTank: Tank = { ...tank, id: `tank_${Date.now()}` };
    const updated = [...tanks, newTank];
    saveState('tanks', updated, setTanks);
    logAction(author, 'Création Cuve', 'Cuves', `Ajout de la cuve ${newTank.number} (Capacité: ${newTank.capacity}L)`);
  };

  const updateTank = (id: string, updatedFields: Partial<Tank>, author: string) => {
    const updated = tanks.map(t => {
      if (t.id === id) {
        const nextTank = { ...t, ...updatedFields };
        // Low Stock Alarm trigger checking
        if (nextTank.currentLevel <= nextTank.minLevel) {
          triggerAlert('warning', `Le niveau de la ${nextTank.number} est faible : ${nextTank.currentLevel} L restants.`, 'low_stock');
        }
        return nextTank;
      }
      return t;
    });
    saveState('tanks', updated, setTanks);
    const original = tanks.find(t => t.id === id);
    logAction(author, 'Modification Cuve', 'Cuves', `Cuve ${original?.number} modifiée.`);
  };

  // Manual Level Correction
  const deleteTank = (id: string, author: string) => {
    const updated = tanks.filter(t => t.id !== id);
    saveState('tanks', updated, setTanks);
    logAction(author, 'Suppression Cuve', 'Cuves', `Cuve ${id} supprimée`);
  };

  const correctTankLevel = (tankId: string, newLevel: number, reason: string, date: string, author: string) => {
    const original = tanks.find(t => t.id === tankId);
    if (!original) return;

    const correction: StockCorrection = {
      id: `corr_${Date.now()}`,
      date: date || new Date().toISOString().split('T')[0],
      tankId,
      tankNumber: original.number,
      productId: original.productId,
      qtyBefore: original.currentLevel,
      qtyAfter: newLevel,
      reason,
      user: author
    };

    const updatedCorrections = [correction, ...stockCorrections];
    saveState('stock_corrections', updatedCorrections, setStockCorrections);
    
    logAction(author, 'Jaugeage Manuel', 'Stock', `Jaugeage manuel de ${original.number} : Théorique ${original.currentLevel} L, Réel jaugé ${newLevel} L. Note : ${reason}`);
  };

  const deleteStockCorrection = (id: string, author: string) => {
    const updated = stockCorrections.filter(c => c.id !== id);
    saveState('stock_corrections', updated, setStockCorrections);
    logAction(author, 'Suppression Correction', 'Stock', `Suppression d'une correction manuelle de stock ${id}`);
  };

  // MODULE 6: PUMPS
  const addPump = (pump: Omit<Pump, 'id'>, author: string) => {
    const newPump: Pump = { ...pump, id: `pump_${Date.now()}` };
    const updated = [...pumps, newPump];
    saveState('pumps', updated, setPumps);
    logAction(author, 'Ajout Pompe', 'Pompes', `Ajout du distributeur ${newPump.number} (${newPump.manufacturer})`);
  };

  const updatePump = (id: string, updatedFields: Partial<Pump>, author: string) => {
    const updated = pumps.map(p => {
      const nextPump = p.id === id ? { ...p, ...updatedFields } : p;
      if (nextPump.status === 'offline' && p.status !== 'offline') {
        triggerAlert('danger', `La ${nextPump.number} a été déclarée HORS LIGNE (Panne ou communication perdue IoT).`, 'pump_offline');
      }
      return nextPump;
    });
    saveState('pumps', updated, setPumps);
    const original = pumps.find(p => p.id === id);
    logAction(author, 'Modification Pompe', 'Pompes', `Statut de ${original?.number} modifié à ${updatedFields.status}`);
  };

  const deletePump = (id: string, author: string) => {
    const original = pumps.find(p => p.id === id);
    const updated = pumps.filter(p => p.id !== id);
    saveState('pumps', updated, setPumps);
    logAction(author, 'Suppression Pompe', 'Pompes', `Pompe ${original?.number} supprimée`);
  };

  // MODULE 7: NOZZLES (PISTOLETS)
  const addNozzle = (noz: Omit<Nozzle, 'id'>, author: string) => {
    const newNoz: Nozzle = { ...noz, id: `noz_${Date.now()}` };
    const updated = [...nozzles, newNoz];
    saveState('nozzles', updated, setNozzles);
    logAction(author, 'Ajout Pistolet', 'Pistolets', `Pistolet ${newNoz.name} lié à la ${newNoz.pumpNumber}`);
  };

  const updateNozzle = (id: string, updatedFields: Partial<Nozzle>, author: string) => {
    const updated = nozzles.map(n => {
      const nextNoz = n.id === id ? { ...n, ...updatedFields } : n;
      if (nextNoz.status === 'defective' && n.status !== 'defective') {
        triggerAlert('danger', `Le ${nextNoz.name} de la ${nextNoz.pumpNumber} est défectueux !`, 'nozzle_defective');
      }
      return nextNoz;
    });
    saveState('nozzles', updated, setNozzles);
    const original = nozzles.find(n => n.id === id);
    logAction(author, 'Modification Pistolet', 'Pistolets', `Pistolet ${original?.name} modifié.`);
  };

  const deleteNozzle = (id: string, author: string) => {
    const original = nozzles.find(n => n.id === id);
    const updated = nozzles.filter(n => n.id !== id);
    saveState('nozzles', updated, setNozzles);
    logAction(author, 'Suppression Pistolet', 'Pistolets', `Pistolet ${original?.name} supprimé`);
  };

  // MODULE 9: FUEL SUPPLIES (LIVRAISONS)
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
        const diffLiters = endCount.elec - startCount.elec;
        const roundedDiff = Math.max(0, parseFloat(diffLiters.toFixed(2)));
        
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
      id: `shift_${Date.now()}`,
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
          const diffLiters = endCount.elec - startCount.elec;
          const roundedDiff = Math.max(0, parseFloat(diffLiters.toFixed(2)));
          
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
            currentMechCounter: endCount.mech,
            currentElecCounter: endCount.elec
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
         updatedShopProducts = updatedShopProducts.map(sp => 
            sp.id === p.shopProductId ? { ...sp, stockQuantity: Math.max(0, sp.stockQuantity - p.qty) } : sp
         );
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

    saveState('shifts', [newShift, ...shifts], setShifts);

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
    
    // Automatically add stock and create a supply record when validated/added
    const tank = tanks.find(t => t.id === invoice.tankId);
    if (tank) {
      const updatedTanks = tanks.map(t => 
        t.id === tank.id ? { ...t, currentLevel: t.currentLevel + invoice.quantity } : t
      );
      saveState('tanks', updatedTanks, setTanks);
      
      const supplier = suppliers.find(s => s.id === invoice.supplierId);
      
      const newSupply: Supply = {
        id: `sup_${Date.now()}`,
        supplier: supplier?.name || invoice.supplierId,
        productId: invoice.productId,
        productName: products.find(p => p.id === invoice.productId)?.name || 'Inconnu',
        tankId: tank.id,
        tankNumber: tank.number,
        qtyDelivered: invoice.quantity,
        purchasePrice: invoice.pricePerLiter,
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date
      };
      saveState('supplies', [newSupply, ...supplies], setSupplies);
    }
    logAction(author, 'Facture Achat', 'Achats', `Facture d'achat ${newInvoice.invoiceNumber} enregistrée`);
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
    addNozzle,
    updateNozzle,
    deleteNozzle,

    // Deliveries (Supply)
    addSupply,

    // Billing
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addClient,
    updateClient,
    deleteClient,
    addPurchaseInvoice,
    updatePurchaseInvoiceStatus,
    updatePurchaseInvoice,
    deletePurchaseInvoice,
    addSalesInvoice,
    updateSalesInvoice,
    deleteSalesInvoice,

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
      const updated = shifts.map(s => s.id === id ? { ...s, ...updatedFields } : s);
      saveState('shifts', updated, setShifts);
      //
    },
    addCompletedShift,

    // Config updating
    updateConfig
  };
}
export type ERPStoreType = ReturnType<typeof useERPStore>;
