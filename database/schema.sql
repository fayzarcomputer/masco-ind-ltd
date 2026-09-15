-- ==============================================================================
-- MASCO INDUSTRIES LIMITED - COMMERCIAL EXPORT INVOICING SYSTEM
-- Database Schema for Supabase (PostgreSQL)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- ------------------------------------------------------------------------------
-- 1. CLIENTS TABLE (Buyers / Importers / Consignees)
-- ------------------------------------------------------------------------------
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_name VARCHAR(255) NOT NULL,
    office_address TEXT NOT NULL,
    country VARCHAR(100) NOT NULL,
    notify_party TEXT,
    buyer_bank_name VARCHAR(255),
    buyer_bank_branch VARCHAR(255),
    buyer_bank_swift VARCHAR(50),
    buyer_bank_account VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 2. INVOICES TABLE (Master Commercial Invoice Record)
-- ------------------------------------------------------------------------------
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_no VARCHAR(100) NOT NULL UNIQUE,          -- e.g. MIL/MS/1205/2026
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    exp_no VARCHAR(100),                              -- e.g. 0216-023253-2026
    exp_date DATE,
    sc_no VARCHAR(100),                               -- e.g. MS26/5002-SS27
    sc_date DATE,
    client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
    
    -- Exporter Details (MASCO INDUSTRIES LIMITED)
    exporter_name VARCHAR(255) NOT NULL DEFAULT 'MASCO INDUSTRIES LIMITED',
    factory_address TEXT NOT NULL DEFAULT '221-223, KHARTAIL, SHATAISH ROAD, TONGI, GAZIPUR-1712, BANGLADESH',
    corporate_office TEXT NOT NULL DEFAULT 'Arhams (5th Floor), Plot-79, Sector-07, Dhaka-Mymensingh Highway, Uttara, Dhaka-1230',
    contact_phone VARCHAR(100) DEFAULT '(+8802) 58194130 & 58954134, FAX: 8293126',
    country_of_origin VARCHAR(100) DEFAULT 'BANGLADESH',

    -- Shipper / Negotiating Bank (Pubali Bank PLC)
    shipper_bank_name VARCHAR(255) DEFAULT 'PUBALI BANK PLC.',
    shipper_bank_branch VARCHAR(255) DEFAULT 'MOHAKHALI CORPORATE BRANCH, 4, MOHAKHALI C/A, DHAKA-1212, BANGLADESH.',
    shipper_bank_swift VARCHAR(50) DEFAULT 'PUBABDDH216',
    shipper_account_no VARCHAR(100) DEFAULT '3678901000862',

    -- Buyer Bank (Snapshot)
    buyer_bank_name VARCHAR(255),
    buyer_bank_address TEXT,
    buyer_bank_swift VARCHAR(50),
    buyer_bank_account VARCHAR(100),

    -- Registration & Trade Compliance Numbers
    e_tin_no VARCHAR(50) DEFAULT '860718316349',
    bin_no VARCHAR(50) DEFAULT '000188391-0102',
    erc_no VARCHAR(50) DEFAULT '260326210535120',
    incoterm VARCHAR(50) DEFAULT 'FOB, CHITTAGONG',
    currency VARCHAR(10) DEFAULT 'USD',

    -- Shipping & Logistics Info
    port_of_loading VARCHAR(100) DEFAULT 'CHITTAGONG, BANGLADESH',
    mode_of_shipment VARCHAR(50) DEFAULT 'BY SEA',
    port_of_discharge VARCHAR(150) DEFAULT 'Khorgos-Almaty, Kazakistan',
    consignment_no VARCHAR(100),
    booking_no VARCHAR(100),
    bill_of_entry_no VARCHAR(100),
    bill_of_entry_date DATE,
    shipping_marks TEXT DEFAULT 'MAIN MARK BRAND : N/M\nSUPPLIER PO # BULK SPEC.\nSTYLE COLOR Q-TY SIZE\nDESCRIPTION MEAS NET WEIGHT\nGROSS WEIGHT CARTON NO DESTINATION',

    -- Totals Summary
    total_carton INTEGER NOT NULL DEFAULT 0,
    total_pcs INTEGER NOT NULL DEFAULT 0,
    total_gross_weight NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_net_weight NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_cbm NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    
    status VARCHAR(50) NOT NULL DEFAULT 'ISSUED',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 3. INVOICE ITEMS TABLE (Line Items)
-- ------------------------------------------------------------------------------
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    order_no VARCHAR(100) NOT NULL,                   -- e.g. BLSS2700058652BN (PO Number)
    item_ref VARCHAR(100) NOT NULL,                   -- e.g. 152415 (Style No)
    production_description TEXT NOT NULL,             -- e.g. Women's T-shirt
    hs_code VARCHAR(50) NOT NULL DEFAULT '610910',
    color_spec VARCHAR(50),                           -- e.g. BB (black), AA (grey)
    total_carton INTEGER NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,              -- Total Pcs
    gross_weight NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_weight NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cbm NUMERIC(10, 3) NOT NULL DEFAULT 0.000,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    line_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 4. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX idx_invoices_no ON invoices(invoice_no);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_exp ON invoices(exp_no);
CREATE INDEX idx_invoice_items_inv ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_order ON invoice_items(order_no);
CREATE INDEX idx_invoice_items_ref ON invoice_items(item_ref);

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow public insert on clients" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on clients" ON clients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on clients" ON clients FOR DELETE USING (true);

CREATE POLICY "Allow public read on invoices" ON invoices FOR SELECT USING (true);
CREATE POLICY "Allow public insert on invoices" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on invoices" ON invoices FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on invoices" ON invoices FOR DELETE USING (true);

CREATE POLICY "Allow public read on invoice_items" ON invoice_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on invoice_items" ON invoice_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on invoice_items" ON invoice_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on invoice_items" ON invoice_items FOR DELETE USING (true);

-- ------------------------------------------------------------------------------
-- 6. REAL SEED DATA (MASCO INDUSTRIES LIMITED & MALACCA SOURCING)
-- ------------------------------------------------------------------------------

-- Client: MALACCA SOURCING PTE. LTD.
INSERT INTO clients (
    id, applicant_name, office_address, country, notify_party,
    buyer_bank_name, buyer_bank_branch, buyer_bank_swift, buyer_bank_account
) VALUES (
    'm1111111-1111-1111-1111-111111111111',
    'MALACCA SOURCING PTE. LTD.,',
    '6 SHENTON WAY, #18-10, OUE DOWNTOWN, SINGAPORE 068809',
    'SINGAPORE',
    'MALACCA SOURCING PTE. LTD.,\n6 SHENTON WAY, #18-10, OUE DOWNTOWN, SINGAPORE 068809',
    'DBS Bank Limited',
    '12 Marina Boulevard, Marina Bay Financial Centre Tower 3, Singapore 018982',
    'DBSSSGSG',
    'USD Account No.: 0729034931'
);

-- Master Invoice: MIL/MS/1205/2026
INSERT INTO invoices (
    id, invoice_no, invoice_date, exp_no, exp_date, sc_no, sc_date, client_id,
    exporter_name, factory_address, corporate_office, contact_phone, country_of_origin,
    shipper_bank_name, shipper_bank_branch, shipper_bank_swift, shipper_account_no,
    buyer_bank_name, buyer_bank_address, buyer_bank_swift, buyer_bank_account,
    e_tin_no, bin_no, erc_no, incoterm, currency,
    port_of_loading, mode_of_shipment, port_of_discharge,
    shipping_marks,
    total_carton, total_pcs, total_gross_weight, total_net_weight, total_cbm,
    total_amount, status
) VALUES (
    'd1205000-0000-0000-0000-000000001205',
    'MIL/MS/1205/2026',
    '2026-09-12',
    '0216-023253-2026',
    '2026-09-12',
    'MS26/5002-SS27',
    '2026-04-10',
    'm1111111-1111-1111-1111-111111111111',
    'MASCO INDUSTRIES LIMITED',
    '221-223, KHARTAIL, SHATAISH ROAD, TONGI, GAZIPUR-1712, BANGLADESH',
    'Arhams (5th Floor), Plot-79, Sector-07, Dhaka-Mymensingh Highway, Uttara, Dhaka-1230',
    'TEL :(+8802)58194130 & 58954134, FAX: 8293126',
    'BANGLADESH',
    'PUBALI BANK PLC.',
    'MOHAKHALI CORPORATE BRANCH, 4, MOHAKHALI C/A, DHAKA-1212, BANGLADESH.',
    'PUBABDDH216',
    '3678901000862',
    'DBS Bank Limited',
    '12 Marina Boulevard, Marina Bay Financial Centre Tower 3, Singapore 018982',
    'DBSSSGSG',
    '0729034931',
    '860718316349',
    '000188391-0102',
    '260326210535120',
    'FOB, CHITTAGONG',
    'USD',
    'CHITTAGONG, BANGLADESH',
    'BY SEA',
    'Khorgos-Almaty, Kazakistan',
    'MAIN MARK BRAND : N/M\nSUPPLIER PO # BULK SPEC.\nSTYLE COLOR Q-TY SIZE\nDESCRIPTION MEAS NET WEIGHT\nGROSS WEIGHT CARTON NO DESTINATION',
    22,
    1002,
    225.90,
    196.77,
    1.023,
    3086.16,
    'ISSUED'
);

-- Invoice Line Items (From exact invoice & Excel sheet)
INSERT INTO invoice_items (
    invoice_id, order_no, item_ref, production_description, hs_code, color_spec,
    total_carton, quantity, gross_weight, net_weight, cbm, unit_price, line_amount
) VALUES 
(
    'd1205000-0000-0000-0000-000000001205',
    'BLSS2700058652BN',
    '152415',
    'Women''s T-shirt',
    '610910',
    'BB (black)',
    9,
    405,
    88.68,
    77.12,
    0.410,
    3.08,
    1247.40
),
(
    'd1205000-0000-0000-0000-000000001205',
    'BLSS2700058658ML',
    '152415',
    'Women''s T-shirt',
    '610910',
    'AA (grey)',
    3,
    140,
    31.21,
    26.91,
    0.153,
    3.08,
    431.20
),
(
    'd1205000-0000-0000-0000-000000001205',
    'BLSS2700058664BN',
    '152415',
    'Women''s T-shirt',
    '610910',
    '',
    7,
    317,
    73.28,
    64.31,
    0.307,
    3.08,
    976.36
),
(
    'd1205000-0000-0000-0000-000000001205',
    'BLSS2700058670ML',
    '152415',
    'Women''s T-shirt',
    '610910',
    '',
    3,
    140,
    32.73,
    28.43,
    0.153,
    3.08,
    431.20
);
