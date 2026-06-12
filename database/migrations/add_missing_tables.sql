-- =====================================================
-- LERA Migration: Add Missing Tables
-- Run this on your PostgreSQL database to add tables
-- that are missing from the original schema
-- =====================================================

-- DEPARTMENTS TABLE (used by identity_service)
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_code VARCHAR(50) UNIQUE NOT NULL,
    department_name VARCHAR(200) NOT NULL,
    department_name_vi VARCHAR(200),
    department_type VARCHAR(50) NOT NULL,
    parent_department_id UUID REFERENCES departments(id),
    center_id UUID REFERENCES centers(id),
    office_type VARCHAR(50) NOT NULL DEFAULT 'MAIN_OFFICE',
    manager_id UUID REFERENCES users(id),
    description TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- STUDENT DISCOUNTS (used by payment_service)
CREATE TABLE IF NOT EXISTS student_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    discount_id UUID REFERENCES discounts(id),
    discount_name VARCHAR(200),
    discount_type VARCHAR(50),
    discount_value DECIMAL(10, 2),
    reason TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- STUDENT FEE PLANS (used by payment_service)
CREATE TABLE IF NOT EXISTS student_fee_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    plan_name VARCHAR(200),
    total_amount DECIMAL(15, 2),
    installments INT,
    installment_amount DECIMAL(10, 2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- STUDENT SCHOLARSHIPS (used by payment_service)
CREATE TABLE IF NOT EXISTS student_scholarships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    scholarship_id UUID REFERENCES scholarships(id),
    scholarship_name VARCHAR(200),
    amount DECIMAL(15, 2),
    percentage DECIMAL(5, 2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- REFUNDS (used by payment_service)
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    reason TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    processed_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- LEDGER ENTRIES (used by payment_service)
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    center_id UUID REFERENCES centers(id),
    entry_type VARCHAR(50) NOT NULL,
    description TEXT,
    debit_amount DECIMAL(15, 2) DEFAULT 0,
    credit_amount DECIMAL(15, 2) DEFAULT 0,
    balance DECIMAL(15, 2) DEFAULT 0,
    reference_type VARCHAR(50),
    reference_id UUID,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- LATE FEE RULES (used by payment_service)
CREATE TABLE IF NOT EXISTS late_fee_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    grace_period_days INT DEFAULT 0,
    fee_type VARCHAR(50) DEFAULT 'FIXED',
    fee_amount DECIMAL(10, 2),
    fee_percentage DECIMAL(5, 2),
    max_fee DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- SYSTEM SETTINGS (used by identity_service)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'STRING',
    category VARCHAR(100),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to existing tables
ALTER TABLE departments ADD COLUMN IF NOT EXISTS department_name_vi VARCHAR(200);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_departments_center ON departments(center_id);
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);
CREATE INDEX IF NOT EXISTS idx_student_discounts_student ON student_discounts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_plans_student ON student_fee_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_center ON ledger_entries(center_id);

-- Done
SELECT 'Migration completed successfully' AS status;
