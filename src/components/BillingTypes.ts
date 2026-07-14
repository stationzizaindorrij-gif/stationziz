export type DocumentType = 
  | 'client_devis' 
  | 'client_facture' 
  | 'client_bl'
  | 'supplier_devis_req'
  | 'supplier_br'
  | 'supplier_facture';

export interface DocumentItem {
  id: string;
  productId: string;
  productName: string;
  description: string;
  qty: number;
  price: number;
  vat: number; // e.g. 20 for 20%
  discount: number; // e.g. 10 for 10%
}

export interface MixedPaymentRow {
  method: string; // 'especes' | 'carte' | 'cheque' | 'virement' | 'credit'
  amount: number;
  ref?: string;
}

export interface RichDocument {
  id: string;
  docType: DocumentType;
  documentNumber: string;
  partnerId: string; // Client ID or Supplier ID
  partnerName: string;
  date: string;
  dueDate: string;
  items: DocumentItem[];
  amountHT: number;
  vatAmount: number;
  amountTTC: number;
  paymentMethod: 'especes' | 'carte' | 'cheque' | 'virement' | 'credit' | 'mixed';
  mixedPayments?: MixedPaymentRow[];
  notes: string;
  terms: string;
  status: 'draft' | 'sent' | 'paid' | 'validated' | 'rejected' | 'pending';
  historyLogs?: { date: string; action: string; author: string }[];
}

export interface DocumentSettings {
  logoUrl: string;
  logoSize?: number; // width in pixels
  companyName: string;
  address: string;
  phone: string;
  email: string;
  ice: string; // Identifiant Commun de l'Entreprise
  rc: string; // Registre du Commerce
  ifNum: string; // Identifiant Fiscal
  patente: string;
  cnss: string;
  capital: string;
  primaryColor: string; // hex
  fontFamily: string; // 'Inter' | 'Space Grotesk' | 'Playfair Display' | 'Courier'
  footerText: string;
  termsAndConditions: string;
  showSignature: boolean;
  showStamp: boolean;
  stampUrl?: string;
  stampText: string;
  stampColor: 'blue' | 'red';
  numbering: {
    client_devis: { prefix: string; nextNumber: number; suffix: string };
    client_facture: { prefix: string; nextNumber: number; suffix: string };
    client_bl: { prefix: string; nextNumber: number; suffix: string };
    supplier_devis_req: { prefix: string; nextNumber: number; suffix: string };
    supplier_br: { prefix: string; nextNumber: number; suffix: string };
    supplier_facture: { prefix: string; nextNumber: number; suffix: string };
  };
  visibleColumns: {
    code: boolean;
    name: boolean;
    description: boolean;
    qty: boolean;
    price: boolean;
    discount: boolean;
    vat: boolean;
    totalHT: boolean;
    totalTTC: boolean;
  };
  columnsOrder: string[];
}

export const DEFAULT_SETTINGS: DocumentSettings = {
  logoUrl: '⛽',
  logoSize: 100,
  companyName: 'ATLAS PETROLEUM SARL',
  address: 'Zone Industrielle Sidi Maârouf, N° 14, Casablanca, Maroc',
  phone: '+212 522 45 67 89',
  email: 'contact@atlaspetroleum.ma',
  ice: '001548796000085',
  rc: '45896',
  ifNum: '15248965',
  patente: '36521489',
  cnss: '85965412',
  capital: '1 000 000 MAD',
  primaryColor: '#4f46e5', // Indigo
  fontFamily: 'Inter',
  footerText: 'Merci pour votre confiance. ATLAS PETROLEUM - Station service certifiée.',
  termsAndConditions: 'Le règlement des factures s’effectue à la date d’échéance mentionnée sur le document. Aucun escompte n’est accordé pour paiement anticipé. Tout retard de paiement entraînera des pénalités au taux légal en vigueur.',
  showSignature: true,
  showStamp: true,
  stampUrl: '',
  stampText: 'STATION SERVICE ATLAS - REÇU ET APPROUVÉ',
  stampColor: 'blue',
  numbering: {
    client_devis: { prefix: 'DEV-', nextNumber: 1, suffix: '' },
    client_facture: { prefix: 'FAC-', nextNumber: 1, suffix: '' },
    client_bl: { prefix: 'BLC-', nextNumber: 1, suffix: '' },
    supplier_devis_req: { prefix: 'DEM-', nextNumber: 1, suffix: '' },
    supplier_br: { prefix: 'BRF-', nextNumber: 1, suffix: '' },
    supplier_facture: { prefix: 'FAF-', nextNumber: 1, suffix: '' }
  },
  visibleColumns: {
    code: true,
    name: true,
    description: true,
    qty: true,
    price: true,
    discount: true,
    vat: true,
    totalHT: true,
    totalTTC: true
  },
  columnsOrder: ['code', 'name', 'description', 'qty', 'price', 'discount', 'vat', 'totalHT', 'totalTTC']
};
