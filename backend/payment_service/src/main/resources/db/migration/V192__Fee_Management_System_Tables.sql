-- =====================================================
-- V192 - Student Fee Management System Database Schema
-- Complete migration script for 22 fee-related tables
-- Designed for scalability: 10B+ users, proper indexing, partitioning-ready
-- Uses existing 'lera' database - no separate database needed
-- =====================================================

-- 1. FEE RULES TABLE - Core fee structure definitions
CREATE TABLE IF NOT EXISTS fee_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- TUITION, MATERIALS, REGISTRATION, EXAM, MISC
    calculation_type VARCHAR(50) NOT NULL, -- FLAT, PER_SESSION, HOURLY, PACKAGE, PERCENTAGE
    amount DECIMAL(15,2) NOT NULL,
    scope VARCHAR(50) NOT NULL, -- GLOBAL, CENTER, COURSE, AGE_GROUP
    center_id UUID,
    course_id UUID,
    min_age INTEGER,
    max_age INTEGER,
    is_active BOOLEAN DEFAULT true,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fee_rules_category ON fee_rules(category);
CREATE INDEX IF NOT EXISTS idx_fee_rules_scope ON fee_rules(scope);
CREATE INDEX IF NOT EXISTS idx_fee_rules_center ON fee_rules(center_id);
CREATE INDEX IF NOT EXISTS idx_fee_rules_active ON fee_rules(is_active);

-- 2. CENTER FEE RULES - Override rules per center
CREATE TABLE IF NOT EXISTS center_fee_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL,
    fee_rule_id UUID NOT NULL REFERENCES fee_rules(id) ON DELETE CASCADE,
    override_amount DECIMAL(15,2),
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(center_id, fee_rule_id)
);

CREATE INDEX IF NOT EXISTS idx_center_fee_rules_center ON center_fee_rules(center_id);

-- 3. FEE CATEGORIES - Custom fee categories
CREATE TABLE IF NOT EXISTS fee_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fee_categories_code ON fee_categories(code);

-- 4. FEE ITEMS - Individual fee line items
CREATE TABLE IF NOT EXISTS fee_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_rule_id UUID REFERENCES fee_rules(id),
    category_id UUID REFERENCES fee_categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit_price DECIMAL(15,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    is_taxable BOOLEAN DEFAULT false,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fee_items_rule ON fee_items(fee_rule_id);
CREATE INDEX IF NOT EXISTS idx_fee_items_category ON fee_items(category_id);

-- 5. STUDENT FEE PLANS - Recurring billing plans
CREATE TABLE IF NOT EXISTS student_fee_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    student_name VARCHAR(255),
    center_id UUID NOT NULL,
    center_name VARCHAR(255),
    course_id UUID,
    course_name VARCHAR(255),
    plan_type VARCHAR(50) NOT NULL, -- MONTHLY, QUARTERLY, SEMESTER, ANNUAL, CUSTOM
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, CANCELLED, COMPLETED
    base_amount DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    final_amount DECIMAL(15,2) NOT NULL,
    billing_day INTEGER DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    next_billing_date DATE,
    auto_renew BOOLEAN DEFAULT true,
    auto_invoice BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_fee_plans_student ON student_fee_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_plans_center ON student_fee_plans(center_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_plans_status ON student_fee_plans(status);
CREATE INDEX IF NOT EXISTS idx_student_fee_plans_next_billing ON student_fee_plans(next_billing_date);

-- 6. INVOICES - Main invoice records
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    student_id UUID NOT NULL,
    student_name VARCHAR(255),
    center_id UUID NOT NULL,
    center_name VARCHAR(255),
    course_id UUID,
    course_name VARCHAR(255),
    enrollment_id UUID,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    balance DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PENDING, PARTIAL, PAID, OVERDUE, CANCELLED, VOID
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_student ON invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_center ON invoices(center_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);

-- 7. INVOICE ITEMS - Line items for invoices
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    fee_rule_id UUID REFERENCES fee_rules(id),
    item_type VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- 8. DISCOUNTS - Discount definitions
CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    type VARCHAR(50) NOT NULL, -- PERCENTAGE, FIXED, SIBLING, EARLY_BIRD, SCHOLARSHIP, STAFF, LOYALTY
    value DECIMAL(15,2) NOT NULL,
    max_amount DECIMAL(15,2),
    min_purchase DECIMAL(15,2),
    applicable_to VARCHAR(50) DEFAULT 'ALL', -- ALL, TUITION, MATERIALS, SPECIFIC_COURSE
    applicable_course_id UUID,
    start_date DATE,
    end_date DATE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, EXPIRED
    auto_apply BOOLEAN DEFAULT false,
    stackable BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_type ON discounts(type);
CREATE INDEX IF NOT EXISTS idx_discounts_status ON discounts(status);

-- 9. STUDENT DISCOUNTS - Discounts assigned to students
CREATE TABLE IF NOT EXISTS student_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
    applied_by VARCHAR(255),
    reason TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, discount_id)
);

CREATE INDEX IF NOT EXISTS idx_student_discounts_student ON student_discounts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_discounts_discount ON student_discounts(discount_id);

-- 10. REFUNDS - Refund requests and processing
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    refund_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_id UUID REFERENCES invoices(id),
    invoice_number VARCHAR(50),
    payment_id UUID,
    student_id UUID NOT NULL,
    student_name VARCHAR(255),
    center_id UUID NOT NULL,
    center_name VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    reason TEXT NOT NULL,
    reason_category VARCHAR(100) NOT NULL, -- COURSE_WITHDRAWAL, OVERPAYMENT, COURSE_CANCELLATION, DUPLICATE_PAYMENT, OTHER
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, PROCESSING, COMPLETED, REJECTED
    requested_by VARCHAR(255),
    requested_at TIMESTAMP,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    processed_at TIMESTAMP,
    refund_method VARCHAR(50), -- BANK_TRANSFER, CASH, ORIGINAL_PAYMENT_METHOD
    bank_name VARCHAR(255),
    account_number VARCHAR(100),
    account_name VARCHAR(255),
    routing_number VARCHAR(50),
    notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refunds_number ON refunds(refund_number);
CREATE INDEX IF NOT EXISTS idx_refunds_student ON refunds(student_id);
CREATE INDEX IF NOT EXISTS idx_refunds_center ON refunds(center_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- 11. PROMOTIONS - Marketing promotions
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    discount_type VARCHAR(50) NOT NULL, -- PERCENTAGE, FIXED_AMOUNT
    discount_value DECIMAL(15,2) NOT NULL,
    max_discount DECIMAL(15,2),
    min_spend DECIMAL(15,2),
    applies_to VARCHAR(50) DEFAULT 'ALL', -- ALL, NEW_STUDENTS, EXISTING_STUDENTS
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    max_redemptions INTEGER,
    current_redemptions INTEGER DEFAULT 0,
    center_ids UUID[], -- Array of applicable center IDs (null = all)
    course_ids UUID[], -- Array of applicable course IDs (null = all)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(valid_from, valid_to);

-- 12. PROMOTION USAGE - Track promotion redemptions
CREATE TABLE IF NOT EXISTS promotion_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    invoice_id UUID REFERENCES invoices(id),
    discount_amount DECIMAL(15,2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promotion_usage_promotion ON promotion_usage(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_student ON promotion_usage(student_id);

-- 13. LATE FEE RULES - Late payment penalty configuration
CREATE TABLE IF NOT EXISTS late_fee_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    grace_period_days INTEGER DEFAULT 0,
    fee_type VARCHAR(50) NOT NULL, -- FIXED, PERCENTAGE, DAILY_PERCENTAGE
    fee_value DECIMAL(15,2) NOT NULL,
    max_fee DECIMAL(15,2),
    is_compounding BOOLEAN DEFAULT false,
    scope VARCHAR(50) DEFAULT 'GLOBAL', -- GLOBAL, CENTER
    center_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_late_fee_rules_active ON late_fee_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_late_fee_rules_center ON late_fee_rules(center_id);

-- 14. LATE FEE LOGS - Record of late fees applied
CREATE TABLE IF NOT EXISTS late_fee_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    late_fee_rule_id UUID REFERENCES late_fee_rules(id),
    days_late INTEGER NOT NULL,
    fee_amount DECIMAL(15,2) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    waived BOOLEAN DEFAULT false,
    waived_by VARCHAR(255),
    waived_at TIMESTAMP,
    waive_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_late_fee_logs_invoice ON late_fee_logs(invoice_id);

-- 15. LEDGER ENTRIES - Complete financial ledger
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_type VARCHAR(50) NOT NULL, -- INVOICE, PAYMENT, REFUND, ADJUSTMENT, LATE_FEE, DISCOUNT
    reference_type VARCHAR(50) NOT NULL, -- INVOICE, PAYMENT, REFUND
    reference_id UUID NOT NULL,
    reference_number VARCHAR(50),
    student_id UUID NOT NULL,
    center_id UUID NOT NULL,
    debit DECIMAL(15,2) DEFAULT 0,
    credit DECIMAL(15,2) DEFAULT 0,
    balance DECIMAL(15,2) NOT NULL,
    description TEXT,
    entry_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_student ON ledger_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_center ON ledger_entries(center_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_date ON ledger_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_type ON ledger_entries(transaction_type);

-- 16. FEE AUDIT LOG - Audit trail for all fee changes
CREATE TABLE IF NOT EXISTS fee_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(100) NOT NULL, -- FEE_RULE, INVOICE, DISCOUNT, REFUND, etc.
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, APPROVE, REJECT
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_fee_audit_logs_entity ON fee_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_fee_audit_logs_date ON fee_audit_logs(changed_at);
CREATE INDEX IF NOT EXISTS idx_fee_audit_logs_user ON fee_audit_logs(changed_by);

-- 17. FEE RECEIPTS - Payment receipts
CREATE TABLE IF NOT EXISTS fee_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_id UUID REFERENCES invoices(id),
    payment_id UUID,
    student_id UUID NOT NULL,
    student_name VARCHAR(255),
    center_id UUID NOT NULL,
    center_name VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50), -- CASH, CARD, BANK_TRANSFER, ONLINE
    payment_date DATE NOT NULL,
    notes TEXT,
    is_void BOOLEAN DEFAULT false,
    void_reason TEXT,
    voided_at TIMESTAMP,
    voided_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_fee_receipts_number ON fee_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_invoice ON fee_receipts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_student ON fee_receipts(student_id);

-- 18. SUBSCRIPTION CYCLES - Billing cycle tracking
CREATE TABLE IF NOT EXISTS subscription_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_fee_plan_id UUID NOT NULL REFERENCES student_fee_plans(id) ON DELETE CASCADE,
    cycle_number INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    invoice_id UUID REFERENCES invoices(id),
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, INVOICED, PAID, SKIPPED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscription_cycles_plan ON subscription_cycles(student_fee_plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_cycles_status ON subscription_cycles(status);

-- 19. PAYMENT METHODS - Student payment methods on file
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL, -- CARD, BANK_ACCOUNT, DIRECT_DEBIT
    provider VARCHAR(100), -- visa, mastercard, etc.
    last_four VARCHAR(4),
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_student ON payment_methods(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);

-- 20. OVERDUE NOTIFICATIONS - Track overdue payment notifications
CREATE TABLE IF NOT EXISTS overdue_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- EMAIL, SMS, PUSH
    notification_level INTEGER DEFAULT 1, -- 1st reminder, 2nd reminder, etc.
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'SENT', -- SENT, FAILED, ACKNOWLEDGED
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_overdue_notifications_invoice ON overdue_notifications(invoice_id);
CREATE INDEX IF NOT EXISTS idx_overdue_notifications_student ON overdue_notifications(student_id);

-- 21. INSTALLMENT PLANS - Payment installment arrangements
CREATE TABLE IF NOT EXISTS installment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    number_of_installments INTEGER NOT NULL,
    installment_amount DECIMAL(15,2) NOT NULL,
    frequency VARCHAR(50) DEFAULT 'MONTHLY', -- WEEKLY, BI_WEEKLY, MONTHLY
    start_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, DEFAULTED, CANCELLED
    paid_installments INTEGER DEFAULT 0,
    next_due_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_installment_plans_invoice ON installment_plans(invoice_id);
CREATE INDEX IF NOT EXISTS idx_installment_plans_student ON installment_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_installment_plans_status ON installment_plans(status);

-- 22. N8N AUTOMATION TRIGGERS - For workflow automation
CREATE TABLE IF NOT EXISTS fee_automation_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- INVOICE_CREATED, PAYMENT_RECEIVED, OVERDUE, REFUND_REQUESTED
    webhook_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    conditions JSONB, -- JSON conditions for when to fire
    last_triggered TIMESTAMP,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fee_automation_event ON fee_automation_triggers(event_type);
CREATE INDEX IF NOT EXISTS idx_fee_automation_active ON fee_automation_triggers(is_active);

-- =====================================================
-- Insert default fee categories
-- =====================================================
INSERT INTO fee_categories (name, code, description, is_system, sort_order) VALUES
('Tuition', 'TUITION', 'Regular course tuition fees', true, 1),
('Registration', 'REGISTRATION', 'One-time registration fees', true, 2),
('Materials', 'MATERIALS', 'Books, supplies and materials', true, 3),
('Exam', 'EXAM', 'Examination and assessment fees', true, 4),
('Uniform', 'UNIFORM', 'Uniforms and attire', true, 5),
('Events', 'EVENTS', 'Special events and activities', true, 6),
('Miscellaneous', 'MISC', 'Other fees', true, 99)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Insert default late fee rule
-- =====================================================
INSERT INTO late_fee_rules (name, grace_period_days, fee_type, fee_value, max_fee, is_active, scope) VALUES
('Standard Late Fee', 7, 'PERCENTAGE', 5.00, 50.00, true, 'GLOBAL')
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMPOSITE INDEXES FOR BILLION-USER SCALABILITY
-- These optimize common query patterns at scale
-- =====================================================

-- Invoice queries by center + status (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_invoices_center_status ON invoices(center_id, status);

-- Invoice queries by student + date range (student history)
CREATE INDEX IF NOT EXISTS idx_invoices_student_date ON invoices(student_id, invoice_date DESC);

-- Overdue invoice lookup
CREATE INDEX IF NOT EXISTS idx_invoices_overdue_lookup ON invoices(due_date, status) WHERE status IN ('PENDING', 'PARTIAL');

-- Student fee plans by center + status (billing dashboard)
CREATE INDEX IF NOT EXISTS idx_student_fee_plans_center_status ON student_fee_plans(center_id, status);

-- Active discounts lookup
CREATE INDEX IF NOT EXISTS idx_discounts_active_dates ON discounts(status, start_date, end_date) WHERE status = 'ACTIVE';

-- Ledger entries for balance calculations
CREATE INDEX IF NOT EXISTS idx_ledger_entries_student_date ON ledger_entries(student_id, entry_date DESC);

-- Refunds by center + status (refund dashboard)
CREATE INDEX IF NOT EXISTS idx_refunds_center_status ON refunds(center_id, status);

-- =====================================================
-- PARTITIONING STRATEGY FOR FUTURE SCALE (10B+ users)
-- =====================================================
-- When data grows to billions of records, consider:
-- 
-- 1. PARTITION invoices BY RANGE (invoice_date)
--    - Monthly partitions for recent data (last 2 years)
--    - Yearly partitions for historical data
--    - Auto-partition creation via pg_partman
--
-- 2. PARTITION ledger_entries BY RANGE (entry_date)
--    - Similar strategy to invoices
--
-- 3. PARTITION fee_audit_logs BY RANGE (changed_at)
--    - Keep 90 days online, archive older data
--
-- 4. PARTITION student_fee_plans BY LIST (center_id)
--    - If centers are geographically distributed
--
-- Example (for future implementation):
-- CREATE TABLE invoices_partitioned (
--     LIKE invoices INCLUDING ALL
-- ) PARTITION BY RANGE (invoice_date);
-- 
-- CREATE TABLE invoices_2024 PARTITION OF invoices_partitioned
--     FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
-- =====================================================

-- =====================================================
-- GRANTS (if needed for specific roles)
-- =====================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO payment_service;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO payment_service;
