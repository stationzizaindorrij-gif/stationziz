-- Create ERP tables
CREATE TABLE erp_products (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  type TEXT,
  "purchasePrice" NUMERIC,
  "salePrice" NUMERIC,
  "vatRate" NUMERIC,
  status TEXT
);

CREATE TABLE erp_tanks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  number TEXT,
  "productId" TEXT,
  "productName" TEXT,
  capacity NUMERIC,
  "currentLevel" NUMERIC,
  "minLevel" NUMERIC,
  "maxLevel" NUMERIC,
  color TEXT,
  location TEXT,
  status TEXT,
  "connectedPumpIds" JSONB
);

CREATE TABLE erp_pumps (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  number TEXT,
  manufacturer TEXT,
  "serialNumber" TEXT,
  status TEXT
);

CREATE TABLE erp_nozzles (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  "productId" TEXT,
  "productName" TEXT,
  "pumpId" TEXT,
  "pumpNumber" TEXT,
  "tankId" TEXT,
  "tankNumber" TEXT,
  "currentMechCounter" NUMERIC,
  "currentElecCounter" NUMERIC,
  status TEXT
);

CREATE TABLE erp_attendants (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "firstName" TEXT,
  "lastName" TEXT,
  phone TEXT,
  matricule TEXT,
  "hireDate" TEXT,
  status TEXT,
  notes TEXT
);

CREATE TABLE erp_shifts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "attendantId" TEXT,
  "attendantName" TEXT,
  date TEXT,
  "shiftName" TEXT,
  "pumpIds" JSONB,
  status TEXT,
  "startTime" TEXT,
  "endTime" TEXT,
  "startCounters" JSONB,
  "endCounters" JSONB,
  "litersSold" JSONB,
  "amountSold" JSONB,
  "totalLiters" NUMERIC,
  "totalAmount" NUMERIC,
  "theoreticalCash" NUMERIC,
  "realCashReceived" NUMERIC,
  discrepancy NUMERIC,
  duration NUMERIC,
  notes TEXT,
  "productsSold" JSONB,
  "servicesSold" JSONB,
  expenses JSONB,
  "nonCashPayments" JSONB
);

CREATE TABLE erp_sales (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT,
  time TEXT,
  "productId" TEXT,
  "productName" TEXT,
  qty NUMERIC,
  price NUMERIC,
  total NUMERIC,
  "pumpId" TEXT,
  "pumpNumber" TEXT,
  "nozzleId" TEXT,
  "nozzleName" TEXT,
  "attendantId" TEXT,
  "attendantName" TEXT,
  "shiftId" TEXT
);

CREATE TABLE erp_supplies (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier TEXT,
  "productId" TEXT,
  "productName" TEXT,
  "tankId" TEXT,
  "tankNumber" TEXT,
  "qtyDelivered" NUMERIC,
  "purchasePrice" NUMERIC,
  "invoiceNumber" TEXT,
  date TEXT
);

CREATE TABLE erp_cash_registry (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "isOpen" BOOLEAN,
  "openedAt" TEXT,
  "closedAt" TEXT,
  "openedBy" TEXT,
  "closedBy" TEXT,
  "openingCash" NUMERIC,
  "closingCash" NUMERIC,
  inputs JSONB,
  outputs JSONB,
  "theoreticalCash" NUMERIC,
  "realCash" NUMERIC,
  discrepancy NUMERIC
);

CREATE TABLE erp_stock_corrections (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT,
  "tankId" TEXT,
  "tankNumber" TEXT,
  "productId" TEXT,
  "qtyBefore" NUMERIC,
  "qtyAfter" NUMERIC,
  reason TEXT,
  "user" TEXT
);

CREATE TABLE erp_audit_logs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT,
  time TEXT,
  "user" TEXT,
  action TEXT,
  module TEXT,
  details TEXT
);

CREATE TABLE erp_alerts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT,
  severity TEXT,
  message TEXT,
  "isRead" BOOLEAN,
  type TEXT
);

CREATE TABLE erp_users (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role TEXT,
  status TEXT
);

CREATE TABLE erp_config (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  logo TEXT,
  address TEXT,
  phone TEXT,
  "taxId" TEXT,
  "autoBackup" BOOLEAN,
  language TEXT,
  theme TEXT,
  "printerIp" TEXT,
  "iotConfigured" BOOLEAN
);

CREATE TABLE erp_suppliers (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  ice TEXT,
  contact TEXT,
  notes TEXT
);

CREATE TABLE erp_clients (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  ice TEXT,
  contact TEXT,
  notes TEXT
);

CREATE TABLE erp_purchase_invoices (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "invoiceNumber" TEXT,
  "supplierId" TEXT,
  date TEXT,
  "productId" TEXT,
  "tankId" TEXT,
  quantity NUMERIC,
  "pricePerLiter" NUMERIC,
  "amountHT" NUMERIC,
  "vatAmount" NUMERIC,
  "amountTTC" NUMERIC,
  "paymentMethod" TEXT,
  status TEXT,
  "deliverySlip" TEXT,
  attachment TEXT,
  observations TEXT,
  "userId" TEXT
);

CREATE TABLE erp_sales_invoices (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "invoiceNumber" TEXT,
  "clientId" TEXT,
  date TEXT,
  "productId" TEXT,
  quantity NUMERIC,
  "pricePerLiter" NUMERIC,
  "amountHT" NUMERIC,
  "vatAmount" NUMERIC,
  "amountTTC" NUMERIC,
  "paymentMethod" TEXT,
  "shiftId" TEXT,
  "attendantId" TEXT,
  "saleId" TEXT,
  "userId" TEXT
);

-- Enable RLS for all tables
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'erp_%'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t_name);
        EXECUTE format('
            CREATE POLICY "Users can manage their own data" 
            ON %I 
            FOR ALL 
            USING (auth.uid() = user_id) 
            WITH CHECK (auth.uid() = user_id);
        ', t_name);
    END LOOP;
END
$$;
