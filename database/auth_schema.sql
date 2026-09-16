-- ==============================================================================
-- MASCO INDUSTRIES LIMITED - AUTHENTICATION & MULTI-TIER RBAC SCHEMA
-- Supabase (PostgreSQL) Database Migration
-- ==============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    mobile VARCHAR(20) NOT NULL UNIQUE,
    pin VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('worker', 'supervisor', 'admin', 'master_admin')),
    supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department VARCHAR(100) DEFAULT 'Commercial Export',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Index for fast mobile lookup during login
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_supervisor ON users(supervisor_id);

-- 2. UPDATE INVOICES TABLE (Add User Attribution & Approval Columns)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='created_by') THEN
        ALTER TABLE invoices ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='supervisor_id') THEN
        ALTER TABLE invoices ADD COLUMN supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='approval_status') THEN
        ALTER TABLE invoices ADD COLUMN approval_status VARCHAR(30) DEFAULT 'PENDING';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='approved_by') THEN
        ALTER TABLE invoices ADD COLUMN approved_by UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. ROW LEVEL SECURITY (RLS) POLICIES FOR USERS TABLE
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert on users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on users" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on users" ON users FOR DELETE USING (true);

-- 4. PRE-SEEDED MULTI-TIER USERS (4 ROLES FOR IMMEDIATE LOGIN)

-- 4.1 Master Admin
INSERT INTO users (id, name, mobile, pin, role, department)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    'Fayzar IT Master Admin',
    '01611000004',
    '9999',
    'master_admin',
    'Systems & Architecture'
) ON CONFLICT (mobile) DO UPDATE 
SET pin = EXCLUDED.pin, name = EXCLUDED.name, role = EXCLUDED.role;

-- 4.2 Company Admin
INSERT INTO users (id, name, mobile, pin, role, department)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Masco Commercial Admin',
    '01911000003',
    '3456',
    'admin',
    'Commercial Management'
) ON CONFLICT (mobile) DO UPDATE 
SET pin = EXCLUDED.pin, name = EXCLUDED.name, role = EXCLUDED.role;

-- 4.3 Supervisor
INSERT INTO users (id, name, mobile, pin, role, department)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Kamrul Hasan - Floor Supervisor',
    '01811000002',
    '2345',
    'supervisor',
    'Export Operations'
) ON CONFLICT (mobile) DO UPDATE 
SET pin = EXCLUDED.pin, name = EXCLUDED.name, role = EXCLUDED.role;

-- 4.4 Worker 1 (Assigned to Supervisor Kamrul Hasan)
INSERT INTO users (id, name, mobile, pin, role, supervisor_id, department)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Md. Rafiqul Islam - Operator',
    '01711000001',
    '1234',
    'worker',
    '22222222-2222-2222-2222-222222222222',
    'Data Entry & Packing'
) ON CONFLICT (mobile) DO UPDATE 
SET pin = EXCLUDED.pin, name = EXCLUDED.name, role = EXCLUDED.role, supervisor_id = EXCLUDED.supervisor_id;

-- 4.5 Worker 2 (Assigned to Supervisor Kamrul Hasan)
INSERT INTO users (id, name, mobile, pin, role, supervisor_id, department)
VALUES (
    '11111111-1111-1111-1111-222222222222',
    'Anisur Rahman - Entry Operator',
    '01711000002',
    '1234',
    'worker',
    '22222222-2222-2222-2222-222222222222',
    'Data Entry & Packing'
) ON CONFLICT (mobile) DO UPDATE 
SET pin = EXCLUDED.pin, name = EXCLUDED.name, role = EXCLUDED.role, supervisor_id = EXCLUDED.supervisor_id;

-- Update existing sample invoice with Worker & Supervisor attribution
UPDATE invoices 
SET 
    created_by = '11111111-1111-1111-1111-111111111111',
    supervisor_id = '22222222-2222-2222-2222-222222222222',
    approval_status = 'APPROVED'
WHERE invoice_no = 'MIL/MS/1205/2026';
