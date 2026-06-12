-- =====================================================
-- LERA Payment Service - Seed Data
-- =====================================================
-- This file creates initial data for payments, invoices, fee rules, discounts, scholarships
-- Uses PostgreSQL ON CONFLICT for upsert operations

-- =====================================================
-- FEE_RULES (Fee structures for courses)
-- =====================================================
INSERT INTO fee_rules (id, name, description, category, calculation_type, amount, scope, center_id, is_active, effective_from, created_at, updated_at)
VALUES 
    ('f0000000-0000-0000-0000-000000000001', 'LERA Starters Monthly', 'Monthly fee for LERA Starters program (Ages 2-4)', 'TUITION', 'FIXED', 2500000, 'PROGRAM', 'c0000000-0000-0000-0000-000000000001', true, '2024-01-01', NOW(), NOW()),
    ('f0000000-0000-0000-0000-000000000002', 'LERA Explorers Monthly', 'Monthly fee for LERA Explorers program (Ages 5-6)', 'TUITION', 'FIXED', 2800000, 'PROGRAM', 'c0000000-0000-0000-0000-000000000001', true, '2024-01-01', NOW(), NOW()),
    ('f0000000-0000-0000-0000-000000000003', 'LERA Primary Monthly', 'Monthly fee for LERA Primary program (Ages 7-10)', 'TUITION', 'FIXED', 3000000, 'PROGRAM', 'c0000000-0000-0000-0000-000000000001', true, '2024-01-01', NOW(), NOW()),
    ('f0000000-0000-0000-0000-000000000004', 'LERA Teens Monthly', 'Monthly fee for LERA Teens program (Ages 11-14)', 'TUITION', 'FIXED', 3500000, 'PROGRAM', 'c0000000-0000-0000-0000-000000000002', true, '2024-01-01', NOW(), NOW()),
    ('f0000000-0000-0000-0000-000000000005', 'IELTS Prep Monthly', 'Monthly fee for IELTS Preparation program', 'TUITION', 'FIXED', 4500000, 'PROGRAM', 'c0000000-0000-0000-0000-000000000001', true, '2024-01-01', NOW(), NOW()),
    ('f0000000-0000-0000-0000-000000000006', 'Registration Fee', 'One-time registration fee for new students', 'REGISTRATION', 'FIXED', 500000, 'GLOBAL', NULL, true, '2024-01-01', NOW(), NOW()),
    ('f0000000-0000-0000-0000-000000000007', 'Materials Fee - Starters', 'Learning materials for Starters program', 'MATERIAL', 'FIXED', 800000, 'PROGRAM', NULL, true, '2024-01-01', NOW(), NOW()),
    ('f0000000-0000-0000-0000-000000000008', 'Materials Fee - IELTS', 'Test prep materials and practice tests', 'MATERIAL', 'FIXED', 1200000, 'PROGRAM', NULL, true, '2024-01-01', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- LATE_FEE_RULES (Late payment penalties)
-- =====================================================
INSERT INTO late_fee_rules (id, name, description, fee_type, amount, grace_period_days, is_active, created_at, updated_at)
VALUES 
    ('10000000-0000-0000-0000-000000000001', 'Standard Late Fee', 'Default late payment fee', 'PERCENTAGE', 5.00, 7, true, NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000002', 'Extended Late Fee', 'Late fee after 30 days', 'PERCENTAGE', 10.00, 30, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- DISCOUNTS (Available discounts)
-- =====================================================
INSERT INTO discounts (id, name, description, discount_type, discount_value, min_amount, max_discount, valid_from, valid_until, usage_limit, used_count, is_active, created_at, updated_at)
VALUES 
    ('d0000000-0000-0000-0001-000000000001', 'Early Bird 2024', '10% off for early enrollment', 'PERCENTAGE', 10.00, 1000000, 500000, '2024-01-01', '2024-03-31', 100, 45, true, NOW(), NOW()),
    ('d0000000-0000-0000-0001-000000000002', 'Sibling Discount', '15% off for second child enrollment', 'PERCENTAGE', 15.00, 1000000, 750000, '2024-01-01', '2024-12-31', NULL, 23, true, NOW(), NOW()),
    ('d0000000-0000-0000-0001-000000000003', 'Annual Package', '2 months free for annual payment', 'FIXED', 5000000, 20000000, 5000000, '2024-01-01', '2024-12-31', NULL, 12, true, NOW(), NOW()),
    ('d0000000-0000-0000-0001-000000000004', 'Referral Bonus', '500K off for referral', 'FIXED', 500000, 2000000, 500000, '2024-01-01', '2024-12-31', NULL, 67, true, NOW(), NOW()),
    ('d0000000-0000-0000-0001-000000000005', 'Summer Camp Special', '20% off summer camp', 'PERCENTAGE', 20.00, 3000000, 1000000, '2024-05-01', '2024-07-31', 200, 0, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- SCHOLARSHIPS (Financial aid programs)
-- =====================================================
INSERT INTO scholarships (id, name, description, scholarship_type, coverage_percentage, max_amount, eligibility_criteria, is_active, academic_year, created_at, updated_at)
VALUES 
    ('50000000-0000-0000-0001-000000000001', 'Academic Excellence', 'Full scholarship for outstanding English students', 'MERIT', 100.00, 50000000, 'IELTS 7.5+ or Cambridge CAE pass', true, '2024-2025', NOW(), NOW()),
    ('50000000-0000-0000-0001-000000000002', 'Financial Need', '50% tuition support for qualifying families', 'NEED_BASED', 50.00, 25000000, 'Household income below threshold', true, '2024-2025', NOW(), NOW()),
    ('50000000-0000-0000-0001-000000000003', 'Academic Merit', '30% off for high academic achievers', 'MERIT', 30.00, 15000000, 'GPA 8.5 or above', true, '2024-2025', NOW(), NOW()),
    ('50000000-0000-0000-0001-000000000004', 'Community Service', '25% scholarship for community volunteers', 'MERIT', 25.00, 12500000, '100+ volunteer hours', true, '2024-2025', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- PAYMENT_METHODS (Accepted payment methods)
-- =====================================================
INSERT INTO payment_methods (id, name, description, method_type, is_active, processing_fee, created_at, updated_at)
VALUES 
    ('20000000-0000-0000-0000-000000000001', 'Cash', 'Cash payment at center', 'CASH', true, 0.00, NOW(), NOW()),
    ('20000000-0000-0000-0000-000000000002', 'Bank Transfer', 'Direct bank transfer', 'BANK_TRANSFER', true, 0.00, NOW(), NOW()),
    ('20000000-0000-0000-0000-000000000003', 'VNPay', 'VNPay online payment', 'ONLINE', true, 1.50, NOW(), NOW()),
    ('20000000-0000-0000-0000-000000000004', 'Momo', 'Momo e-wallet', 'E_WALLET', true, 1.00, NOW(), NOW()),
    ('20000000-0000-0000-0000-000000000005', 'Credit Card', 'Visa/Mastercard', 'CARD', true, 2.50, NOW(), NOW()),
    ('20000000-0000-0000-0000-000000000006', 'ZaloPay', 'ZaloPay e-wallet', 'E_WALLET', true, 1.00, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- INVOICES (Sample invoices)
-- =====================================================
INSERT INTO invoices (id, invoice_number, student_id, center_id, subtotal, discount_amount, tax_amount, total_amount, currency, status, due_date, notes, created_at, updated_at)
VALUES 
    ('30000000-0000-0000-0000-000000000001', 'INV-2024-001', '50000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 3000000, 300000, 0, 2700000, 'VND', 'PAID', '2024-02-15', 'January fees - LERA Starters + Explorers', NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000002', 'INV-2024-002', '50000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 2500000, 250000, 0, 2250000, 'VND', 'PAID', '2024-02-15', 'January fees - LERA Starters', NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000003', 'INV-2024-003', '50000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 6000000, 0, 0, 6000000, 'VND', 'PAID', '2024-02-15', 'January fees - LERA Primary + Phonics', NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000004', 'INV-2024-004', '50000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 2800000, 0, 0, 2800000, 'VND', 'PENDING', '2024-03-15', 'March fees - LERA Explorers', NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000005', 'INV-2024-005', '50000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 8000000, 1200000, 0, 6800000, 'VND', 'PAID', '2024-02-15', 'January fees - LERA Teens + IELTS Prep (Sibling discount)', NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000006', 'INV-2024-006', '50000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 4500000, 0, 0, 4500000, 'VND', 'OVERDUE', '2024-02-28', 'February fees - IELTS Intensive', NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000007', 'INV-2024-007', '50000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003', 4000000, 0, 0, 4000000, 'VND', 'PENDING', '2024-03-15', 'March fees - Business English', NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000008', 'INV-2024-008', '50000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000003', 2500000, 500000, 0, 2000000, 'VND', 'PAID', '2024-02-15', 'January fees - LERA Starters (Referral discount)', NOW(), NOW())
ON CONFLICT (invoice_number) DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = NOW();

-- =====================================================
-- PAYMENTS (Payment records)
-- =====================================================
INSERT INTO payments (id, invoice_id, center_id, student_id, payment_method, amount, currency, transaction_id, payment_gateway, status, paid_at, notes, created_at)
VALUES 
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'BANK_TRANSFER', 2700000, 'VND', 'TXN-2024-001', 'VCB', 'COMPLETED', '2024-01-20 10:30:00', 'Bank transfer confirmed', NOW()),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'VNPAY', 2250000, 'VND', 'VNP-2024-002', 'VNPAY', 'COMPLETED', '2024-01-22 14:15:00', 'VNPay payment successful', NOW()),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', 'CASH', 6000000, 'VND', 'CASH-2024-003', NULL, 'COMPLETED', '2024-01-18 09:00:00', 'Cash payment received', NOW()),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000005', 'MOMO', 4590000, 'VND', 'MOMO-2024-005', 'MOMO', 'COMPLETED', '2024-01-25 16:45:00', 'Momo payment confirmed', NOW()),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000008', 'CARD', 2000000, 'VND', 'CARD-2024-008', 'STRIPE', 'COMPLETED', '2024-01-28 11:20:00', 'Credit card payment processed', NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- FEE_RECEIPTS (Payment receipts)
-- =====================================================
INSERT INTO fee_receipts (id, receipt_number, payment_id, student_id, amount, receipt_date, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'RCP-2024-001', NULL, '50000000-0000-0000-0000-000000000001', 2700000, '2024-01-20', NOW(), NOW()),
    (gen_random_uuid(), 'RCP-2024-002', NULL, '50000000-0000-0000-0000-000000000002', 2250000, '2024-01-22', NOW(), NOW()),
    (gen_random_uuid(), 'RCP-2024-003', NULL, '50000000-0000-0000-0000-000000000003', 6000000, '2024-01-18', NOW(), NOW()),
    (gen_random_uuid(), 'RCP-2024-004', NULL, '50000000-0000-0000-0000-000000000005', 4590000, '2024-01-25', NOW(), NOW()),
    (gen_random_uuid(), 'RCP-2024-005', NULL, '50000000-0000-0000-0000-000000000008', 2000000, '2024-01-28', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- REFUNDS (Refund records)
-- =====================================================
INSERT INTO refunds (id, payment_id, amount, reason, status, requested_at, processed_at, created_at, updated_at)
VALUES 
    (gen_random_uuid(), NULL, 500000, 'Class cancelled by academy', 'COMPLETED', '2024-02-01 10:00:00', '2024-02-03 15:00:00', NOW(), NOW()),
    (gen_random_uuid(), NULL, 1000000, 'Student withdrawal - medical reason', 'PENDING', '2024-02-15 09:00:00', NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- STUDENT_FEE_PLANS (Individual student payment plans)
-- =====================================================
INSERT INTO student_fee_plans (id, student_id, plan_name, total_amount, paid_amount, remaining_amount, installments, status, start_date, end_date, created_at, updated_at)
VALUES 
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000003', 'Annual English Program Plan', 42000000, 24000000, 18000000, 12, 'ACTIVE', '2024-01-01', '2024-12-31', NOW(), NOW()),
    (gen_random_uuid(), '50000000-0000-0000-0000-000000000005', 'Multi-Course Package', 60000000, 20000000, 40000000, 12, 'ACTIVE', '2024-01-01', '2024-12-31', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- LEDGER_ENTRIES (Financial ledger)
-- =====================================================
INSERT INTO ledger_entries (id, entry_type, amount, description, reference_type, reference_id, center_id, entry_date, created_at)
VALUES 
    (gen_random_uuid(), 'CREDIT', 2700000, 'Payment received - INV-2024-001', 'INVOICE', '30000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '2024-01-20', NOW()),
    (gen_random_uuid(), 'CREDIT', 2250000, 'Payment received - INV-2024-002', 'INVOICE', '30000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', '2024-01-22', NOW()),
    (gen_random_uuid(), 'CREDIT', 6000000, 'Payment received - INV-2024-003', 'INVOICE', '30000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', '2024-01-18', NOW()),
    (gen_random_uuid(), 'CREDIT', 4590000, 'Payment received - INV-2024-005', 'INVOICE', '30000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', '2024-01-25', NOW()),
    (gen_random_uuid(), 'DEBIT', 500000, 'Refund processed - Class cancelled', 'REFUND', NULL, 'c0000000-0000-0000-0000-000000000001', '2024-02-03', NOW())
ON CONFLICT DO NOTHING;
