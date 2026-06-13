-- =====================================================
-- LERA Payroll Service - Seed Data
-- =====================================================
-- This file creates initial data for payroll records, salaries, bonuses, deductions
-- Uses PostgreSQL ON CONFLICT for upsert operations

-- =====================================================
-- SALARY_COMPONENTS (Salary structure components)
-- =====================================================
INSERT INTO salary_components (id, component_name, component_type, description, is_taxable, is_active, created_at, updated_at)
VALUES 
    ('5c000000-0000-0000-0000-000000000001', 'Base Salary', 'EARNING', 'Monthly base salary', true, true, NOW(), NOW()),
    ('5c000000-0000-0000-0000-000000000002', 'Teaching Hours Pay', 'EARNING', 'Payment per teaching hour', true, true, NOW(), NOW()),
    ('5c000000-0000-0000-0000-000000000003', 'Overtime Pay', 'EARNING', 'Additional pay for overtime hours', true, true, NOW(), NOW()),
    ('5c000000-0000-0000-0000-000000000004', 'Transport Allowance', 'ALLOWANCE', 'Monthly transport allowance', false, true, NOW(), NOW()),
    ('5c000000-0000-0000-0000-000000000005', 'Meal Allowance', 'ALLOWANCE', 'Daily meal allowance', false, true, NOW(), NOW()),
    ('5c000000-0000-0000-0000-000000000006', 'Phone Allowance', 'ALLOWANCE', 'Monthly phone allowance', false, true, NOW(), NOW()),
    ('5c000000-0000-0000-0000-000000000007', 'Performance Bonus', 'BONUS', 'Quarterly performance bonus', true, true, NOW(), NOW()),
    ('5c000000-0000-0000-0000-000000000008', 'Year-End Bonus', 'BONUS', 'Annual 13th month bonus', true, true, NOW(), NOW()),
    ('5c000000-0000-0000-0000-000000000009', 'Income Tax', 'DEDUCTION', 'Personal income tax', false, true, NOW(), NOW()),
    ('5c000000-0000-0000-0000-000000000010', 'Social Insurance', 'DEDUCTION', 'Social insurance contribution', false, true, NOW(), NOW()),
    ('5c000000-0000-0000-0000-000000000011', 'Health Insurance', 'DEDUCTION', 'Health insurance contribution', false, true, NOW(), NOW()),
    ('5c000000-0000-0000-0000-000000000012', 'Unemployment Insurance', 'DEDUCTION', 'Unemployment insurance contribution', false, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- TAX_SETTINGS (Tax configuration)
-- =====================================================
INSERT INTO tax_settings (id, tax_name, tax_type, rate, threshold_amount, effective_from, is_active, created_at, updated_at)
VALUES 
    ('70000000-0000-0000-0000-000000000001', 'PIT Level 1', 'INCOME_TAX', 5.00, 5000000, '2024-01-01', true, NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000002', 'PIT Level 2', 'INCOME_TAX', 10.00, 10000000, '2024-01-01', true, NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000003', 'PIT Level 3', 'INCOME_TAX', 15.00, 18000000, '2024-01-01', true, NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000004', 'PIT Level 4', 'INCOME_TAX', 20.00, 32000000, '2024-01-01', true, NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000005', 'Social Insurance Employee', 'SOCIAL_INSURANCE', 8.00, NULL, '2024-01-01', true, NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000006', 'Health Insurance Employee', 'HEALTH_INSURANCE', 1.50, NULL, '2024-01-01', true, NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000007', 'Unemployment Insurance', 'UNEMPLOYMENT_INSURANCE', 1.00, NULL, '2024-01-01', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- PAYROLL_CYCLES (Pay periods)
-- =====================================================
INSERT INTO payroll_cycles (id, cycle_name, start_date, end_date, payment_date, status, created_at, updated_at)
VALUES 
    ('90000000-0000-0000-0000-000000000001', 'January 2024', '2024-01-01', '2024-01-31', '2024-02-05', 'COMPLETED', NOW(), NOW()),
    ('90000000-0000-0000-0000-000000000002', 'February 2024', '2024-02-01', '2024-02-29', '2024-03-05', 'COMPLETED', NOW(), NOW()),
    ('90000000-0000-0000-0000-000000000003', 'March 2024', '2024-03-01', '2024-03-31', '2024-04-05', 'PROCESSING', NOW(), NOW()),
    ('90000000-0000-0000-0000-000000000004', 'April 2024', '2024-04-01', '2024-04-30', '2024-05-05', 'PENDING', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- TEACHER_SALARIES (Monthly teacher salary records)
-- =====================================================
INSERT INTO teacher_salaries (id, payroll_cycle_id, teacher_id, base_salary, classes_taught, hourly_rate, total_hours, overtime_hours, overtime_pay, bonus, allowances, gross_salary, tax_deduction, provident_fund, insurance, other_deductions, net_salary, status, created_at, updated_at)
VALUES 
    -- January 2024 Salaries
    (gen_random_uuid(), '90000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 15000000, 20, 500000, 80.00, 10.00, 750000, 2000000, 1500000, 19250000, 1925000, 1540000, 288750, 0, 15496250, 'PAID', NOW(), NOW()),
    (gen_random_uuid(), '90000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 12000000, 18, 450000, 72.00, 5.00, 337500, 1500000, 1200000, 15037500, 1503750, 1203000, 225563, 0, 12105188, 'PAID', NOW(), NOW()),
    (gen_random_uuid(), '90000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 8000000, 12, 400000, 48.00, 0.00, 0, 0, 800000, 8800000, 440000, 704000, 132000, 0, 7524000, 'PAID', NOW(), NOW()),
    (gen_random_uuid(), '90000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 14000000, 16, 480000, 64.00, 8.00, 576000, 1000000, 1400000, 16976000, 1697600, 1358080, 254640, 0, 13665680, 'PAID', NOW(), NOW()),
    -- February 2024 Salaries
    (gen_random_uuid(), '90000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 15000000, 18, 500000, 72.00, 8.00, 600000, 1800000, 1500000, 18900000, 1890000, 1512000, 283500, 0, 15214500, 'PAID', NOW(), NOW()),
    (gen_random_uuid(), '90000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 12000000, 16, 450000, 64.00, 4.00, 270000, 1200000, 1200000, 14670000, 1467000, 1173600, 220050, 0, 11809350, 'PAID', NOW(), NOW()),
    -- March 2024 (Processing)
    (gen_random_uuid(), '90000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 15000000, 22, 500000, 88.00, 12.00, 900000, 2500000, 1500000, 19900000, 0, 0, 0, 0, 19900000, 'PENDING', NOW(), NOW()),
    (gen_random_uuid(), '90000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 12000000, 20, 450000, 80.00, 8.00, 540000, 2000000, 1200000, 15740000, 0, 0, 0, 0, 15740000, 'PENDING', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- PAYROLL (General payroll records)
-- =====================================================
INSERT INTO payroll (id, teacher_id, pay_period_start, pay_period_end, base_salary, teaching_hours, hourly_rate, teaching_amount, bonus, deductions, total_amount, center_id, teacher_name, center_name, currency, status, paid_at, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2024-01-01', '2024-01-31', 15000000, 80.00, 500000, 40000000, 2000000, 3753750, 53246250, 'c0000000-0000-0000-0000-000000000001', 'John Smith', 'LERA Headquarters', 'VND', 'PAID', '2024-02-05 10:00:00', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', '2024-01-01', '2024-01-31', 12000000, 72.00, 450000, 32400000, 1500000, 2932313, 42967688, 'c0000000-0000-0000-0000-000000000001', 'Sarah Johnson', 'LERA Headquarters', 'VND', 'PAID', '2024-02-05 10:00:00', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', '2024-01-01', '2024-01-31', 8000000, 48.00, 400000, 19200000, 0, 1276000, 25924000, 'c0000000-0000-0000-0000-000000000002', 'Nguyen Thi Teacher', 'LERA District 7 Center', 'VND', 'PAID', '2024-02-05 10:00:00', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', '2024-01-01', '2024-01-31', 14000000, 64.00, 480000, 30720000, 1000000, 3310320, 42409680, 'c0000000-0000-0000-0000-000000000001', 'Basketball Coach', 'LERA Headquarters', 'VND', 'PAID', '2024-02-05 10:00:00', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2024-02-01', '2024-02-29', 15000000, 72.00, 500000, 36000000, 1800000, 3685500, 49114500, 'c0000000-0000-0000-0000-000000000001', 'John Smith', 'LERA Headquarters', 'VND', 'PAID', '2024-03-05 10:00:00', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', '2024-02-01', '2024-02-29', 12000000, 64.00, 450000, 28800000, 1200000, 2860650, 39139350, 'c0000000-0000-0000-0000-000000000001', 'Sarah Johnson', 'LERA Headquarters', 'VND', 'PAID', '2024-03-05 10:00:00', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2024-03-01', '2024-03-31', 15000000, 88.00, 500000, 44000000, 2500000, 0, 61500000, 'c0000000-0000-0000-0000-000000000001', 'John Smith', 'LERA Headquarters', 'VND', 'PENDING', NULL, NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', '2024-03-01', '2024-03-31', 12000000, 80.00, 450000, 36000000, 2000000, 0, 50000000, 'c0000000-0000-0000-0000-000000000001', 'Sarah Johnson', 'LERA Headquarters', 'VND', 'PENDING', NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- BONUSES (Bonus payments)
-- =====================================================
INSERT INTO bonuses (id, teacher_id, bonus_type, amount, reason, pay_period, status, approved_by, approved_at, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'PERFORMANCE', 2000000, 'Excellent student feedback Q4 2023', 'January 2024', 'APPROVED', 'e0000000-0000-0000-0000-000000000005', '2024-01-28 14:00:00', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'PERFORMANCE', 1500000, 'Above target attendance rates', 'January 2024', 'APPROVED', 'e0000000-0000-0000-0000-000000000005', '2024-01-28 14:00:00', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', 'RETENTION', 1000000, 'Contract renewal bonus', 'January 2024', 'APPROVED', 'e0000000-0000-0000-0000-000000000005', '2024-01-25 10:00:00', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'SPECIAL', 2500000, 'Tet Holiday bonus', 'March 2024', 'PENDING', NULL, NULL, NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'SPECIAL', 2000000, 'Tet Holiday bonus', 'March 2024', 'PENDING', NULL, NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- DEDUCTIONS (Salary deductions)
-- =====================================================
INSERT INTO deductions (id, teacher_id, deduction_type, amount, reason, pay_period, status, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'ABSENCE', 400000, 'Unpaid leave - 1 day', 'January 2024', 'APPROVED', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005', 'LATE', 100000, 'Late arrivals - 2 instances', 'January 2024', 'APPROVED', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000006', 'ADVANCE', 2000000, 'Salary advance repayment', 'February 2024', 'APPROVED', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- TEACHER_OVERTIME (Overtime records)
-- =====================================================
INSERT INTO teacher_overtime (id, teacher_id, overtime_date, hours, rate_multiplier, amount, reason, status, approved_by, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2024-01-15', 3.00, 1.5, 750000, 'Extra training session - tournament prep', 'APPROVED', 'e0000000-0000-0000-0000-000000000005', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2024-01-22', 4.00, 1.5, 1000000, 'Weekend coaching session', 'APPROVED', 'e0000000-0000-0000-0000-000000000005', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', '2024-01-20', 2.00, 1.5, 337500, 'Makeup class for cancelled session', 'APPROVED', 'e0000000-0000-0000-0000-000000000005', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', '2024-01-27', 4.00, 1.5, 576000, 'Saturday training session', 'APPROVED', 'e0000000-0000-0000-0000-000000000005', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2024-02-10', 3.00, 1.5, 750000, 'Parent-teacher meeting support', 'APPROVED', 'e0000000-0000-0000-0000-000000000005', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '2024-03-05', 4.00, 2.0, 1000000, 'Holiday training session', 'PENDING', NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- SALARY_PAYOUTS (Payout records)
-- =====================================================
INSERT INTO salary_payouts (id, teacher_id, payroll_cycle_id, payout_date, amount, payment_method, transaction_reference, status, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', '2024-02-05', 15496250, 'BANK_TRANSFER', 'PAY-2024-001-T1', 'COMPLETED', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000001', '2024-02-05', 12105188, 'BANK_TRANSFER', 'PAY-2024-001-T2', 'COMPLETED', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000001', '2024-02-05', 7524000, 'BANK_TRANSFER', 'PAY-2024-001-T3', 'COMPLETED', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', '90000000-0000-0000-0000-000000000001', '2024-02-05', 13665680, 'BANK_TRANSFER', 'PAY-2024-001-T4', 'COMPLETED', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000002', '2024-03-05', 15214500, 'BANK_TRANSFER', 'PAY-2024-002-T1', 'COMPLETED', NOW(), NOW()),
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000002', '2024-03-05', 11809350, 'BANK_TRANSFER', 'PAY-2024-002-T2', 'COMPLETED', NOW(), NOW())
ON CONFLICT DO NOTHING;
