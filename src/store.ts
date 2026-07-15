import { supabase } from './lib/supabase';
import React, { useState
, useEffect } from 'react';
import { 
  Supplier, Client, PurchaseInvoice, SalesInvoice, ShopProduct, 
  AuditLog, CashRegistry, Shift, Alert, Supply, Tank, Product, Attendant,
  StationConfig, UserRole, User, StockCorrection, Pump, Nozzle, Sale
} from './types';
import { RichDocument } from './components/BillingTypes';
import { 
  INITIAL_PRODUCTS, INITIAL_TANKS, INITIAL_PUMPS, INITIAL_NOZZLES, 
  INITIAL_ATTENDANTS, INITIAL_SHIFTS, INITIAL_SALES, INITIAL_SUPPLIES, 
  INITIAL_CASH_REGISTRY, INITIAL_CONFIG, INITIAL_SUPPLIERS, INITIAL_CLIENTS 
} from './data';

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
  suppliers: Supplier[];
  clients: Client[];
  purchaseInvoices: PurchaseInvoice[];
  salesInvoices: SalesInvoice[];
  deliveryInvoices: SalesInvoice[];
  richDocuments: RichDocument[];
  setRichDocuments: (data: RichDocument[]) => void;

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
  updateProductsBulk?: (updates: { id: string; updates: Partial<Product> }[], author: string) => void;
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
  updateSupply: (id: string, updates: Partial<Supply>, author: string) => void;
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

const syncQueues: { [key: string]: Promise<any> } = {};

export function useERPStore(): ERPStoreType {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [deliveryInvoices, setDeliveryInvoices] = useState<SalesInvoice[]>([]);
  const [richDocuments, setRichDocuments] = useState<RichDocument[]>([]);

  const saveState = (key: string, data: any, setter: React.Dispatch<React.SetStateAction<any>>) => {
    setter(data);
    
    // Ensure there is a promise chain for this key
    if (!syncQueues[key]) {
      syncQueues[key] = Promise.resolve();
    }
    
    // Append the sync task to the queue
    syncQueues[key] = syncQueues[key].then(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
           const user_id = session.user.id;
             
             
             
             if (key === 'config') {
                  const stringifiedConfig = JSON.stringify({
                      documentLogo: data.documentLogo || '',
                      documentColor: data.documentColor || '',
                      documentFooter: data.documentFooter || '',
                      documentNumbering: data.documentNumbering || null,
                      documentColumnsOrder: data.documentColumnsOrder || null,
                      documentCompanyDetails: data.documentCompanyDetails || '',
                      documentSettings: data.documentSettings || null
                  });
                  const configToSave = {
                      id: user_id,
                      user_id,
                      name: data.name,
                      logo: data.logo,
                      address: data.address,
                      phone: data.phone,
                      taxid: data.taxId,
                      autobackup: data.autoBackup,
                      language: data.language,
                      theme: data.theme,
                      printerip: stringifiedConfig,
                      iotconfigured: data.iotConfigured
                  };
                  const { error: insertErr } = await supabase.from('erp_config').upsert(configToSave);
                  if (insertErr) {
                      console.warn("Full upsert failed, trying simpler payload:", insertErr);
                      const simplerConfig = {
                          id: user_id,
                          user_id,
                          name: configToSave.name,
                          logo: configToSave.logo,
                          address: configToSave.address,
                          phone: configToSave.phone,
                          taxid: configToSave.taxid,
                          printerip: stringifiedConfig
                      };
                      await supabase.from('erp_config').upsert(simplerConfig);
                  }
                  return;
              }

             if (key === 'cash_registry') {
                  const cashData = {
                      user_id,
                      id: user_id,
                      isopen: data.isOpen,
                      openedat: data.openedAt,
                      openedby: data.openedBy,
                      openingcash: data.openingCash,
                      closedat: data.closedAt,
                      closedby: data.closedBy,
                      realcash: data.realCash,
                      discrepancy: data.discrepancy,
                      inputs: JSON.stringify(data.inputs || []),
                      outputs: JSON.stringify(data.outputs || []),
                      theoreticalcash: data.theoreticalCash
                  };
                  await supabase.from('erp_cash_registry').delete().eq('user_id', user_id);
                  const { error } = await supabase.from('erp_cash_registry').insert(cashData);
                  if (error) {
                      console.warn("Failed to upsert cash_registry:", error);
                  }
                  return;
             }

             if (Array.isArray(data)) {
                 let items = data.map(item => ({ ...item, user_id }));
                 
                 // Strip fields that might not be in Supabase schema
                 if (key === 'products') {
                     items = items.map(p => {
                         return {
                             id: p.id,
                             user_id,
                             name: p.name,
                             type: p.type,
                             purchase_price: p.purchasePrice !== undefined ? p.purchasePrice : 0.00,
                             sale_price: p.salePrice !== undefined ? p.salePrice : 0.00,
                             vat_rate: p.vatRate !== undefined ? p.vatRate : 20.00,
                             status: p.status || 'active'
                         };
                     });
                 }
                 if (key === 'rich_documents') {
                     items = items.map(doc => {
                         return {
                             id: doc.id,
                             user_id,
                             doctype: doc.docType,
                             document_number: doc.documentNumber,
                             partner_id: doc.partnerId,
                             partner_name: doc.partnerName,
                             date: doc.date,
                             due_date: doc.dueDate,
                             items: JSON.stringify(doc.items || []),
                             amount_ht: doc.amountHT,
                             vat_amount: doc.vatAmount,
                             amount_ttc: doc.amountTTC,
                             payment_method: doc.paymentMethod,
                             mixed_payments: JSON.stringify(doc.mixedPayments || []),
                             notes: doc.notes,
                             terms: doc.terms,
                             status: doc.status,
                             history_logs: JSON.stringify(doc.historyLogs || [])
                         };
                     });
                 }
                 // Smart sync: Upsert existing/new, delete removed
                 let currentItems = [];
                 let from = 0;
                 const step = 1000;
                 let hasMore = true;
                 while(hasMore) {
                   const { data: selectData, error: selectErr } = await supabase.from(`erp_${key}`).select('id').eq('user_id', user_id).order('id').range(from, from + step - 1);
                   if (selectErr) {
                       console.warn(`Skipping smart sync for erp_${key} (table missing or error): `, selectErr);
                       return;
                   }
                   if (!selectData || selectData.length === 0) {
                     hasMore = false;
                   } else {
                     currentItems = [...currentItems, ...selectData];
                     if (selectData.length < step) hasMore = false;
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
                         const { error: upsertErr } = await supabase.from(`erp_${key}`).upsert(items.slice(i, i + chunkSize));
                         if (upsertErr) {
                             console.error(`Error upserting to erp_${key}:`, upsertErr);
                         }
                     }
                 }
             } else if (typeof data === 'object' && data !== null) {
                 // For config and cash_registry (except config, which is handled above)
                 await supabase.from(`erp_${key}`).delete().eq('user_id', user_id);
                 await supabase.from(`erp_${key}`).insert({ ...data, user_id });
             }
          }
       } catch(err) {
         console.error('Supabase sync error', err);
       }
    });
  };




   const loadInitialData = (externalData?: any) => {
    try {
      let data = externalData;

      if (data) {
        if ((!data.pumps || data.pumps.length === 0) && (!data.tanks || data.tanks.length === 0)) {
          localStorage.setItem('erp_prices_aligned_v22', 'true');
          console.log("Seeding initial template data to database...");
          
          setProducts(INITIAL_PRODUCTS);
          setTanks(INITIAL_TANKS);
          setPumps(INITIAL_PUMPS);
          setNozzles(INITIAL_NOZZLES);
          setAttendants(INITIAL_ATTENDANTS);
          setSuppliers(INITIAL_SUPPLIERS);
          setClients(INITIAL_CLIENTS);
          setShifts(INITIAL_SHIFTS);
          setSales(INITIAL_SALES);
          setSupplies(INITIAL_SUPPLIES);
          setCashRegistry(INITIAL_CASH_REGISTRY);
          setConfig(INITIAL_CONFIG);

          saveState('products', INITIAL_PRODUCTS, setProducts);
          saveState('tanks', INITIAL_TANKS, setTanks);
          saveState('pumps', INITIAL_PUMPS, setPumps);
          saveState('nozzles', INITIAL_NOZZLES, setNozzles);
          saveState('attendants', INITIAL_ATTENDANTS, setAttendants);
          saveState('suppliers', INITIAL_SUPPLIERS, setSuppliers);
          saveState('clients', INITIAL_CLIENTS, setClients);
          saveState('shifts', INITIAL_SHIFTS, setShifts);
          saveState('sales', INITIAL_SALES, setSales);
          saveState('supplies', INITIAL_SUPPLIES, setSupplies);
          saveState('cash_registry', INITIAL_CASH_REGISTRY, setCashRegistry);
          saveState('config', INITIAL_CONFIG, setConfig);
          return;
        }


        let loadedProducts = data.products || [];
        loadedProducts = loadedProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          purchasePrice: p.purchase_price !== undefined ? Number(p.purchase_price) : (p.purchasePrice !== undefined ? Number(p.purchasePrice) : 0),
          salePrice: p.sale_price !== undefined ? Number(p.sale_price) : (p.salePrice !== undefined ? Number(p.salePrice) : 0),
          vatRate: p.vat_rate !== undefined ? Number(p.vat_rate) : (p.vatRate !== undefined ? Number(p.vatRate) : 20),
          status: p.status || 'active'
        }));
        setProducts(loadedProducts.length > 0 ? loadedProducts : INITIAL_PRODUCTS);
        setShopProducts(data.shop_products || []);
        setTanks(data.tanks || []);
        setPumps(data.pumps || []);
        setNozzles(data.nozzles || []);
        setAttendants(data.attendants || []);
        let loadedShifts = data.shifts || [];
        loadedShifts = loadedShifts.map((s: any) => {
            const parseJson = (val: any) => {
                if (typeof val === 'string') {
                    try { return JSON.parse(val); } catch (e) { return undefined; }
                }
                return val;
            };
            return {
                ...s,
                nonCashPayments: parseJson(s.noncashpayments !== undefined ? s.noncashpayments : s.nonCashPayments),
                productsSold: parseJson(s.productssold !== undefined ? s.productssold : s.productsSold),
                servicesSold: parseJson(s.servicessold !== undefined ? s.servicessold : s.servicesSold),
                expenses: parseJson(s.expenses),
                startCounters: parseJson(s.startcounters !== undefined ? s.startcounters : s.startCounters),
                endCounters: parseJson(s.endcounters !== undefined ? s.endcounters : s.endCounters),
                litersSold: parseJson(s.literssold !== undefined ? s.literssold : s.litersSold),
                amountSold: parseJson(s.amountsold !== undefined ? s.amountsold : s.amountSold),
                totalLiters: s.totalliters !== undefined && s.totalliters !== null ? s.totalliters : s.totalLiters,
                totalAmount: s.totalamount !== undefined && s.totalamount !== null ? s.totalamount : s.totalAmount,
                theoreticalCash: s.theoreticalcash !== undefined && s.theoreticalcash !== null ? s.theoreticalcash : s.theoreticalCash,
                realCashReceived: s.realcashreceived !== undefined && s.realcashreceived !== null ? s.realcashreceived : s.realCashReceived,
            };
        });
        setShifts(loadedShifts);
        setSales(data.sales || []);
        setSupplies(data.supplies || []);
        let loadedCashRegistry = data.cash_registry;
        if (loadedCashRegistry) {
            loadedCashRegistry = {
                ...loadedCashRegistry,
                isOpen: loadedCashRegistry.isopen !== undefined ? loadedCashRegistry.isopen : loadedCashRegistry.isOpen,
                openedAt: loadedCashRegistry.openedat !== undefined ? loadedCashRegistry.openedat : loadedCashRegistry.openedAt,
                openedBy: loadedCashRegistry.openedby !== undefined ? loadedCashRegistry.openedby : loadedCashRegistry.openedBy,
                openingCash: loadedCashRegistry.openingcash !== undefined ? loadedCashRegistry.openingcash : loadedCashRegistry.openingCash,
                closedAt: loadedCashRegistry.closedat !== undefined ? loadedCashRegistry.closedat : loadedCashRegistry.closedAt,
                closedBy: loadedCashRegistry.closedby !== undefined ? loadedCashRegistry.closedby : loadedCashRegistry.closedBy,
                realCash: loadedCashRegistry.realcash !== undefined ? loadedCashRegistry.realcash : loadedCashRegistry.realCash,
                theoreticalCash: loadedCashRegistry.theoreticalcash !== undefined ? loadedCashRegistry.theoreticalcash : loadedCashRegistry.theoreticalCash,
            };
            if (typeof loadedCashRegistry.inputs === 'string') {
                try { loadedCashRegistry.inputs = JSON.parse(loadedCashRegistry.inputs); } catch(e) { loadedCashRegistry.inputs = []; }
            }
            if (typeof loadedCashRegistry.outputs === 'string') {
                try { loadedCashRegistry.outputs = JSON.parse(loadedCashRegistry.outputs); } catch(e) { loadedCashRegistry.outputs = []; }
            }
        }
        
        setCashRegistry(loadedCashRegistry || {
          id: 'cash_session_current', isOpen: false, openedAt: '', openedBy: '', openingCash: 0, inputs: [], outputs: [], theoreticalCash: 0
        });
        setStockCorrections(data.stock_corrections || []);
        setAuditLogs(data.audit_logs || []);
        setAlerts(data.alerts || []);
        setUsers(data.users || []);
        if (data.config) {
          let loadedConfig = { ...data.config };
          // Map lowercase columns from Supabase back to camelCase keys used in the store
          if (loadedConfig.printerip !== undefined && loadedConfig.printerIp === undefined) {
            loadedConfig.printerIp = loadedConfig.printerip;
          }
          if (loadedConfig.taxid !== undefined && loadedConfig.taxId === undefined) {
            loadedConfig.taxId = loadedConfig.taxid;
          }
          if (loadedConfig.autobackup !== undefined && loadedConfig.autoBackup === undefined) {
            loadedConfig.autoBackup = loadedConfig.autobackup;
          }
          if (loadedConfig.iotconfigured !== undefined && loadedConfig.iotConfigured === undefined) {
            loadedConfig.iotConfigured = loadedConfig.iotconfigured;
          }

          // Sanitize old default Atlas/Station ERP values
          if (loadedConfig.name === 'ATLAS PETROLEUM SARL') loadedConfig.name = '';
          if (loadedConfig.address && (loadedConfig.address === 'Zone Industrielle Sidi Maârouf, N° 14, Casablanca, Maroc' || loadedConfig.address.includes('Sidi Maârouf'))) loadedConfig.address = '';
          if (loadedConfig.phone === '+212 522 45 67 89') loadedConfig.phone = '';
          if (loadedConfig.taxId === '001548796000085') loadedConfig.taxId = '';
          if (loadedConfig.logo === '⛽') loadedConfig.logo = '';
          if (loadedConfig.documentLogo === '⛽') loadedConfig.documentLogo = '';
          if (loadedConfig.documentFooter && loadedConfig.documentFooter.includes('ATLAS PETROLEUM')) loadedConfig.documentFooter = '';

          if (loadedConfig.printerIp) {
            const trimmed = loadedConfig.printerIp.trim();
            if (trimmed.startsWith('{')) {
              try {
                const sanitize = (obj: any): any => {
                  if (obj === null) return undefined;
                  if (Array.isArray(obj)) return obj.map(sanitize);
                  if (typeof obj === 'object' && obj !== null) {
                    const newObj: any = {};
                    for (const key in obj) {
                      newObj[key] = sanitize(obj[key]);
                    }
                    return newObj;
                  }
                  return obj;
                };
                const parsed = sanitize(JSON.parse(trimmed));
                
                // Hydrate extra document settings back into loadedConfig
                if (parsed.documentLogo) {
                  loadedConfig.documentLogo = parsed.documentLogo;
                }
                if (parsed.documentColor) loadedConfig.documentColor = parsed.documentColor;
                if (parsed.documentFooter) loadedConfig.documentFooter = parsed.documentFooter;
                if (parsed.documentNumbering) loadedConfig.documentNumbering = parsed.documentNumbering;
                if (parsed.documentColumnsOrder) loadedConfig.documentColumnsOrder = parsed.documentColumnsOrder;
                if (parsed.documentCompanyDetails) loadedConfig.documentCompanyDetails = parsed.documentCompanyDetails;
                if (parsed.documentSettings) {
                  loadedConfig.documentSettings = parsed.documentSettings;
                }
              } catch (e) {
                console.error("Failed to parse complex printerIp JSON", e);
              }
            }
            loadedConfig = { ...loadedConfig, printerIp: '' };
          }

          // Re-sanitize after hydrating extra settings
          if (loadedConfig.documentLogo === '⛽') loadedConfig.documentLogo = '';
          if (loadedConfig.documentFooter && loadedConfig.documentFooter.includes('ATLAS PETROLEUM')) loadedConfig.documentFooter = '';
          if (loadedConfig.documentCompanyDetails && (loadedConfig.documentCompanyDetails.includes('ATLAS PETROLEUM') || loadedConfig.documentCompanyDetails.includes('001548796000085'))) {
            loadedConfig.documentCompanyDetails = '';
          }

          setConfig(loadedConfig);
        } else {
          setConfig({
            name: 'Station ERP', logo: '⛽', address: '', phone: '', taxId: '', autoBackup: true, language: 'fr', theme: 'light', printerIp: '', iotConfigured: false
          });
        }
        
        setSuppliers(data.suppliers || []);
        setClients(data.clients || []);
        setPurchaseInvoices(data.purchase_invoices || []);
        setSalesInvoices(data.sales_invoices || []);
        setDeliveryInvoices(data.delivery_invoices || []);

        // Load rich documents
        let loadedRichDocs: RichDocument[] = [];
        if (data.rich_documents) {
            loadedRichDocs = data.rich_documents.map((d: any) => {
                let itemsParsed = d.items;
                if (typeof itemsParsed === 'string') {
                    try { itemsParsed = JSON.parse(itemsParsed); } catch(e) { itemsParsed = []; }
                }
                let mixedParsed = d.mixed_payments;
                if (typeof mixedParsed === 'string') {
                    try { mixedParsed = JSON.parse(mixedParsed); } catch(e) { mixedParsed = []; }
                }
                let logsParsed = d.history_logs;
                if (typeof logsParsed === 'string') {
                    try { logsParsed = JSON.parse(logsParsed); } catch(e) { logsParsed = []; }
                }
                
                return {
                    id: d.id,
                    docType: d.doctype || d.docType,
                    documentNumber: d.document_number || d.documentNumber,
                    partnerId: d.partner_id || d.partnerId,
                    partnerName: d.partner_name || d.partnerName,
                    date: d.date,
                    dueDate: d.due_date || d.dueDate,
                    items: itemsParsed || [],
                    amountHT: d.amount_ht !== undefined ? Number(d.amount_ht) : (d.amountHT !== undefined ? Number(d.amountHT) : 0),
                    vatAmount: d.vat_amount !== undefined ? Number(d.vat_amount) : (d.vatAmount !== undefined ? Number(d.vatAmount) : 0),
                    amountTTC: d.amount_ttc !== undefined ? Number(d.amount_ttc) : (d.amountTTC !== undefined ? Number(d.amountTTC) : 0),
                    paymentMethod: d.payment_method || d.paymentMethod,
                    mixedPayments: mixedParsed || [],
                    notes: d.notes || '',
                    terms: d.terms || '',
                    status: d.status || 'draft',
                    historyLogs: logsParsed || []
                };
            });
        } else {
            // Local fallback/migration
            const oldLocalDocs = localStorage.getItem('erp_rich_documents_v1');
            if (oldLocalDocs) {
                try {
                    loadedRichDocs = JSON.parse(oldLocalDocs);
                } catch(e) {
                    console.error("Failed to parse local erp_rich_documents_v1", e);
                }
            }
        }
        setRichDocuments(loadedRichDocs);
        
        // Auto sync local migrated docs if they exist but were not in the database load
        if (!data.rich_documents && loadedRichDocs.length > 0) {
            setTimeout(() => {
                saveState('rich_documents', loadedRichDocs, setRichDocuments);
            }, 1000);
        }
      } else {
        localStorage.setItem('erp_prices_aligned_v22', 'true');
        setProducts(INITIAL_PRODUCTS);
        setShopProducts([]);
        setTanks(INITIAL_TANKS);
        setPumps(INITIAL_PUMPS);
        setNozzles(INITIAL_NOZZLES);
        setAttendants(INITIAL_ATTENDANTS);
        setShifts(INITIAL_SHIFTS);
        setSales(INITIAL_SALES);
        setSupplies(INITIAL_SUPPLIES);
        setCashRegistry(INITIAL_CASH_REGISTRY);
        setStockCorrections([]);
        setAuditLogs([]);
        setAlerts([]);
        setUsers([]);
        setRichDocuments([]);
        setConfig(INITIAL_CONFIG);
        setSuppliers(INITIAL_SUPPLIERS);
        setClients(INITIAL_CLIENTS);
        setPurchaseInvoices([]);
        setSalesInvoices([]);
        setDeliveryInvoices([]);
      }
    } catch (e) {
      console.error("Failed to load initial data", e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // saveState has been moved to the top of the useERPStore hook to prevent ReferenceErrors.

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
    const newId = `prod_${Date.now()}`;
    saveState('products', [...products, { ...product, id: newId }], setProducts);
  };

  const updateProduct = (id: string, updates: Partial<Product>, author: string) => {
    saveState('products', products.map(p => p.id === id ? { ...p, ...updates } : p), setProducts);
  };

  const updateProductsBulk = (updatesList: { id: string; updates: Partial<Product> }[], author: string) => {
    const updatedProducts = products.map(p => {
      const match = updatesList.find(u => u.id === p.id);
      return match ? { ...p, ...match.updates } : p;
    });
    saveState('products', updatedProducts, setProducts);
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

  const updateSupply = (id: string, updates: Partial<Supply>, author: string) => {
    const supplyIndex = supplies.findIndex(s => s.id === id);
    if (supplyIndex === -1) return;

    const oldSupply = supplies[supplyIndex];
    const newSupply = { ...oldSupply, ...updates };

    const updatedSupplies = [...supplies];
    updatedSupplies[supplyIndex] = newSupply;
    saveState('supplies', updatedSupplies, setSupplies);

    // If quantity or tank changed, update tank levels
    if (updates.qtyDelivered !== undefined || updates.tankId !== undefined) {
      if (oldSupply.tankId === newSupply.tankId && updates.qtyDelivered !== undefined) {
        // Same tank, just update level difference
        const tank = tanks.find(t => t.id === oldSupply.tankId);
        if (tank) {
          const qtyDiff = newSupply.qtyDelivered - oldSupply.qtyDelivered;
          const newLevel = Math.max(0, Math.min(tank.capacity, tank.currentLevel + qtyDiff));
          updateTank(tank.id, { currentLevel: newLevel }, author);
        }
      } else if (oldSupply.tankId !== newSupply.tankId) {
        // Tank changed, revert old tank and apply to new tank
        const oldTank = tanks.find(t => t.id === oldSupply.tankId);
        if (oldTank) {
          const newOldTankLevel = Math.max(0, oldTank.currentLevel - oldSupply.qtyDelivered);
          updateTank(oldTank.id, { currentLevel: newOldTankLevel }, author);
        }

        const newTank = tanks.find(t => t.id === newSupply.tankId);
        if (newTank) {
          const newNewTankLevel = Math.min(newTank.capacity, newTank.currentLevel + newSupply.qtyDelivered);
          updateTank(newTank.id, { currentLevel: newNewTankLevel }, author);
        }
      }
    }

    logAction(author, 'Modification Livraison', 'Approvisionnement', `Modification de livraison ${newSupply.invoiceNumber}`);
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
        const endElecNum = endCount.elec || startCount.elec || 0;
        const startElecNum = startCount.elec || 0;
        const diffLiters = endElecNum - startElecNum;
        let roundedDiff = Math.max(0, parseFloat(diffLiters.toFixed(2)));
        
        // Fallback to mechanical if electronic is 0
        if (roundedDiff === 0 && endCount.mech && startCount.mech) {
           const endMechNum = endCount.mech || startCount.mech || 0;
           const startMechNum = startCount.mech || 0;
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

    const roundedTotalAmount = totalAmount.toFixed(2);
    const roundedTotalLiters = totalLiters.toFixed(2);
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
    updatedTotals?: { 
      totalLiters: number; 
      totalAmount: number; 
      endCounters?: any;
      nonCashPayments?: any;
      expenses?: any[];
      productsSold?: any[];
      servicesSold?: any[];
    }
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
            ...(updatedTotals.endCounters ? { endCounters: updatedTotals.endCounters } : {}),
            ...(updatedTotals.nonCashPayments ? { nonCashPayments: updatedTotals.nonCashPayments } : {}),
            ...(updatedTotals.expenses ? { expenses: updatedTotals.expenses } : {}),
            ...(updatedTotals.productsSold ? { productsSold: updatedTotals.productsSold } : {}),
            ...(updatedTotals.servicesSold ? { servicesSold: updatedTotals.servicesSold } : {})
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
    shiftData: Omit<Shift,  'status' | 'discrepancy' | 'totalLiters' | 'totalAmount' | 'litersSold' | 'amountSold' | 'theoreticalCash' | 'realCashReceived' | 'notes'> & {
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
    saveState('delivery_invoices', [...deliveryInvoices, newInvoice], setDeliveryInvoices);
    
    // Auto-increment BL number
    if (config.documentNumbering) {
      saveState('config', {
        ...config,
        documentNumbering: {
          ...config.documentNumbering,
          bonLivraison: {
            ...config.documentNumbering.bonLivraison,
            nextNumber: config.documentNumbering.bonLivraison.nextNumber + 1
          }
        }
      }, setConfig);
    }
  };

  const updateDeliveryInvoice = (id: string, updates: Partial<SalesInvoice>, userId: string) => {
    saveState('delivery_invoices', deliveryInvoices.map(i => i.id === id ? { ...i, ...updates } : i), setDeliveryInvoices);
  };

  const deleteDeliveryInvoice = (id: string, userId: string) => {
    saveState('delivery_invoices', deliveryInvoices.filter(i => i.id !== id), setDeliveryInvoices);
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
    updateProductsBulk,
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
    updateSupply,
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

      // Rollback Transaction

      // 1. Rollback Nozzles
      let nextNozzles = [...nozzles];
      if (shift.startCounters && Object.keys(shift.startCounters).length > 0) {
        Object.entries(shift.startCounters).forEach(([nozzleId, startCount]) => {
          const nozIndex = nextNozzles.findIndex(n => n.id === nozzleId);
          if (nozIndex !== -1) {
            nextNozzles[nozIndex] = {
              ...nextNozzles[nozIndex],
              currentElecCounter: (startCount as any).elec || 0,
              currentMechCounter: (startCount as any).mech || 0
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
              currentElecCounter: Math.max(0, (nextNozzles[nozIndex].currentElecCounter as any) - qty),
              currentMechCounter: Math.max(0, (nextNozzles[nozIndex].currentMechCounter as any) - qty)
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
                currentLevel: Number((Number(nextTanks[tankIndex].currentLevel || 0) + Number(sale.qty || 0)).toFixed(2))
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
                 currentTanks[tankIndex] = { ...currentTanks[tankIndex], currentLevel: Number((Number(currentTanks[tankIndex].currentLevel || 0) + Number(qty || 0)).toFixed(2)) };
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
                 currentTanks[tankIndex] = { ...currentTanks[tankIndex], currentLevel: Number(Math.max(0, Number(currentTanks[tankIndex].currentLevel || 0) - Number(qty || 0)).toFixed(2)) };
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
    updateConfig,

    // Rich documents states
    richDocuments,
    setRichDocuments: (data: RichDocument[]) => saveState('rich_documents', data, setRichDocuments)
  };
}

