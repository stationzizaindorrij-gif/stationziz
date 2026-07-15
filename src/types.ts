export interface Product {
  id: string;
  name: string;
  type: 'gazoil' | 'sans_plomb' | 'melange';
  purchasePrice: number; // Price per liter from supplier
  salePrice: number;     // Price per liter at pump
  vatRate: number;       // TVA in percentage (e.g., 20)
  status: 'active' | 'inactive';
}

export interface Tank {
  id: string;
  number: string;
  productId: string;
  productName: string;
  capacity: number;      // Max capacity in liters
  currentLevel: number;  // Current fuel level in liters
  minLevel: number;      // Low level threshold for alerts
  maxLevel: number;      // High level warning threshold
  color?: string;
  location?: string;
  status?: 'active' | 'maintenance' | 'offline';
  connectedPumpIds?: string[];
}

export interface Pump {
  id: string;
  number: string;
  manufacturer: string;
  serialNumber: string;
  status: 'active' | 'maintenance' | 'offline';
  orderIndex?: number;
}

export interface Nozzle {
  id: string;
  name: string;          // e.g. "Pistolet 1"
  productId: string;
  productName: string;
  pumpId: string;
  pumpNumber: string;
  tankId: string;
  tankNumber: string;
  currentMechCounter: number; // Mechanical counter (liters)
  currentElecCounter: number; // Electronic counter (liters)
  status: 'active' | 'defective' | 'maintenance';
}

export interface Attendant {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  matricule: string;
  hireDate: string;
  status: 'active' | 'inactive';
  notes: string;
  photo?: string;
}

export type ShiftStatus = 'active' | 'ready_to_close' | 'completed';

export interface Shift {
  id: string;
  attendantId: string;
  attendantName: string;
  date: string;
  endDate?: string;
  shiftName: 'Journée' | 'Matin' | 'Après-midi' | 'Nuit';
  pumpIds: string[];      // Associated pumps
  status: ShiftStatus;
  startTime: string;
  endTime?: string;
  
  // Starting counters for nozzles associated with the assigned pumps
  startCounters: {
    [nozzleId: string]: {
      mech: number;
      elec: number;
    }
  };
  
  // Ending counters (filled during checkout)
  endCounters?: {
    [nozzleId: string]: {
      mech: number;
      elec: number;
    }
  };
  
  // Calculated on completion
  litersSold?: {
    [nozzleId: string]: number;
  };
  amountSold?: {
    [nozzleId: string]: number;
  };
  
  totalLiters?: number;
  totalAmount?: number;
  theoreticalCash?: number;
  realCashReceived?: number;
  discrepancy?: number;
  duration?: number; // In hours
  notes?: string;
  productsSold?: any[];
  servicesSold?: any[];
  expenses?: any[];
  nonCashPayments?: {
    carteSntl?: { amount: number; clientId?: string; date?: string; stan?: string }[];
    espece?: { amount: number; clientId?: string; date?: string }[];
    bonCarburantsVivo?: { amount: number; clientId?: string; date?: string }[];
    vignette?: { amount: number; clientId?: string; date?: string }[];
    bonClient?: { amount: number; clientName?: string; date?: string }[];
    tpe?: { amount: number; date?: string; terminal?: string }[];
    cheque?: { amount: number; date?: string }[];
    virement?: { amount: number; date?: string }[];
    autre?: { amount: number; date?: string }[];
  };
}

export interface Sale {
  id: string;
  date: string;
  endDate?: string;
  time: string;
  productId: string;
  productName: string;
  qty: number;           // Liters sold
  price: number;         // Price per liter
  total: number;         // Total sale cost
  pumpId: string;
  pumpNumber: string;
  nozzleId: string;
  nozzleName: string;
  attendantId: string;
  attendantName: string;
  shiftId: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  ice: string;
  contact: string;
  notes: string;
  payments?: ClientPayment[];
}


export interface ClientPayment {
  id: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  ice: string;
  contact: string;
  notes: string;
  payments?: ClientPayment[];
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  date: string;
  endDate?: string;
  productId: string;
  tankId: string;
  quantity: number;
  pricePerLiter: number;
  amountHT: number;
  vatAmount: number;
  amountTTC: number;
  paymentMethod: string;
  status: 'pending' | 'paid';
  deliverySlip: string;
  attachment?: string;
  observations: string;
  userId: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  date: string;
  endDate?: string;
  productId: string;
  quantity: number;
  pricePerLiter: number;
  amountHT: number;
  vatAmount: number;
  amountTTC: number;
  paymentMethod: string;
  shiftId?: string;
  attendantId?: string;
  saleId?: string;
  userId: string;
}

export interface Supply {
  id: string;
  supplier: string;
  productId: string;
  productName: string;
  tankId: string;
  tankNumber: string;
  qtyDelivered: number;
  purchasePrice: number; // Price per liter
  invoiceNumber: string;
  date: string;
  endDate?: string;
}

export interface CashRegistry {
  id: string;
  isOpen: boolean;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  openingCash: number;
  closingCash?: number;
  inputs: { id: string; amount: number; label: string; time: string }[];
  outputs: { id: string; amount: number; label: string; time: string }[];
  theoreticalCash: number;
  realCash?: number;
  discrepancy?: number;
}

export interface StockCorrection {
  id: string;
  date: string;
  endDate?: string;
  tankId: string;
  tankNumber: string;
  productId: string;
  qtyBefore: number;
  qtyAfter: number;
  reason: string;
  user: string;
}

export interface AuditLog {
  id: string;
  date: string;
  endDate?: string;
  time: string;
  user: string;
  action: string;
  module: string;
  details: string;
}

export interface Alert {
  id: string;
  date: string;
  endDate?: string;
  severity: 'info' | 'warning' | 'danger';
  message: string;
  isRead: boolean;
  type: 'low_stock' | 'overflow' | 'pump_offline' | 'nozzle_defective' | 'cash_discrepancy' | 'iot_offline' | 'employee_inactive';
}

export type UserRole = 'admin' | 'manager' | 'cashier' | 'attendant';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'active' | 'inactive';
}

export interface StationConfig {
  name: string;
  logo: string;
  address: string;
  phone: string;
  taxId: string;
  autoBackup: boolean;
  language: 'fr' | 'en';
  theme: 'light' | 'dark';
  printerIp: string;
  iotConfigured: boolean;
  documentLogo?: string;
  documentColor?: string;
  documentCompanyDetails?: string;
  documentNumbering?: {
    facture: { prefix: string, nextNumber: number };
    devis: { prefix: string, nextNumber: number };
    bonLivraison: { prefix: string, nextNumber: number };
  };
  documentColumnsOrder?: string[];
  documentFooter?: string;
  documentSettings?: any;
}

export interface ShopProduct {
  id: string;
  name: string;
  photo?: string;
  purchasePrice: number;
  salePrice: number;
  stockQuantity: number;
  minStockAlert?: number;
  status: 'active' | 'inactive';
}


