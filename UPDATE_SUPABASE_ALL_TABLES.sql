-- Run this script in your Supabase SQL Editor to make the database fully compatible with the application.
-- This script is completely safe and will automatically skip any tables or columns that do not exist yet.

-- 1. DATABASE MIGRATIONS (ADD MISSING COLUMNS IF THE TABLES EXIST)
DO $$
BEGIN
  -- erp_shifts -> endDate
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'erp_shifts') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'erp_shifts' AND column_name = 'endDate') THEN
      EXECUTE 'ALTER TABLE erp_shifts ADD COLUMN "endDate" TEXT';
      RAISE NOTICE 'Added endDate column to erp_shifts';
    END IF;
  END IF;

  -- erp_sales -> endDate
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'erp_sales') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'erp_sales' AND column_name = 'endDate') THEN
      EXECUTE 'ALTER TABLE erp_sales ADD COLUMN "endDate" TEXT';
      RAISE NOTICE 'Added endDate column to erp_sales';
    END IF;
  END IF;

  -- erp_supplies -> endDate
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'erp_supplies') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'erp_supplies' AND column_name = 'endDate') THEN
      EXECUTE 'ALTER TABLE erp_supplies ADD COLUMN "endDate" TEXT';
      RAISE NOTICE 'Added endDate column to erp_supplies';
    END IF;
  END IF;

  -- erp_pumps -> orderIndex
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'erp_pumps') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'erp_pumps' AND column_name = 'orderIndex') THEN
      EXECUTE 'ALTER TABLE erp_pumps ADD COLUMN "orderIndex" TEXT';
      RAISE NOTICE 'Added orderIndex column to erp_pumps';
    END IF;
  END IF;

  -- erp_clients -> payments
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'erp_clients') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'erp_clients' AND column_name = 'payments') THEN
      EXECUTE 'ALTER TABLE erp_clients ADD COLUMN "payments" JSONB';
      RAISE NOTICE 'Added payments column to erp_clients';
    END IF;
  END IF;

  -- erp_suppliers -> payments
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'erp_suppliers') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'erp_suppliers' AND column_name = 'payments') THEN
      EXECUTE 'ALTER TABLE erp_suppliers ADD COLUMN "payments" JSONB';
      RAISE NOTICE 'Added payments column to erp_suppliers';
    END IF;
  END IF;
END $$;


-- 2. ROW-LEVEL SECURITY (RLS) POLICIES FOR ALL EXISTENT TABLES
-- This ensures that users can read, write, update, and delete their own data successfully.
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'erp_products', 'erp_tanks', 'erp_pumps', 'erp_nozzles', 'erp_attendants', 
    'erp_shifts', 'erp_sales', 'erp_supplies', 'erp_stock_corrections', 
    'erp_audit_logs', 'erp_alerts', 'erp_users', 'erp_suppliers', 'erp_clients', 
    'erp_purchase_invoices', 'erp_sales_invoices', 'erp_rich_documents', 
    'erp_delivery_invoices', 'erp_shop_products', 'erp_cash_registry', 'erp_config'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      -- Enable RLS
      EXECUTE 'ALTER TABLE ' || quote_ident(tbl) || ' ENABLE ROW LEVEL SECURITY';
      
      -- Drop existing policies if any to prevent duplicates/errors
      EXECUTE 'DROP POLICY IF EXISTS "Allow select for owner on ' || quote_ident(tbl) || '" ON ' || quote_ident(tbl);
      EXECUTE 'DROP POLICY IF EXISTS "Allow insert for owner on ' || quote_ident(tbl) || '" ON ' || quote_ident(tbl);
      EXECUTE 'DROP POLICY IF EXISTS "Allow update for owner on ' || quote_ident(tbl) || '" ON ' || quote_ident(tbl);
      EXECUTE 'DROP POLICY IF EXISTS "Allow delete for owner on ' || quote_ident(tbl) || '" ON ' || quote_ident(tbl);
      
      -- Create new policies
      EXECUTE 'CREATE POLICY "Allow select for owner on ' || quote_ident(tbl) || '" ON ' || quote_ident(tbl) || ' FOR SELECT TO authenticated USING (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Allow insert for owner on ' || quote_ident(tbl) || '" ON ' || quote_ident(tbl) || ' FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Allow update for owner on ' || quote_ident(tbl) || '" ON ' || quote_ident(tbl) || ' FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Allow delete for owner on ' || quote_ident(tbl) || '" ON ' || quote_ident(tbl) || ' FOR DELETE TO authenticated USING (auth.uid() = user_id)';
      
      RAISE NOTICE 'Successfully configured RLS and owner policies for table: %', tbl;
    ELSE
      RAISE NOTICE 'Table % does not exist in schema, skipping configuration.', tbl;
    END IF;
  END LOOP;
END $$;
