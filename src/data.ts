import { 
  Product, Tank, Pump, Nozzle, Attendant, Shift, Sale, Supply, 
  CashRegistry, StockCorrection, AuditLog, Alert, User, StationConfig,
  Supplier, Client, PurchaseInvoice, SalesInvoice
} from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'prod_gazoil', name: 'Gazoil', type: 'gazoil', purchasePrice: 0.00, salePrice: 0.00, vatRate: 20, status: 'active' },
  { id: 'prod_sans_plomb', name: 'Sans Plomb', type: 'sans_plomb', purchasePrice: 0.00, salePrice: 0.00, vatRate: 20, status: 'active' },
  { id: 'prod_melange', name: 'Mélange', type: 'melange', purchasePrice: 0.00, salePrice: 0.00, vatRate: 20, status: 'active' },
];

export const INITIAL_TANKS: Tank[] = [
  { id: 'tank_1', number: 'Cuve N°1 (Gazoil)', productId: 'prod_gazoil', productName: 'Gazoil', capacity: 30000, currentLevel: 24500, minLevel: 5000, maxLevel: 29500 },
  { id: 'tank_2', number: 'Cuve N°2 (Sans Plomb)', productId: 'prod_sans_plomb', productName: 'Sans Plomb', capacity: 20000, currentLevel: 14200, minLevel: 4000, maxLevel: 19500 },
  { id: 'tank_3', number: 'Cuve N°3 (Mélange)', productId: 'prod_melange', productName: 'Mélange', capacity: 20000, currentLevel: 4200, minLevel: 4000, maxLevel: 19500 }, // Low Stock Alarm triggered soon!
];

export const INITIAL_PUMPS: Pump[] = [
  { id: 'pump_1', number: 'Pompe 01', manufacturer: 'Tokheim', serialNumber: 'TK-98231-A', status: 'active' },
  { id: 'pump_2', number: 'Pompe 02', manufacturer: 'Tokheim', serialNumber: 'TK-98232-B', status: 'active' },
  { id: 'pump_3', number: 'Pompe 03', manufacturer: 'Wayne', serialNumber: 'WY-44201-X', status: 'active' },
  { id: 'pump_4', number: 'Pompe 04', manufacturer: 'Wayne', serialNumber: 'WY-44202-Y', status: 'maintenance' },
];

export const INITIAL_NOZZLES: Nozzle[] = [
  // Pompe 1
  { id: 'noz_1a', name: 'Pistolet 1-A', productId: 'prod_gazoil', productName: 'Gazoil', pumpId: 'pump_1', pumpNumber: 'Pompe 01', tankId: 'tank_1', tankNumber: 'Cuve N°1 (Gazoil)', currentMechCounter: 152430, currentElecCounter: 152432.1, status: 'active' },
  { id: 'noz_1b', name: 'Pistolet 1-B', productId: 'prod_sans_plomb', productName: 'Sans Plomb', pumpId: 'pump_1', pumpNumber: 'Pompe 01', tankId: 'tank_2', tankNumber: 'Cuve N°2 (Sans Plomb)', currentMechCounter: 98210, currentElecCounter: 98211.5, status: 'active' },
  { id: 'noz_1c', name: 'Pistolet 1-C', productId: 'prod_melange', productName: 'Mélange', pumpId: 'pump_1', pumpNumber: 'Pompe 01', tankId: 'tank_3', tankNumber: 'Cuve N°3 (Mélange)', currentMechCounter: 64150, currentElecCounter: 64152.0, status: 'active' },
  
  // Pompe 2
  { id: 'noz_2a', name: 'Pistolet 2-A', productId: 'prod_gazoil', productName: 'Gazoil', pumpId: 'pump_2', pumpNumber: 'Pompe 02', tankId: 'tank_1', tankNumber: 'Cuve N°1 (Gazoil)', currentMechCounter: 184200, currentElecCounter: 184203.4, status: 'active' },
  { id: 'noz_2b', name: 'Pistolet 2-B', productId: 'prod_sans_plomb', productName: 'Sans Plomb', pumpId: 'pump_2', pumpNumber: 'Pompe 02', tankId: 'tank_2', tankNumber: 'Cuve N°2 (Sans Plomb)', currentMechCounter: 74100, currentElecCounter: 74102.2, status: 'active' },
  { id: 'noz_2c', name: 'Pistolet 2-C', productId: 'prod_melange', productName: 'Mélange', pumpId: 'pump_2', pumpNumber: 'Pompe 02', tankId: 'tank_3', tankNumber: 'Cuve N°3 (Mélange)', currentMechCounter: 41200, currentElecCounter: 41200.8, status: 'active' },

  // Pompe 3
  { id: 'noz_3a', name: 'Pistolet 3-A', productId: 'prod_gazoil', productName: 'Gazoil', pumpId: 'pump_3', pumpNumber: 'Pompe 03', tankId: 'tank_1', tankNumber: 'Cuve N°1 (Gazoil)', currentMechCounter: 211450, currentElecCounter: 211452.9, status: 'active' },
  { id: 'noz_3b', name: 'Pistolet 3-B', productId: 'prod_sans_plomb', productName: 'Sans Plomb', pumpId: 'pump_3', pumpNumber: 'Pompe 03', tankId: 'tank_2', tankNumber: 'Cuve N°2 (Sans Plomb)', currentMechCounter: 82300, currentElecCounter: 82301.1, status: 'active' },

  // Pompe 4
  { id: 'noz_4a', name: 'Pistolet 4-A', productId: 'prod_gazoil', productName: 'Gazoil', pumpId: 'pump_4', pumpNumber: 'Pompe 04', tankId: 'tank_1', tankNumber: 'Cuve N°1 (Gazoil)', currentMechCounter: 35000, currentElecCounter: 35000.0, status: 'defective' },
  { id: 'noz_4b', name: 'Pistolet 4-B', productId: 'prod_melange', productName: 'Mélange', pumpId: 'pump_4', pumpNumber: 'Pompe 04', tankId: 'tank_3', tankNumber: 'Cuve N°3 (Mélange)', currentMechCounter: 22100, currentElecCounter: 22100.0, status: 'active' },
];

export const INITIAL_ATTENDANTS: Attendant[] = [
  { id: 'att_1', firstName: 'Yassine', lastName: 'El Amrani', phone: '+212 6 61 12 34 56', matricule: 'PM-2023-001', hireDate: '2023-03-12', status: 'active', notes: 'Excellent pompiste, ponctuel et honnête.' },
  { id: 'att_2', firstName: 'Khadija', lastName: 'Bennani', phone: '+212 6 62 98 76 54', matricule: 'PM-2024-004', hireDate: '2024-02-01', status: 'active', notes: 'Très bon contact client, gère bien la caisse.' },
  { id: 'att_3', firstName: 'Ahmed', lastName: 'Benali', phone: '+212 6 63 11 22 33', matricule: 'PM-2024-012', hireDate: '2024-06-15', status: 'active', notes: 'Travail sérieux, rigoureux sur les relevés d\'index.' },
  { id: 'att_4', firstName: 'Youssef', lastName: 'Tazi', phone: '+212 6 64 55 44 33', matricule: 'PM-2025-003', hireDate: '2025-01-10', status: 'inactive', notes: 'En congé sabbatique.' },
];

export const INITIAL_SHIFTS: Shift[] = [
  {
    id: 'shift_past_1',
    attendantId: 'att_1',
    attendantName: 'Yassine El Amrani',
    date: '2026-07-05',
    shiftName: 'Journée',
    pumpIds: ['pump_1', 'pump_2'],
    status: 'completed',
    startTime: '06:00',
    endTime: '14:00',
    startCounters: {
      'noz_1a': { mech: 152120, elec: 152121.2 },
      'noz_1b': { mech: 98010, elec: 98011.0 },
      'noz_1c': { mech: 64000, elec: 64001.5 },
      'noz_2a': { mech: 183900, elec: 183902.1 },
      'noz_2b': { mech: 73950, elec: 73951.8 },
      'noz_2c': { mech: 41080, elec: 41080.3 }
    },
    endCounters: {
      'noz_1a': { mech: 152280, elec: 152281.8 }, // 160L sold
      'noz_1b': { mech: 98110, elec: 98112.1 }, // 100L sold
      'noz_1c': { mech: 64080, elec: 64081.7 }, // 80L sold
      'noz_2a': { mech: 184080, elec: 184082.9 }, // 180L sold
      'noz_2b': { mech: 74020, elec: 74021.9 }, // 70L sold
      'noz_2c': { mech: 41140, elec: 41140.6 }  // 60L sold
    },
    litersSold: {
      'noz_1a': 160, 'noz_1b': 100, 'noz_1c': 80,
      'noz_2a': 180, 'noz_2b': 70, 'noz_2c': 60
    },
    amountSold: {
      'noz_1a': 291.2, 'noz_1b': 195, 'noz_1c': 164,
      'noz_2a': 327.6, 'noz_2b': 136.5, 'noz_2c': 123
    },
    totalLiters: 650,
    totalAmount: 1237.3,
    theoreticalCash: 1237.3,
    realCashReceived: 1237.3,
    discrepancy: 0,
    duration: 8,
    notes: 'Shift calme, aucun écart.'
  },
  {
    id: 'shift_past_2',
    attendantId: 'att_2',
    attendantName: 'Khadija Bennani',
    date: '2026-07-05',
    shiftName: 'Journée',
    pumpIds: ['pump_1', 'pump_2', 'pump_3'],
    status: 'completed',
    startTime: '14:00',
    endTime: '22:00',
    startCounters: {
      'noz_1a': { mech: 152280, elec: 152281.8 },
      'noz_1b': { mech: 98110, elec: 98112.1 },
      'noz_1c': { mech: 64080, elec: 64081.7 },
      'noz_2a': { mech: 184080, elec: 184082.9 },
      'noz_2b': { mech: 74020, elec: 74021.9 },
      'noz_2c': { mech: 41140, elec: 41140.6 },
      'noz_3a': { mech: 211200, elec: 211202.0 },
      'noz_3b': { mech: 82180, elec: 82180.8 }
    },
    endCounters: {
      'noz_1a': { mech: 152430, elec: 152432.1 }, // 150L sold
      'noz_1b': { mech: 98210, elec: 98211.5 }, // 100L sold
      'noz_1c': { mech: 64150, elec: 64152.0 }, // 70L sold
      'noz_2a': { mech: 184200, elec: 184203.4 }, // 120L sold
      'noz_2b': { mech: 74100, elec: 74102.2 }, // 80L sold
      'noz_2c': { mech: 41200, elec: 41200.8 }, // 60L sold
      'noz_3a': { mech: 211450, elec: 211452.9 }, // 250L sold
      'noz_3b': { mech: 82300, elec: 82301.1 }  // 120L sold
    },
    litersSold: {
      'noz_1a': 150, 'noz_1b': 100, 'noz_1c': 70,
      'noz_2a': 120, 'noz_2b': 80, 'noz_2c': 60,
      'noz_3a': 250, 'noz_3b': 120
    },
    amountSold: {
      'noz_1a': 273, 'noz_1b': 195, 'noz_1c': 143.5,
      'noz_2a': 218.4, 'noz_2b': 156, 'noz_2c': 123,
      'noz_3a': 455, 'noz_3b': 234
    },
    totalLiters: 950,
    totalAmount: 1797.9,
    theoreticalCash: 1797.9,
    realCashReceived: 1792.9,
    discrepancy: -5, // -5 MAD discrepancy!
    duration: 8,
    notes: 'Différence de -5 MAD expliquée par une erreur de monnaie rendue à un client pressé.'
  }
];

export const INITIAL_SALES: Sale[] = [
  // Seeded sales from July 2nd
  { id: 'sale_1', date: '2026-07-05', time: '08:32', productId: 'prod_gazoil', productName: 'Gazoil', qty: 50, price: 1.82, total: 91, pumpId: 'pump_1', pumpNumber: 'Pompe 01', nozzleId: 'noz_1a', nozzleName: 'Pistolet 1-A', attendantId: 'att_1', attendantName: 'Yassine El Amrani', shiftId: 'shift_past_1' },
  { id: 'sale_2', date: '2026-07-05', time: '09:15', productId: 'prod_sans_plomb', productName: 'Sans Plomb', qty: 40, price: 1.95, total: 78, pumpId: 'pump_1', pumpNumber: 'Pompe 01', nozzleId: 'noz_1b', nozzleName: 'Pistolet 1-B', attendantId: 'att_1', attendantName: 'Yassine El Amrani', shiftId: 'shift_past_1' },
  { id: 'sale_3', date: '2026-07-05', time: '10:45', productId: 'prod_melange', productName: 'Mélange', qty: 45, price: 2.05, total: 92.25, pumpId: 'pump_2', pumpNumber: 'Pompe 02', nozzleId: 'noz_2c', nozzleName: 'Pistolet 2-C', attendantId: 'att_1', attendantName: 'Yassine El Amrani', shiftId: 'shift_past_1' },
  { id: 'sale_4', date: '2026-07-05', time: '11:20', productId: 'prod_gazoil', productName: 'Gazoil', qty: 65, price: 1.82, total: 118.3, pumpId: 'pump_2', pumpNumber: 'Pompe 02', nozzleId: 'noz_2a', nozzleName: 'Pistolet 2-A', attendantId: 'att_1', attendantName: 'Yassine El Amrani', shiftId: 'shift_past_1' },
  { id: 'sale_5', date: '2026-07-05', time: '15:10', productId: 'prod_gazoil', productName: 'Gazoil', qty: 120, price: 1.82, total: 218.4, pumpId: 'pump_3', pumpNumber: 'Pompe 03', nozzleId: 'noz_3a', nozzleName: 'Pistolet 3-A', attendantId: 'att_2', attendantName: 'Khadija Bennani', shiftId: 'shift_past_2' },
  { id: 'sale_6', date: '2026-07-05', time: '16:40', productId: 'prod_sans_plomb', productName: 'Sans Plomb', qty: 35, price: 1.95, total: 68.25, pumpId: 'pump_3', pumpNumber: 'Pompe 03', nozzleId: 'noz_3b', nozzleName: 'Pistolet 3-B', attendantId: 'att_2', attendantName: 'Khadija Bennani', shiftId: 'shift_past_2' },
  { id: 'sale_7', date: '2026-07-05', time: '18:55', productId: 'prod_melange', productName: 'Mélange', qty: 55, price: 2.05, total: 112.75, pumpId: 'pump_1', pumpNumber: 'Pompe 01', nozzleId: 'noz_1c', nozzleName: 'Pistolet 1-C', attendantId: 'att_2', attendantName: 'Khadija Bennani', shiftId: 'shift_past_2' },
  { id: 'sale_8', date: '2026-07-05', time: '20:12', productId: 'prod_gazoil', productName: 'Gazoil', qty: 80, price: 1.82, total: 145.6, pumpId: 'pump_3', pumpNumber: 'Pompe 03', nozzleId: 'noz_3a', nozzleName: 'Pistolet 3-A', attendantId: 'att_2', attendantName: 'Khadija Bennani', shiftId: 'shift_past_2' },
];

export const INITIAL_SUPPLIES: Supply[] = [
  { id: 'sup_1', supplier: 'TotalEnergies Distribution', productId: 'prod_gazoil', productName: 'Gazoil', tankId: 'tank_1', tankNumber: 'Cuve N°1 (Gazoil)', qtyDelivered: 12000, purchasePrice: 1.41, invoiceNumber: 'INV-2026-0689', date: '2026-06-28' },
  { id: 'sup_2', supplier: 'Esso Cargo France', productId: 'prod_sans_plomb', productName: 'Sans Plomb', tankId: 'tank_2', tankNumber: 'Cuve N°2 (Sans Plomb)', qtyDelivered: 8000, purchasePrice: 1.51, invoiceNumber: 'INV-2026-0711', date: '2026-06-30' },
  { id: 'sup_3', supplier: 'TotalEnergies Distribution', productId: 'prod_melange', productName: 'Mélange', tankId: 'tank_3', tankNumber: 'Cuve N°3 (Mélange)', qtyDelivered: 6000, purchasePrice: 1.58, invoiceNumber: 'INV-2026-0715', date: '2026-07-01' },
];

export const INITIAL_CASH_REGISTRY: CashRegistry = {
  id: 'cash_session_current',
  isOpen: true,
  openedAt: '2026-07-05T06:00:00',
  openedBy: 'Directeur ERP',
  openingCash: 500,
  inputs: [
    { id: 'in_1', amount: 1500, label: 'Alimentation caisse de réserve', time: '08:30' }
  ],
  outputs: [
    { id: 'out_1', amount: 120, label: 'Achat de fournitures de bureau', time: '10:15' }
  ],
  theoreticalCash: 1880, // 500 + 1500 - 120
};

export const INITIAL_STOCK_CORRECTIONS: StockCorrection[] = [
  { id: 'corr_1', date: '2026-06-25', tankId: 'tank_2', tankNumber: 'Cuve N°2 (Sans Plomb)', productId: 'prod_sans_plomb', qtyBefore: 12450, qtyAfter: 12410, reason: 'Correction écart évaporation thermique', user: 'Directeur ERP' }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'log_1', date: '2026-07-05', time: '06:00', user: 'Directeur ERP', action: 'Ouverture de Caisse', module: 'Caisse', details: 'Caisse ouverte avec 500 MAD' },
  { id: 'log_2', date: '2026-07-05', time: '07:12', user: 'Directeur ERP', action: 'Ajustement Prix', module: 'Paramètres', details: 'Mise à jour des prix de vente : Gazoil à 1.82 MAD/L, Sans Plomb à 1.95 MAD/L, Mélange à 2.05 MAD/L' },
];

export const INITIAL_ALERTS: Alert[] = [
  { id: 'alert_1', date: '2026-07-05T01:10:00', severity: 'warning', message: 'Le niveau de la Cuve N°3 (Mélange) est faible : 4 200 L restants (seuil min : 4 000 L).', isRead: false, type: 'low_stock' },
  { id: 'alert_2', date: '2026-07-05T16:00:00', severity: 'warning', message: 'La Pompe 04 est déclarée HORS SERVICE pour maintenance pistolet.', isRead: true, type: 'pump_offline' },
  { id: 'alert_3', date: '2026-07-05T22:15:00', severity: 'danger', message: 'Écart de caisse détecté sur le shift "Après-midi" de Khadija Bennani : -5.00 MAD.', isRead: false, type: 'cash_discrepancy' },
];

export const INITIAL_USERS: User[] = [
  { id: 'u_1', email: 'admin@stationerp.com', name: 'Administrateur ERP', role: 'admin', status: 'active' },
  { id: 'u_2', email: 'gerant@stationerp.com', name: 'Gérant Principal', role: 'manager', status: 'active' },
  { id: 'u_3', email: 'caissier@stationerp.com', name: 'Caissier Chef', role: 'cashier', status: 'active' },
  { id: 'u_4', email: 'pompiste@stationerp.com', name: 'Yassine El Amrani (Attendant)', role: 'attendant', status: 'active' },
];

export const INITIAL_CONFIG: StationConfig = {
  name: 'Station-Service AutoGlow Casablanca',
  logo: '⛽',
  address: "Boulevard d'Anfa, 20000 Casablanca",
  phone: '+212 5 22 45 67 89',
  taxId: 'MA-88923849102',
  autoBackup: true,
  language: 'fr',
  theme: 'light',
  printerIp: '192.168.1.150',
  iotConfigured: true,
};

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'supp_1', name: 'TotalEnergies', phone: '+212 5 22 11 22 33', email: 'contact@total.ma', address: 'Casablanca', ice: '1122334455', contact: 'M. Ali', notes: 'Fournisseur principal' }
];

export const INITIAL_CLIENTS: Client[] = [
  { id: 'client_1', name: 'Transports Express', phone: '+212 6 61 00 11 22', email: 'contact@transporte.ma', address: 'Rabat', ice: '9988776655', contact: 'M. Omar', notes: 'Client B2B VIP' }
];

export const INITIAL_PURCHASE_INVOICES: PurchaseInvoice[] = [];

export const INITIAL_SALES_INVOICES: SalesInvoice[] = [];

// State manager with local storage persistence
export class ERPStorage {
  private static getKey(key: string): string {
    return `station_erp_v2_${key}`;
  }

  static get<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(this.getKey(key));
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      console.error(`Error loading key ${key}`, e);
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (e) {
      console.error(`Error setting key ${key}`, e);
    }
  }

  static initAll(): void {
    if (!localStorage.getItem(this.getKey('products'))) this.set('products', []);
    if (!localStorage.getItem(this.getKey('tanks'))) this.set('tanks', []);
    if (!localStorage.getItem(this.getKey('pumps'))) this.set('pumps', []);
    if (!localStorage.getItem(this.getKey('nozzles'))) this.set('nozzles', []);
    if (!localStorage.getItem(this.getKey('attendants'))) this.set('attendants', []);
    if (!localStorage.getItem(this.getKey('shifts'))) this.set('shifts', []);
    if (!localStorage.getItem(this.getKey('sales'))) this.set('sales', []);
    if (!localStorage.getItem(this.getKey('supplies'))) this.set('supplies', []);
    if (!localStorage.getItem(this.getKey('cash_registry'))) this.set('cash_registry', INITIAL_CASH_REGISTRY);
    if (!localStorage.getItem(this.getKey('stock_corrections'))) this.set('stock_corrections', []);
    if (!localStorage.getItem(this.getKey('audit_logs'))) this.set('audit_logs', []);
    if (!localStorage.getItem(this.getKey('alerts'))) this.set('alerts', []);
    if (!localStorage.getItem(this.getKey('users'))) this.set('users', []);
    if (!localStorage.getItem(this.getKey('config'))) this.set('config', INITIAL_CONFIG);
    if (!localStorage.getItem(this.getKey('suppliers'))) this.set('suppliers', []);
    if (!localStorage.getItem(this.getKey('clients'))) this.set('clients', []);
    if (!localStorage.getItem(this.getKey('purchase_invoices'))) this.set('purchase_invoices', []);
    if (!localStorage.getItem(this.getKey('sales_invoices'))) this.set('sales_invoices', []);
    if (!localStorage.getItem(this.getKey('current_user_role'))) localStorage.setItem(this.getKey('current_user_role'), 'admin');
  }

  static resetAll(): void {
    localStorage.removeItem(this.getKey('products'));
    localStorage.removeItem(this.getKey('tanks'));
    localStorage.removeItem(this.getKey('pumps'));
    localStorage.removeItem(this.getKey('nozzles'));
    localStorage.removeItem(this.getKey('attendants'));
    localStorage.removeItem(this.getKey('shifts'));
    localStorage.removeItem(this.getKey('sales'));
    localStorage.removeItem(this.getKey('supplies'));
    localStorage.removeItem(this.getKey('cash_registry'));
    localStorage.removeItem(this.getKey('stock_corrections'));
    localStorage.removeItem(this.getKey('audit_logs'));
    localStorage.removeItem(this.getKey('alerts'));
    localStorage.removeItem(this.getKey('users'));
    localStorage.removeItem(this.getKey('config'));
    localStorage.removeItem(this.getKey('suppliers'));
    localStorage.removeItem(this.getKey('clients'));
    localStorage.removeItem(this.getKey('purchase_invoices'));
    localStorage.removeItem(this.getKey('sales_invoices'));
    localStorage.removeItem(this.getKey('current_user_role'));
    this.initAll();
  }
}
