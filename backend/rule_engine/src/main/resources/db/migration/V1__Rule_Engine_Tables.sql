-- =====================================================
-- Rule Engine Database Schema
-- Version: 1.0
-- Description: Tables for Business Rules Engine
-- =====================================================

-- =====================================================
-- 1. BUSINESS RULES TABLE
-- Stores rule definitions with conditions and actions
-- =====================================================
CREATE TABLE IF NOT EXISTS business_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(100) NOT NULL, -- FEE_DISCOUNT, ATTENDANCE_ALERT, LEAVE_APPROVAL, ENROLLMENT, PROMOTION, SCHOLARSHIP
    category VARCHAR(50), -- ACADEMIC, FINANCIAL, HR, ATTENDANCE, ENROLLMENT
    condition_expression TEXT, -- JSON expression for conditions
    action_type VARCHAR(50), -- APPLY_DISCOUNT, SEND_NOTIFICATION, APPROVE, REJECT, ESCALATE
    action_params TEXT, -- JSON params for action
    priority INTEGER DEFAULT 0, -- Higher priority rules execute first
    is_active BOOLEAN DEFAULT TRUE,
    academy_id UUID,
    tenant_id UUID,
    effective_from TIMESTAMP,
    effective_until TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Indexes for business_rules
CREATE INDEX IF NOT EXISTS idx_business_rules_type ON business_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_business_rules_category ON business_rules(category);
CREATE INDEX IF NOT EXISTS idx_business_rules_active ON business_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_business_rules_tenant ON business_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_rules_academy ON business_rules(academy_id);
CREATE INDEX IF NOT EXISTS idx_business_rules_priority ON business_rules(priority DESC);

-- =====================================================
-- 2. RULE CONDITIONS TABLE
-- Stores individual conditions for rules
-- =====================================================
CREATE TABLE IF NOT EXISTS rule_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES business_rules(id) ON DELETE CASCADE,
    field_name VARCHAR(255) NOT NULL, -- e.g., "student.attendanceRate", "payment.amount"
    operator VARCHAR(50) NOT NULL, -- EQUALS, NOT_EQUALS, GREATER_THAN, LESS_THAN, CONTAINS, IN, BETWEEN
    field_value VARCHAR(500) NOT NULL, -- The value to compare against
    value_type VARCHAR(20) DEFAULT 'STRING', -- STRING, NUMBER, DATE, BOOLEAN, LIST
    logical_operator VARCHAR(10) DEFAULT 'AND', -- AND, OR - how to combine with next condition
    sequence_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rule_conditions
CREATE INDEX IF NOT EXISTS idx_rule_conditions_rule ON rule_conditions(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_conditions_sequence ON rule_conditions(rule_id, sequence_order);

-- =====================================================
-- 3. RULE ACTIONS TABLE
-- Stores actions to be executed when rules match
-- =====================================================
CREATE TABLE IF NOT EXISTS rule_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES business_rules(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL, -- APPLY_DISCOUNT, SEND_NOTIFICATION, SEND_EMAIL, APPROVE, REJECT, ESCALATE, UPDATE_STATUS
    action_params TEXT, -- JSON parameters for the action
    notification_template VARCHAR(255),
    recipient_type VARCHAR(50), -- STUDENT, PARENT, TEACHER, ADMIN, SPECIFIC_USER
    recipient_id UUID,
    sequence_order INTEGER DEFAULT 0,
    is_async BOOLEAN DEFAULT FALSE,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rule_actions
CREATE INDEX IF NOT EXISTS idx_rule_actions_rule ON rule_actions(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_actions_sequence ON rule_actions(rule_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_rule_actions_type ON rule_actions(action_type);

-- =====================================================
-- 4. RULE EXECUTIONS TABLE
-- Logs rule execution history for auditing
-- =====================================================
CREATE TABLE IF NOT EXISTS rule_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES business_rules(id) ON DELETE CASCADE,
    trigger_type VARCHAR(50), -- MANUAL, SCHEDULED, EVENT
    trigger_event VARCHAR(100), -- ENROLLMENT_CREATED, ATTENDANCE_MARKED, PAYMENT_RECEIVED, LEAVE_APPLIED
    context_data TEXT, -- JSON data used for evaluation
    condition_result BOOLEAN,
    action_executed BOOLEAN DEFAULT FALSE,
    action_result TEXT,
    error_message TEXT,
    execution_time_ms BIGINT,
    executed_by UUID,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rule_executions
CREATE INDEX IF NOT EXISTS idx_rule_executions_rule ON rule_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_executions_trigger ON rule_executions(trigger_type);
CREATE INDEX IF NOT EXISTS idx_rule_executions_event ON rule_executions(trigger_event);
CREATE INDEX IF NOT EXISTS idx_rule_executions_date ON rule_executions(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_rule_executions_result ON rule_executions(condition_result);

-- =====================================================
-- 5. SAMPLE DATA FOR TESTING
-- =====================================================

-- Sample: Attendance Alert Rule
INSERT INTO business_rules (id, rule_name, description, rule_type, category, priority, is_active)
VALUES (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Low Attendance Alert',
    'Send notification when student attendance falls below 75%',
    'ATTENDANCE_ALERT',
    'ATTENDANCE',
    10,
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO rule_conditions (id, rule_id, field_name, operator, field_value, value_type)
VALUES (
    'b1c2d3e4-f5a6-4b5c-9d0e-1f2a3b4c5d6e',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'student.attendanceRate',
    'LESS_THAN',
    '75',
    'NUMBER'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO rule_actions (id, rule_id, action_type, recipient_type, notification_template)
VALUES (
    'c1d2e3f4-a5b6-4c5d-0e1f-2a3b4c5d6e7f',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'SEND_NOTIFICATION',
    'PARENT',
    'Your child''s attendance is below 75%. Please contact the school.'
) ON CONFLICT (id) DO NOTHING;

-- Sample: Fee Discount Rule
INSERT INTO business_rules (id, rule_name, description, rule_type, category, priority, is_active)
VALUES (
    'd1e2f3a4-b5c6-4d5e-1f0a-2b3c4d5e6f7a',
    'Sibling Discount',
    'Apply 10% discount for siblings enrolled together',
    'FEE_DISCOUNT',
    'FINANCIAL',
    20,
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO rule_conditions (id, rule_id, field_name, operator, field_value, value_type)
VALUES (
    'e1f2a3b4-c5d6-4e5f-0a1b-2c3d4e5f6a7b',
    'd1e2f3a4-b5c6-4d5e-1f0a-2b3c4d5e6f7a',
    'student.hasSibling',
    'EQUALS',
    'true',
    'BOOLEAN'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO rule_actions (id, rule_id, action_type, action_params)
VALUES (
    'f1a2b3c4-d5e6-4f5a-1b0c-2d3e4f5a6b7c',
    'd1e2f3a4-b5c6-4d5e-1f0a-2b3c4d5e6f7a',
    'APPLY_DISCOUNT',
    '{"discountType": "PERCENTAGE", "discountValue": 10}'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE business_rules IS 'Stores business rule definitions for the rule engine';
COMMENT ON TABLE rule_conditions IS 'Stores individual conditions for business rules';
COMMENT ON TABLE rule_actions IS 'Stores actions to execute when rule conditions are met';
COMMENT ON TABLE rule_executions IS 'Audit log of all rule executions';
