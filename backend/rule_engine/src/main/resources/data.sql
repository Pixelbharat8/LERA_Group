-- =====================================================
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
    ('br000000-0000-0000-0000-000000000001', 'Early Bird Discount', 'Apply 10% discount for enrollments before semester starts', 'FEE_DISCOUNT', 'FINANCIAL', '{"field": "enrollment_date", "operator": "before", "value": "semester_start_date", "days_before": 30}', 'APPLY_DISCOUNT', '{"discount_type": "PERCENTAGE", "discount_value": 10, "max_discount": 500000}', 10, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),
    
    ('br000000-0000-0000-0000-000000000002', 'Sibling Discount', 'Apply 15% discount for second child from same family', 'FEE_DISCOUNT', 'FINANCIAL', '{"field": "sibling_count", "operator": "greater_than", "value": 1}', 'APPLY_DISCOUNT', '{"discount_type": "PERCENTAGE", "discount_value": 15, "applies_to": "second_child"}', 9, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),
    
    ('br000000-0000-0000-0000-000000000003', 'Annual Payment Discount', 'Give 2 months free for annual payment', 'FEE_DISCOUNT', 'FINANCIAL', '{"field": "payment_plan", "operator": "equals", "value": "ANNUAL"}', 'APPLY_DISCOUNT', '{"discount_type": "FIXED", "discount_value": "2_months_fee"}', 8, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),

    -- Attendance Alert Rules
    ('br000000-0000-0000-0000-000000000004', 'Low Attendance Alert', 'Send alert when student attendance drops below 70%', 'ATTENDANCE_ALERT', 'ATTENDANCE', '{"field": "attendance_percentage", "operator": "less_than", "value": 70, "period": "monthly"}', 'SEND_NOTIFICATION', '{"recipients": ["parent", "teacher", "center_admin"], "template": "low_attendance_alert", "channels": ["email", "sms"]}', 10, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),
    
    ('br000000-0000-0000-0000-000000000005', 'Consecutive Absence Alert', 'Alert after 3 consecutive absences', 'ATTENDANCE_ALERT', 'ATTENDANCE', '{"field": "consecutive_absences", "operator": "greater_than_or_equal", "value": 3}', 'SEND_NOTIFICATION', '{"recipients": ["parent", "center_manager"], "template": "consecutive_absence", "channels": ["email", "sms", "app_push"], "urgency": "HIGH"}', 10, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),

    -- Leave Approval Rules
    ('br000000-0000-0000-0000-000000000006', 'Auto Approve Short Sick Leave', 'Automatically approve sick leave of 1 day', 'LEAVE_APPROVAL', 'HR', '{"and": [{"field": "leave_type", "operator": "equals", "value": "SICK_LEAVE"}, {"field": "duration_days", "operator": "equals", "value": 1}]}', 'APPROVE', '{"auto_approve": true, "notify": ["employee", "manager"]}', 5, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),
    
    ('br000000-0000-0000-0000-000000000007', 'Emergency Leave Fast Track', 'Escalate emergency leave requests for immediate approval', 'LEAVE_APPROVAL', 'HR', '{"field": "leave_type", "operator": "equals", "value": "EMERGENCY"}', 'ESCALATE', '{"escalate_to": "center_manager", "priority": "URGENT", "sla_hours": 2}', 10, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),

    -- Enrollment Rules
    ('br000000-0000-0000-0000-000000000008', 'Age Verification', 'Verify student age meets program requirements', 'ENROLLMENT', 'ENROLLMENT', '{"and": [{"field": "student_age", "operator": "greater_than_or_equal", "value": "program.min_age"}, {"field": "student_age", "operator": "less_than_or_equal", "value": "program.max_age"}]}', 'APPROVE', '{"condition_met": true}', 10, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),
    
    ('br000000-0000-0000-0000-000000000009', 'Class Capacity Check', 'Prevent enrollment if class is full', 'ENROLLMENT', 'ENROLLMENT', '{"field": "class.enrolled_count", "operator": "less_than", "value": "class.max_students"}', 'APPROVE', '{"allow_enrollment": true}', 10, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),

    -- Promotion Rules
    ('br000000-0000-0000-0000-000000000010', 'Level Promotion Eligibility', 'Check if student is eligible for level promotion', 'PROMOTION', 'ACADEMIC', '{"and": [{"field": "attendance_percentage", "operator": "greater_than_or_equal", "value": 80}, {"field": "assessment_score", "operator": "greater_than_or_equal", "value": 70}, {"field": "months_enrolled", "operator": "greater_than_or_equal", "value": 3}]}', 'SEND_NOTIFICATION', '{"recipients": ["teacher", "academic_manager"], "template": "promotion_eligible", "action_required": true}', 7, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),

    -- Scholarship Rules
    ('br000000-0000-0000-0000-000000000011', 'Academic Excellence Scholarship', 'Identify students eligible for academic scholarship', 'SCHOLARSHIP', 'FINANCIAL', '{"and": [{"field": "gpa", "operator": "greater_than_or_equal", "value": 8.5}, {"field": "attendance_percentage", "operator": "greater_than_or_equal", "value": 90}]}', 'SEND_NOTIFICATION', '{"recipients": ["finance_manager", "academic_manager"], "template": "scholarship_eligible", "scholarship_id": "sc000000-0000-0000-0000-000000000003"}', 8, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),
    
    ('br000000-0000-0000-0000-000000000012', 'Language Proficiency Scholarship', 'Identify students for language proficiency scholarship', 'SCHOLARSHIP', 'FINANCIAL', '{"or": [{"field": "exam_level", "operator": "equals", "value": "IELTS"}, {"field": "skill_rating", "operator": "greater_than_or_equal", "value": 9}]}', 'SEND_NOTIFICATION', '{"recipients": ["finance_manager", "academic_director"], "template": "language_scholarship_eligible", "scholarship_id": "sc000000-0000-0000-0000-000000000001"}', 8, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),

    -- Payment Rules
    ('br000000-0000-0000-0000-000000000013', 'Overdue Payment Alert', 'Send reminder for overdue payments', 'FEE_DISCOUNT', 'FINANCIAL', '{"field": "days_overdue", "operator": "greater_than", "value": 7}', 'SEND_NOTIFICATION', '{"recipients": ["parent"], "template": "payment_overdue", "channels": ["email", "sms"], "escalate_after_days": 14}', 10, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),
    
    ('br000000-0000-0000-0000-000000000014', 'Late Fee Application', 'Apply late fee after grace period', 'FEE_DISCOUNT', 'FINANCIAL', '{"field": "days_overdue", "operator": "greater_than", "value": 14}', 'APPLY_DISCOUNT', '{"discount_type": "PERCENTAGE", "discount_value": -5, "description": "Late payment fee"}', 9, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW()),

    -- Communication Rules
    ('br000000-0000-0000-0000-000000000015', 'Birthday Greeting', 'Send birthday greeting to students', 'ENROLLMENT', 'ENROLLMENT', '{"field": "days_until_birthday", "operator": "equals", "value": 0}', 'SEND_NOTIFICATION', '{"recipients": ["student", "parent"], "template": "birthday_greeting", "channels": ["email", "app_push"]}', 1, true, '11111111-1111-1111-1111-111111111111', '2024-01-01 00:00:00', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- RULE_CONDITIONS (Rule condition details)
-- =====================================================
INSERT INTO rule_conditions (id, rule_id, condition_order, field_name, operator, value, value_type, logical_operator, created_at)
VALUES 
    -- Early Bird Discount conditions
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000001', 1, 'enrollment_date', 'BEFORE', 'semester_start_date', 'DATE', 'AND', NOW()),
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000001', 2, 'days_before_start', 'GREATER_THAN_OR_EQUAL', '30', 'INTEGER', 'AND', NOW()),
    
    -- Sibling Discount conditions
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000002', 1, 'sibling_enrolled', 'EQUALS', 'true', 'BOOLEAN', 'AND', NOW()),
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000002', 2, 'child_order', 'GREATER_THAN', '1', 'INTEGER', 'AND', NOW()),
    
    -- Low Attendance conditions
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000004', 1, 'attendance_percentage', 'LESS_THAN', '70', 'DECIMAL', 'AND', NOW()),
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000004', 2, 'period_type', 'EQUALS', 'MONTHLY', 'STRING', 'AND', NOW()),
    
    -- Consecutive Absence conditions
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000005', 1, 'consecutive_absences', 'GREATER_THAN_OR_EQUAL', '3', 'INTEGER', 'AND', NOW()),
    
    -- Promotion eligibility conditions
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000010', 1, 'attendance_percentage', 'GREATER_THAN_OR_EQUAL', '80', 'DECIMAL', 'AND', NOW()),
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000010', 2, 'assessment_score', 'GREATER_THAN_OR_EQUAL', '70', 'DECIMAL', 'AND', NOW()),
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000010', 3, 'months_enrolled', 'GREATER_THAN_OR_EQUAL', '3', 'INTEGER', 'AND', NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- RULE_ACTIONS (Rule action configurations)
-- =====================================================
INSERT INTO rule_actions (id, rule_id, action_order, action_type, action_params, notification_template, notification_channels, created_at)
VALUES 
    -- Discount actions
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000001', 1, 'APPLY_DISCOUNT', '{"type": "PERCENTAGE", "value": 10}', NULL, NULL, NOW()),
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000002', 1, 'APPLY_DISCOUNT', '{"type": "PERCENTAGE", "value": 15}', NULL, NULL, NOW()),
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000003', 1, 'APPLY_DISCOUNT', '{"type": "MONTHS_FREE", "value": 2}', NULL, NULL, NOW()),
    
    -- Notification actions
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000004', 1, 'SEND_NOTIFICATION', '{"urgency": "MEDIUM"}', 'low_attendance_alert', '["email", "sms"]', NOW()),
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000005', 1, 'SEND_NOTIFICATION', '{"urgency": "HIGH"}', 'consecutive_absence_alert', '["email", "sms", "app_push"]', NOW()),
    
    -- Approval actions
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000006', 1, 'AUTO_APPROVE', '{"notify_manager": true}', 'leave_auto_approved', '["email"]', NOW()),
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000007', 1, 'ESCALATE', '{"to": "center_manager", "sla_hours": 2}', 'emergency_leave_escalated', '["email", "sms"]', NOW()),
    
    -- Enrollment actions
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000008', 1, 'VALIDATE', '{"validation_type": "AGE_CHECK"}', NULL, NULL, NOW()),
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000009', 1, 'VALIDATE', '{"validation_type": "CAPACITY_CHECK"}', NULL, NULL, NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- RULE_EXECUTIONS (Rule execution history)
-- =====================================================
INSERT INTO rule_executions (id, rule_id, triggered_at, trigger_event, input_data, output_data, status, execution_time_ms, error_message, created_at)
VALUES 
    -- Successful executions
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000001', '2024-01-15 10:30:00', 'ENROLLMENT_CREATED', '{"student_id": "50000000-0000-0000-0000-000000000001", "enrollment_date": "2024-01-15", "semester_start": "2024-02-01"}', '{"discount_applied": true, "discount_amount": 250000}', 'SUCCESS', 45, NULL, NOW()),
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000002', '2024-01-20 14:00:00', 'ENROLLMENT_CREATED', '{"student_id": "50000000-0000-0000-0000-000000000002", "sibling_count": 2}', '{"discount_applied": true, "discount_amount": 337500}', 'SUCCESS', 38, NULL, NOW()),
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000004', '2024-02-15 09:00:00', 'ATTENDANCE_CALCULATED', '{"student_id": "50000000-0000-0000-0000-000000000006", "attendance_percentage": 65}', '{"notifications_sent": 3, "recipients": ["parent", "teacher", "center_admin"]}', 'SUCCESS', 120, NULL, NOW()),
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000005', '2024-02-18 08:30:00', 'ATTENDANCE_MARKED', '{"student_id": "50000000-0000-0000-0000-000000000004", "consecutive_absences": 3}', '{"notifications_sent": 2, "urgency": "HIGH"}', 'SUCCESS', 85, NULL, NOW()),
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000006', '2024-02-10 07:45:00', 'LEAVE_REQUESTED', '{"user_id": "e0000000-0000-0000-0000-000000000010", "leave_type": "SICK_LEAVE", "duration": 1}', '{"auto_approved": true, "approval_time": "0ms"}', 'SUCCESS', 25, NULL, NOW()),
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000008', '2024-01-10 11:00:00', 'ENROLLMENT_VALIDATION', '{"student_id": "50000000-0000-0000-0000-000000000001", "student_age": 9, "program_min_age": 6, "program_max_age": 10}', '{"validation_passed": true}', 'SUCCESS', 15, NULL, NOW()),
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000010', '2024-03-01 10:00:00', 'MONTHLY_EVALUATION', '{"student_id": "50000000-0000-0000-0000-000000000003", "attendance": 92, "assessment_score": 85, "months_enrolled": 4}', '{"eligible": true, "notifications_sent": 2}', 'SUCCESS', 95, NULL, NOW()),
    
    -- Failed execution
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000013', '2024-02-25 09:00:00', 'PAYMENT_OVERDUE', '{"invoice_id": "10000000-0000-0000-0000-000000000006", "days_overdue": 10}', NULL, 'FAILED', 200, 'Email service unavailable - retry scheduled', NOW()),
    
    -- Skipped execution (conditions not met)
    (gen_random_uuid(), 'br000000-0000-0000-0000-000000000011', '2024-02-28 10:00:00', 'MONTHLY_EVALUATION', '{"student_id": "50000000-0000-0000-0000-000000000004", "gpa": 7.5, "attendance": 88}', '{"eligible": false, "reason": "GPA below threshold"}', 'SKIPPED', 30, NULL, NOW())
ON CONFLICT DO NOTHING;
