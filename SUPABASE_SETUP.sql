-- ====================================================================
-- SUPABASE SETUP SCRIPT FOR STATION ERP
-- Run this script in your Supabase SQL Editor (https://supabase.com)
-- ====================================================================

-- 1. Create or repair the configuration table (erp_config)
-- This ensures all custom settings (including logos, footer texts, colors, custom parameters) sync perfectly.
CREATE TABLE IF NOT EXISTS erp_config (
    user_id UUID PRIMARY KEY,
    name TEXT,
    logo TEXT,
    address TEXT,
    phone TEXT,
    taxid TEXT,
    autobackup BOOLEAN DEFAULT true,
    language TEXT DEFAULT 'fr',
    theme TEXT DEFAULT 'light',
    printerip TEXT,
    iotconfigured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) on erp_config
ALTER TABLE erp_config ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to manage their own configurations
DROP POLICY IF EXISTS "Users can manage their own erp_config" ON erp_config;
CREATE POLICY "Users can manage their own erp_config" 
    ON erp_config 
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);


-- 2. Create the rich documents table (erp_rich_documents)
-- This table stores all custom Devis, Invoices, BLs, and supplier receipts.
CREATE TABLE IF NOT EXISTS erp_rich_documents (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
    doctype TEXT,
    document_number TEXT,
    partner_id TEXT,
    partner_name TEXT,
    date TEXT,
    due_date TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    amount_ht NUMERIC DEFAULT 0,
    vat_amount NUMERIC DEFAULT 0,
    amount_ttc NUMERIC DEFAULT 0,
    payment_method TEXT,
    mixed_payments JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    terms TEXT,
    status TEXT,
    history_logs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) on erp_rich_documents
ALTER TABLE erp_rich_documents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to manage their own commercial documents
DROP POLICY IF EXISTS "Users can manage their own erp_rich_documents" ON erp_rich_documents;
CREATE POLICY "Users can manage their own erp_rich_documents" 
    ON erp_rich_documents 
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);
