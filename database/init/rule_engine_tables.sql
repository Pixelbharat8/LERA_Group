-- =====================================================
-- Rule Engine Database Schema - Standalone Script
-- Version: 1.0
-- Description: Tables for Business Rules Engine
-- Run this directly with: psql -h localhost -U lera -d lera -f rule_engine_tables.sql
-- =====================================================

-- =====================================================
-- 1. BUSINESS RULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS business_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    condition_expression TEXT,
    action_type VARCHAR(50),
    action_params TEXT,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    academy_id UUID,
    tenant_id UUID,
    effective_from TIMESTAMP,
    effective_until TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- =====================================================
-- 2. RULE CONDITIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rule_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES business_rules(id) ON DELETE CASCADE,
    field_name VARCHAR(255) NOT NULL,
    operator VARCHAR(50) NOT NULL,
    field_value VARCHAR(500) NOT NULL,
    value_type VARCHAR(20) DEFAULT 'STRING',
    logical_operator VARCHAR(10) DEFAULT 'AND',
    sequence_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. RULE ACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rule_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES business_rules(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    action_params TEXT,
    notification_template VARCHAR(255),
    recipient_type VARCHAR(50),
    recipient_id UUID,
    sequence_order INTEGER DEFAULT 0,
    is_async BOOLEAN DEFAULT FALSE,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. RULE EXECUTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rule_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES business_rules(id) ON DELETE CASCADE,
    trigger_type VARCHAR(50),
    trigger_event VARCHAR(100),
    context_data TEXT,
    condition_result BOOLEAN,
    action_executed BOOLEAN DEFAULT FALSE,
    action_result TEXT,
    error_message TEXT,
    execution_time_ms BIGINT,
    executed_by UUID,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_business_rules_type ON business_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_business_rules_category ON business_rules(category);
CREATE INDEX IF NOT EXISTS idx_business_rules_active ON business_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_business_rules_tenant ON business_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_rules_academy ON business_rules(academy_id);
CREATE INDEX IF NOT EXISTS idx_business_rules_priority ON business_rules(priority DESC);

CREATE INDEX IF NOT EXISTS idx_rule_conditions_rule ON rule_conditions(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_conditions_sequence ON rule_conditions(rule_id, sequence_order);

CREATE INDEX IF NOT EXISTS idx_rule_actions_rule ON rule_actions(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_actions_sequence ON rule_actions(rule_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_rule_actions_type ON rule_actions(action_type);

CREATE INDEX IF NOT EXISTS idx_rule_executions_rule ON rule_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_executions_trigger ON rule_executions(trigger_type);
CREATE INDEX IF NOT EXISTS idx_rule_executions_event ON rule_executions(trigger_event);
CREATE INDEX IF NOT EXISTS idx_rule_executions_date ON rule_executions(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_rule_executions_result ON rule_executions(condition_result);

-- Verify tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('business_rules', 'rule_conditions', 'rule_actions', 'rule_executions');
