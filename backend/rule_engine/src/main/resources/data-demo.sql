-- =====================================================
--
-- NOTE: seed ids are FIXED, never gen_random_uuid(). Spring re-runs data.sql on every
-- startup (spring.sql.init.mode=always in dev; 'never' in prod). A random id can never
-- collide, so ON CONFLICT DO NOTHING cannot fire and the rows are re-INSERTED each boot —
-- which duplicated this dev DB's seed data many times over. Keep ids literal.
-- LERA Rule Engine Service - Seed Data
-- =====================================================
-- This file creates initial data for business rules, conditions, actions, and executions
-- Uses PostgreSQL ON CONFLICT for upsert operations

-- =====================================================
-- BUSINESS_RULES (Automated business rules)
-- =====================================================
INSERT INTO business_rules (id, rule_name, description, rule_type, category, condition_expression, action_type, action_params, priority, is_active, tenant_id, effective_from, created_at, updated_at)
VALUES 
    -- Fee Discount Rules
    ('bb000000-0000-0000-0000-000000000001', 'Early Bird Discount', 'Apply 10% discount for enrollments before semester starts', 'FEE_DISCOUNT', 'FINANCIAL', '{"field": "enrollment_date", "operator": "before", "value": "semester_start_date", "days_before": 30}', 'APPLY_DISCOUNT', '{"discount_type": "PERCENTAGE", "discount_value": 10, "max_discount": 500000}', 10, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),
    
    ('bb000000-0000-0000-0000-000000000002', 'Sibling Discount', 'Apply 15% discount for second child from same family', 'FEE_DISCOUNT', 'FINANCIAL', '{"field": "sibling_count", "operator": "greater_than", "value": 1}', 'APPLY_DISCOUNT', '{"discount_type": "PERCENTAGE", "discount_value": 15, "applies_to": "second_child"}', 9, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),
    
    ('bb000000-0000-0000-0000-000000000003', 'Annual Payment Discount', 'Give 2 months free for annual payment', 'FEE_DISCOUNT', 'FINANCIAL', '{"field": "payment_plan", "operator": "equals", "value": "ANNUAL"}', 'APPLY_DISCOUNT', '{"discount_type": "FIXED", "discount_value": "2_months_fee"}', 8, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),

    -- Attendance Alert Rules
    ('bb000000-0000-0000-0000-000000000004', 'Low Attendance Alert', 'Send alert when student attendance drops below 70%', 'ATTENDANCE_ALERT', 'ATTENDANCE', '{"field": "attendance_percentage", "operator": "less_than", "value": 70, "period": "monthly"}', 'SEND_NOTIFICATION', '{"recipients": ["parent", "teacher", "center_admin"], "template": "low_attendance_alert", "channels": ["email", "sms"]}', 10, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),
    
    ('bb000000-0000-0000-0000-000000000005', 'Consecutive Absence Alert', 'Alert after 3 consecutive absences', 'ATTENDANCE_ALERT', 'ATTENDANCE', '{"field": "consecutive_absences", "operator": "greater_than_or_equal", "value": 3}', 'SEND_NOTIFICATION', '{"recipients": ["parent", "center_manager"], "template": "consecutive_absence", "channels": ["email", "sms", "app_push"], "urgency": "HIGH"}', 10, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),

    -- Leave Approval Rules
    ('bb000000-0000-0000-0000-000000000006', 'Auto Approve Short Sick Leave', 'Automatically approve sick leave of 1 day', 'LEAVE_APPROVAL', 'HR', '{"and": [{"field": "leave_type", "operator": "equals", "value": "SICK_LEAVE"}, {"field": "duration_days", "operator": "equals", "value": 1}]}', 'APPROVE', '{"auto_approve": true, "notify": ["employee", "manager"]}', 5, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),
    
    ('bb000000-0000-0000-0000-000000000007', 'Emergency Leave Fast Track', 'Escalate emergency leave requests for immediate approval', 'LEAVE_APPROVAL', 'HR', '{"field": "leave_type", "operator": "equals", "value": "EMERGENCY"}', 'ESCALATE', '{"escalate_to": "center_manager", "priority": "URGENT", "sla_hours": 2}', 10, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),

    -- Enrollment Rules
    ('bb000000-0000-0000-0000-000000000008', 'Age Verification', 'Verify student age meets program requirements', 'ENROLLMENT', 'ENROLLMENT', '{"and": [{"field": "student_age", "operator": "greater_than_or_equal", "value": "program.min_age"}, {"field": "student_age", "operator": "less_than_or_equal", "value": "program.max_age"}]}', 'APPROVE', '{"condition_met": true}', 10, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),
    
    ('bb000000-0000-0000-0000-000000000009', 'Class Capacity Check', 'Prevent enrollment if class is full', 'ENROLLMENT', 'ENROLLMENT', '{"field": "class.enrolled_count", "operator": "less_than", "value": "class.max_students"}', 'APPROVE', '{"allow_enrollment": true}', 10, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),

    -- Promotion Rules
    ('bb000000-0000-0000-0000-000000000010', 'Level Promotion Eligibility', 'Check if student is eligible for level promotion', 'PROMOTION', 'ACADEMIC', '{"and": [{"field": "attendance_percentage", "operator": "greater_than_or_equal", "value": 80}, {"field": "assessment_score", "operator": "greater_than_or_equal", "value": 70}, {"field": "months_enrolled", "operator": "greater_than_or_equal", "value": 3}]}', 'SEND_NOTIFICATION', '{"recipients": ["teacher", "academic_manager"], "template": "promotion_eligible", "action_required": true}', 7, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),

    -- Scholarship Rules
    ('bb000000-0000-0000-0000-000000000011', 'Academic Excellence Scholarship', 'Identify students eligible for academic scholarship', 'SCHOLARSHIP', 'FINANCIAL', '{"and": [{"field": "gpa", "operator": "greater_than_or_equal", "value": 8.5}, {"field": "attendance_percentage", "operator": "greater_than_or_equal", "value": 90}]}', 'SEND_NOTIFICATION', '{"recipients": ["finance_manager", "academic_manager"], "template": "scholarship_eligible", "scholarship_id": "sc000000-0000-0000-0000-000000000003"}', 8, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),
    
    ('bb000000-0000-0000-0000-000000000012', 'Language Proficiency Scholarship', 'Identify students for language proficiency scholarship', 'SCHOLARSHIP', 'FINANCIAL', '{"or": [{"field": "exam_level", "operator": "equals", "value": "IELTS"}, {"field": "skill_rating", "operator": "greater_than_or_equal", "value": 9}]}', 'SEND_NOTIFICATION', '{"recipients": ["finance_manager", "academic_director"], "template": "language_scholarship_eligible", "scholarship_id": "sc000000-0000-0000-0000-000000000001"}', 8, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),

    -- Payment Rules
    ('bb000000-0000-0000-0000-000000000013', 'Overdue Payment Alert', 'Send reminder for overdue payments', 'FEE_DISCOUNT', 'FINANCIAL', '{"field": "days_overdue", "operator": "greater_than", "value": 7}', 'SEND_NOTIFICATION', '{"recipients": ["parent"], "template": "payment_overdue", "channels": ["email", "sms"], "escalate_after_days": 14}', 10, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),
    
    ('bb000000-0000-0000-0000-000000000014', 'Late Fee Application', 'Apply late fee after grace period', 'FEE_DISCOUNT', 'FINANCIAL', '{"field": "days_overdue", "operator": "greater_than", "value": 14}', 'APPLY_DISCOUNT', '{"discount_type": "PERCENTAGE", "discount_value": -5, "description": "Late payment fee"}', 9, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),

    -- Communication Rules
    ('bb000000-0000-0000-0000-000000000015', 'Birthday Greeting', 'Send birthday greeting to students', 'ENROLLMENT', 'ENROLLMENT', '{"field": "days_until_birthday", "operator": "equals", "value": 0}', 'SEND_NOTIFICATION', '{"recipients": ["student", "parent"], "template": "birthday_greeting", "channels": ["email", "app_push"]}', 1, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- RULE_CONDITIONS (Rule condition details)
-- =====================================================
-- real cols: sequence_order / field_value (not condition_order / value)
INSERT INTO rule_conditions (id, rule_id, sequence_order, field_name, operator, field_value, value_type, logical_operator, created_at)
VALUES 
    -- Early Bird Discount conditions
    ('5eed0008-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000001', 1, 'enrollment_date', 'BEFORE', 'semester_start_date', 'DATE', 'AND', NOW()),
    ('5eed0008-0000-0000-0000-000000000002', 'bb000000-0000-0000-0000-000000000001', 2, 'days_before_start', 'GREATER_THAN_OR_EQUAL', '30', 'INTEGER', 'AND', NOW()),
    
    -- Sibling Discount conditions
    ('5eed0008-0000-0000-0000-000000000003', 'bb000000-0000-0000-0000-000000000002', 1, 'sibling_enrolled', 'EQUALS', 'true', 'BOOLEAN', 'AND', NOW()),
    ('5eed0008-0000-0000-0000-000000000004', 'bb000000-0000-0000-0000-000000000002', 2, 'child_order', 'GREATER_THAN', '1', 'INTEGER', 'AND', NOW()),
    
    -- Low Attendance conditions
    ('5eed0008-0000-0000-0000-000000000005', 'bb000000-0000-0000-0000-000000000004', 1, 'attendance_percentage', 'LESS_THAN', '70', 'DECIMAL', 'AND', NOW()),
    ('5eed0008-0000-0000-0000-000000000006', 'bb000000-0000-0000-0000-000000000004', 2, 'period_type', 'EQUALS', 'MONTHLY', 'STRING', 'AND', NOW()),
    
    -- Consecutive Absence conditions
    ('5eed0008-0000-0000-0000-000000000007', 'bb000000-0000-0000-0000-000000000005', 1, 'consecutive_absences', 'GREATER_THAN_OR_EQUAL', '3', 'INTEGER', 'AND', NOW()),
    
    -- Promotion eligibility conditions
    ('5eed0008-0000-0000-0000-000000000008', 'bb000000-0000-0000-0000-000000000010', 1, 'attendance_percentage', 'GREATER_THAN_OR_EQUAL', '80', 'DECIMAL', 'AND', NOW()),
    ('5eed0008-0000-0000-0000-000000000009', 'bb000000-0000-0000-0000-000000000010', 2, 'assessment_score', 'GREATER_THAN_OR_EQUAL', '70', 'DECIMAL', 'AND', NOW()),
    ('5eed0008-0000-0000-0000-000000000010', 'bb000000-0000-0000-0000-000000000010', 3, 'months_enrolled', 'GREATER_THAN_OR_EQUAL', '3', 'INTEGER', 'AND', NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- RULE_ACTIONS (Rule action configurations)
-- =====================================================
-- real cols: sequence_order (not action_order); there is no notification_channels column.
INSERT INTO rule_actions (id, rule_id, sequence_order, action_type, action_params, notification_template, is_async, retry_count, created_at)
VALUES
    ('5eed0008-0000-0000-0000-000000000011', 'bb000000-0000-0000-0000-000000000001', 1, 'APPLY_DISCOUNT', '{"type": "PERCENTAGE", "value": 10}', NULL, false, 0, NOW()),
    ('5eed0008-0000-0000-0000-000000000012', 'bb000000-0000-0000-0000-000000000002', 1, 'APPLY_DISCOUNT', '{"type": "PERCENTAGE", "value": 15}', NULL, false, 0, NOW()),
    ('5eed0008-0000-0000-0000-000000000013', 'bb000000-0000-0000-0000-000000000003', 1, 'APPLY_DISCOUNT', '{"type": "MONTHS_FREE", "value": 2}', NULL, false, 0, NOW()),
    ('5eed0008-0000-0000-0000-000000000014', 'bb000000-0000-0000-0000-000000000004', 1, 'SEND_NOTIFICATION', '{"urgency": "MEDIUM", "channels": ["email", "sms"]}', 'low_attendance_alert', true, 3, NOW()),
    ('5eed0008-0000-0000-0000-000000000015', 'bb000000-0000-0000-0000-000000000005', 1, 'SEND_NOTIFICATION', '{"urgency": "HIGH", "channels": ["email", "sms", "app_push"]}', 'consecutive_absence_alert', true, 3, NOW()),
    ('5eed0008-0000-0000-0000-000000000016', 'bb000000-0000-0000-0000-000000000006', 1, 'AUTO_APPROVE', '{"notify_manager": true, "channels": ["email"]}', 'leave_auto_approved', false, 0, NOW()),
    ('5eed0008-0000-0000-0000-000000000017', 'bb000000-0000-0000-0000-000000000007', 1, 'ESCALATE', '{"to": "center_manager", "sla_hours": 2, "channels": ["email", "sms"]}', 'emergency_leave_escalated', true, 2, NOW()),
    ('5eed0008-0000-0000-0000-000000000018', 'bb000000-0000-0000-0000-000000000008', 1, 'VALIDATE', '{"validation_type": "AGE_CHECK"}', NULL, false, 0, NOW()),
    ('5eed0008-0000-0000-0000-000000000019', 'bb000000-0000-0000-0000-000000000009', 1, 'VALIDATE', '{"validation_type": "CAPACITY_CHECK"}', NULL, false, 0, NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- RULE_EXECUTIONS (Rule execution history)
-- =====================================================
-- real cols: executed_at, context_data, action_result, condition_result/action_executed (booleans).
-- There is no triggered_at / input_data / output_data / status / created_at on this table.
INSERT INTO rule_executions (id, rule_id, executed_at, trigger_event, trigger_type, context_data, condition_result, action_executed, action_result, execution_time_ms, error_message)
VALUES
    ('5eed0008-0000-0000-0000-000000000020', 'bb000000-0000-0000-0000-000000000001', '2024-01-15 10:30:00', 'ENROLLMENT_CREATED', 'EVENT', '{"student_id": "50000000-0000-0000-0000-000000000001", "enrollment_date": "2024-01-15"}', true, true, '{"discount_applied": true, "discount_amount": 250000}', 45, NULL),
    ('5eed0008-0000-0000-0000-000000000021', 'bb000000-0000-0000-0000-000000000002', '2024-01-20 14:00:00', 'ENROLLMENT_CREATED', 'EVENT', '{"student_id": "50000000-0000-0000-0000-000000000002", "sibling_count": 2}', true, true, '{"discount_applied": true, "discount_amount": 337500}', 38, NULL),
    ('5eed0008-0000-0000-0000-000000000022', 'bb000000-0000-0000-0000-000000000004', '2024-02-15 09:00:00', 'ATTENDANCE_CALCULATED', 'EVENT', '{"student_id": "50000000-0000-0000-0000-000000000006", "attendance_percentage": 65}', true, true, '{"notifications_sent": 3}', 120, NULL),
    ('5eed0008-0000-0000-0000-000000000023', 'bb000000-0000-0000-0000-000000000005', '2024-02-18 08:30:00', 'ATTENDANCE_MARKED', 'EVENT', '{"student_id": "50000000-0000-0000-0000-000000000004", "consecutive_absences": 3}', true, true, '{"notifications_sent": 2, "urgency": "HIGH"}', 85, NULL),
    ('5eed0008-0000-0000-0000-000000000024', 'bb000000-0000-0000-0000-000000000006', '2024-02-10 07:45:00', 'LEAVE_REQUESTED', 'EVENT', '{"user_id": "e0000000-0000-0000-0000-000000000010", "leave_type": "SICK_LEAVE", "duration": 1}', true, true, '{"auto_approved": true}', 25, NULL),
    ('5eed0008-0000-0000-0000-000000000025', 'bb000000-0000-0000-0000-000000000008', '2024-01-10 11:00:00', 'ENROLLMENT_VALIDATION', 'EVENT', '{"student_id": "50000000-0000-0000-0000-000000000001", "student_age": 9}', true, true, '{"validation_passed": true}', 15, NULL),
    ('5eed0008-0000-0000-0000-000000000026', 'bb000000-0000-0000-0000-000000000010', '2024-03-01 10:00:00', 'MONTHLY_EVALUATION', 'SCHEDULED', '{"student_id": "50000000-0000-0000-0000-000000000003", "attendance": 92, "assessment_score": 85}', true, true, '{"eligible": true, "notifications_sent": 2}', 95, NULL),
    ('5eed0008-0000-0000-0000-000000000027', 'bb000000-0000-0000-0000-000000000013', '2024-02-25 09:00:00', 'PAYMENT_OVERDUE', 'SCHEDULED', '{"invoice_id": "10000000-0000-0000-0000-000000000006", "days_overdue": 10}', true, false, NULL, 200, 'Email service unavailable - retry scheduled'),
    ('5eed0008-0000-0000-0000-000000000028', 'bb000000-0000-0000-0000-000000000011', '2024-02-28 10:00:00', 'MONTHLY_EVALUATION', 'SCHEDULED', '{"student_id": "50000000-0000-0000-0000-000000000004", "gpa": 7.5}', false, false, '{"eligible": false, "reason": "GPA below threshold"}', 30, NULL)
ON CONFLICT DO NOTHING;
