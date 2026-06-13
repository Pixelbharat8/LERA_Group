-- ===========================================================
-- LERA ACADEMY V1 → V2 MIGRATION SCRIPT
-- ===========================================================
-- Migrates from 41-table single-tenant to 107-table multi-tenant
-- CAUTION: Test on staging first! Creates backup points.
-- ===========================================================

-- STOP! READ THIS BEFORE RUNNING:
-- 1. Backup your database: pg_dump lera > backup_v1_$(date +%Y%m%d).sql
-- 2. Run on STAGING first
-- 3. Verify data integrity
-- 4. Then run on PRODUCTION during off-hours

BEGIN;

-- ===========================================================
-- PHASE 1: BACKUP & VALIDATION
-- ===========================================================

-- Create backup schema with current data
CREATE SCHEMA IF NOT EXISTS backup_v1;

-- Copy critical tables to backup
CREATE TABLE backup_v1.users AS SELECT * FROM users;
CREATE TABLE backup_v1.students AS SELECT * FROM students;
CREATE TABLE backup_v1.teachers AS SELECT * FROM teachers;
CREATE TABLE backup_v1.classes AS SELECT * FROM classes;
CREATE TABLE backup_v1.leads AS SELECT * FROM leads;
CREATE TABLE backup_v1.invoices AS SELECT * FROM invoices;
CREATE TABLE backup_v1.payments AS SELECT * FROM payments;

-- Validation checkpoint
DO $$ 
DECLARE 
    v1_user_count INT;
    backup_user_count INT;
BEGIN
    SELECT COUNT(*) INTO v1_user_count FROM users;
    SELECT COUNT(*) INTO backup_user_count FROM backup_v1.users;
    
    IF v1_user_count != backup_user_count THEN
        RAISE EXCEPTION 'Backup validation failed! User counts do not match.';
    END IF;
    
    RAISE NOTICE 'Backup validation successful. % users backed up.', v1_user_count;
END $$;

-- ===========================================================
-- PHASE 2: CREATE MULTI-TENANT INFRASTRUCTURE
-- ===========================================================

-- =============================
-- A1. TENANTS (Organizations)
-- =============================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    
    -- Subscription & Limits
    subscription_plan VARCHAR(50) DEFAULT 'STANDARD', -- BASIC, STANDARD, PREMIUM, ENTERPRISE
    max_centers INT DEFAULT 10,
    max_students INT DEFAULT 1000,
    max_teachers INT DEFAULT 100,
    max_storage_gb INT DEFAULT 10,
    
    -- Features (JSON)
    features JSONB DEFAULT '{"crm": true, "payments": true, "analytics": false, "ai": false, "sports": false}',
    
    -- Branding
    logo_url TEXT,
    primary_color VARCHAR(20) DEFAULT '#0a1a5c',
    secondary_color VARCHAR(20) DEFAULT '#1e40af',
    custom_domain VARCHAR(255),
    
    -- Contact
    admin_email VARCHAR(255),
    admin_phone VARCHAR(50),
    billing_email VARCHAR(255),
    
    -- Status
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, TRIAL, CANCELLED
    trial_ends_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    
    -- Metadata
    timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    locale VARCHAR(10) DEFAULT 'vi_VN',
    currency VARCHAR(10) DEFAULT 'VND',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- =============================
-- A2. TENANT SETTINGS
-- =============================
CREATE TABLE IF NOT EXISTS tenant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text', -- text, number, boolean, json
    category VARCHAR(50), -- general, billing, notifications, integrations
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, setting_key)
);

-- =============================
-- A3. USER_ROLES (Many-to-Many)
-- =============================
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id),
    tenant_id UUID REFERENCES tenants(id),
    granted_at TIMESTAMP DEFAULT NOW(),
    granted_by UUID REFERENCES users(id),
    expires_at TIMESTAMP,
    UNIQUE(user_id, role_id, center_id, tenant_id)
);

-- =============================
-- A4. IMPERSONATION LOGS
-- =============================
CREATE TABLE IF NOT EXISTS impersonation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    impersonator_id UUID REFERENCES users(id),
    impersonated_user_id UUID REFERENCES users(id),
    tenant_id UUID REFERENCES tenants(id),
    reason TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

-- =============================
-- A5. ACTIVITY LOGS
-- =============================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    activity_type VARCHAR(50) NOT NULL, -- login, logout, create, update, delete, view
    entity_type VARCHAR(100),
    entity_id UUID,
    description TEXT,
    metadata JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_tenant ON activity_logs(tenant_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_date ON activity_logs(created_at);

-- =============================
-- A6. LOGIN HISTORY
-- =============================
CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    tenant_id UUID REFERENCES tenants(id),
    login_status VARCHAR(20) NOT NULL, -- SUCCESS, FAILED, BLOCKED
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_type VARCHAR(50), -- web, mobile, tablet
    browser VARCHAR(100),
    os VARCHAR(100),
    location_country VARCHAR(100),
    location_city VARCHAR(100),
    failed_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_login_history_user ON login_history(user_id);
CREATE INDEX idx_login_history_tenant ON login_history(tenant_id);
CREATE INDEX idx_login_history_date ON login_history(created_at);

-- ===========================================================
-- PHASE 3: ADD TENANT_ID TO EXISTING TABLES
-- ===========================================================

-- Centers
ALTER TABLE centers ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;

-- Roles
ALTER TABLE roles ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT FALSE;

-- Students
ALTER TABLE students ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE students ADD COLUMN IF NOT EXISTS external_id VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Teachers
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS external_id VARCHAR(100);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.0;

-- Classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS class_code VARCHAR(50);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS enrollment_status VARCHAR(20) DEFAULT 'OPEN';

-- Course Programs
ALTER TABLE course_programs ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE course_programs ADD COLUMN IF NOT EXISTS prerequisites TEXT[];
ALTER TABLE course_programs ADD COLUMN IF NOT EXISTS learning_outcomes TEXT[];

-- Leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_score INT DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP;

-- Invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_link TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_sent_count INT DEFAULT 0;

-- Payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_response JSONB;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_amount DECIMAL(12, 2) DEFAULT 0;

-- Payroll
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS bank_reference VARCHAR(255);

-- Blog Posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Testimonials
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Banners
ALTER TABLE banners ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- CMS Settings
ALTER TABLE cms_settings ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- ===========================================================
-- PHASE 4: MIGRATE DATA TO DEFAULT TENANT
-- ===========================================================

-- Create default LERA tenant
INSERT INTO tenants (
    code, name, slug, 
    subscription_plan, max_centers, max_students, max_teachers,
    features, admin_email, status
) VALUES (
    'LERA', 
    'LERA Academy', 
    'lera',
    'PREMIUM',
    100,
    50000,
    1000,
    '{"crm": true, "payments": true, "analytics": true, "ai": true, "sports": true, "website": true}'::jsonb,
    'admin@lera.com',
    'ACTIVE'
) ON CONFLICT (code) DO NOTHING;

-- Store tenant ID for migration
DO $$
DECLARE
    lera_tenant_id UUID;
BEGIN
    SELECT id INTO lera_tenant_id FROM tenants WHERE code = 'LERA';
    
    -- Update all tables with tenant_id
    UPDATE centers SET tenant_id = lera_tenant_id WHERE tenant_id IS NULL;
    UPDATE users SET tenant_id = lera_tenant_id WHERE tenant_id IS NULL;
    UPDATE students SET tenant_id = lera_tenant_id WHERE tenant_id IS NULL;
    UPDATE teachers SET tenant_id = lera_tenant_id WHERE tenant_id IS NULL;
    UPDATE classes SET tenant_id = lera_tenant_id WHERE tenant_id IS NULL;
    UPDATE course_programs SET tenant_id = lera_tenant_id WHERE tenant_id IS NULL;
    UPDATE leads SET tenant_id = lera_tenant_id WHERE tenant_id IS NULL;
    UPDATE invoices SET tenant_id = lera_tenant_id WHERE tenant_id IS NULL;
    UPDATE payments SET tenant_id = lera_tenant_id WHERE tenant_id IS NULL;
    UPDATE payroll SET tenant_id = lera_tenant_id WHERE tenant_id IS NULL;
    UPDATE blog_posts SET tenant_id = lera_tenant_id WHERE tenant_id IS NULL;
    UPDATE testimonials SET tenant_id = lera_tenant_id WHERE tenant_id IS NULL;
    UPDATE banners SET tenant_id = lera_tenant_id WHERE tenant_id IS NULL;
    UPDATE cms_settings SET tenant_id = lera_tenant_id WHERE tenant_id IS NULL;
    
    -- Migrate user roles
    INSERT INTO user_roles (user_id, role_id, center_id, tenant_id, granted_at)
    SELECT id, role_id, center_id, lera_tenant_id, created_at
    FROM users
    WHERE role_id IS NOT NULL
    ON CONFLICT DO NOTHING;
    
    -- Make system roles global
    UPDATE roles SET is_global = TRUE WHERE is_system_role = TRUE;
    UPDATE roles SET tenant_id = lera_tenant_id WHERE is_system_role = FALSE;
    
    RAISE NOTICE 'Data migration to LERA tenant completed successfully.';
END $$;

-- Add NOT NULL constraints after data migration
ALTER TABLE centers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE students ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE teachers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE classes ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE course_programs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE leads ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE invoices ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE payroll ALTER COLUMN tenant_id SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE centers ADD CONSTRAINT fk_centers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE users ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE students ADD CONSTRAINT fk_students_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE teachers ADD CONSTRAINT fk_teachers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE classes ADD CONSTRAINT fk_classes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE course_programs ADD CONSTRAINT fk_course_programs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE leads ADD CONSTRAINT fk_leads_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE payments ADD CONSTRAINT fk_payments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE payroll ADD CONSTRAINT fk_payroll_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- ===========================================================
-- PHASE 5: CREATE NEW V2 TABLES (Continued in next part...)
-- ===========================================================

-- Due to size, splitting into multiple files
-- See: migration_v1_to_v2_part2.sql for remaining tables

COMMIT;

-- ===========================================================
-- VALIDATION QUERIES
-- ===========================================================

-- Verify tenant migration
SELECT 'Tenants Created' as check_name, COUNT(*) as count FROM tenants;
SELECT 'Centers with Tenant' as check_name, COUNT(*) as count FROM centers WHERE tenant_id IS NOT NULL;
SELECT 'Users with Tenant' as check_name, COUNT(*) as count FROM users WHERE tenant_id IS NOT NULL;
SELECT 'Students with Tenant' as check_name, COUNT(*) as count FROM students WHERE tenant_id IS NOT NULL;

-- Verify no data loss
DO $$
DECLARE
    v1_count INT;
    v2_count INT;
BEGIN
    SELECT COUNT(*) INTO v1_count FROM backup_v1.users;
    SELECT COUNT(*) INTO v2_count FROM users;
    
    IF v1_count = v2_count THEN
        RAISE NOTICE '✅ User migration successful: % users', v2_count;
    ELSE
        RAISE WARNING '⚠️  User count mismatch: V1=%, V2=%', v1_count, v2_count;
    END IF;
END $$;
