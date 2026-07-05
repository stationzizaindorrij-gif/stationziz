-- Fichier SQL Complet pour Supabase SaaS (Copiez ce code et collez-le dans le SQL Editor de Supabase)
-- Exécutez le script en une seule fois.

-- 1. Produits
CREATE TABLE IF NOT EXISTS erp_products (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  type TEXT,
  "purchasePrice" NUMERIC,
  "salePrice" NUMERIC,
  "vatRate" NUMERIC,
  status TEXT
);
ALTER TABLE erp_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_products_policy" ON erp_products FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Cuves (Tanks)
CREATE TABLE IF NOT EXISTS erp_tanks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
ALTER TABLE erp_tanks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_tanks_policy" ON erp_tanks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Pompes (Pumps)
CREATE TABLE IF NOT EXISTS erp_pumps (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number TEXT,
  manufacturer TEXT,
  "serialNumber" TEXT,
  status TEXT
);
ALTER TABLE erp_pumps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_pumps_policy" ON erp_pumps FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Pistolets (Nozzles)
CREATE TABLE IF NOT EXISTS erp_nozzles (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
ALTER TABLE erp_nozzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_nozzles_policy" ON erp_nozzles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Pompistes (Attendants)
CREATE TABLE IF NOT EXISTS erp_attendants (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "firstName" TEXT,
  "lastName" TEXT,
  phone TEXT,
  matricule TEXT,
  "hireDate" TEXT,
  status TEXT,
  notes TEXT
);
ALTER TABLE erp_attendants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_attendants_policy" ON erp_attendants FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Shifts
CREATE TABLE IF NOT EXISTS erp_shifts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
ALTER TABLE erp_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_shifts_policy" ON erp_shifts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Ventes (Sales)
CREATE TABLE IF NOT EXISTS erp_sales (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
ALTER TABLE erp_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_sales_policy" ON erp_sales FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Approvisionnements (Supplies)
CREATE TABLE IF NOT EXISTS erp_supplies (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
ALTER TABLE erp_supplies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_supplies_policy" ON erp_supplies FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. Caisse (Cash Registry)
CREATE TABLE IF NOT EXISTS erp_cash_registry (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
ALTER TABLE erp_cash_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_cash_registry_policy" ON erp_cash_registry FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. Corrections de Stock
CREATE TABLE IF NOT EXISTS erp_stock_corrections (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT,
  "tankId" TEXT,
  "tankNumber" TEXT,
  "productId" TEXT,
  "qtyBefore" NUMERIC,
  "qtyAfter" NUMERIC,
  reason TEXT,
  "user" TEXT
);
ALTER TABLE erp_stock_corrections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_stock_corrections_policy" ON erp_stock_corrections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11. Logs d'Audit
CREATE TABLE IF NOT EXISTS erp_audit_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT,
  time TEXT,
  "user" TEXT,
  action TEXT,
  module TEXT,
  details TEXT
);
ALTER TABLE erp_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_audit_logs_policy" ON erp_audit_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 12. Alertes
CREATE TABLE IF NOT EXISTS erp_alerts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT,
  severity TEXT,
  message TEXT,
  "isRead" BOOLEAN,
  type TEXT
);
ALTER TABLE erp_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_alerts_policy" ON erp_alerts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 13. Utilisateurs (Membres d'équipe)
CREATE TABLE IF NOT EXISTS erp_users (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role TEXT,
  status TEXT
);
ALTER TABLE erp_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_users_policy" ON erp_users FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 14. Configuration SaaS
CREATE TABLE IF NOT EXISTS erp_config (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
ALTER TABLE erp_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_config_policy" ON erp_config FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 15. Fournisseurs
CREATE TABLE IF NOT EXISTS erp_suppliers (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  ice TEXT,
  contact TEXT,
  notes TEXT
);
ALTER TABLE erp_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_suppliers_policy" ON erp_suppliers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 16. Clients
CREATE TABLE IF NOT EXISTS erp_clients (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  ice TEXT,
  contact TEXT,
  notes TEXT
);
ALTER TABLE erp_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_clients_policy" ON erp_clients FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 17. Factures d'Achat
CREATE TABLE IF NOT EXISTS erp_purchase_invoices (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
ALTER TABLE erp_purchase_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_purchase_invoices_policy" ON erp_purchase_invoices FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 18. Factures de Vente
CREATE TABLE IF NOT EXISTS erp_sales_invoices (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
ALTER TABLE erp_sales_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_sales_invoices_policy" ON erp_sales_invoices FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- FIN DU SCRIPT SQL
