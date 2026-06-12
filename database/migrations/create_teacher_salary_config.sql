-- =====================================================
-- TEACHER SALARY CONFIG TABLE - Payroll Service Database
-- =====================================================
-- Purpose: Store salary rules and rates for each teacher
-- Usage: Configure base salary, hourly rates, and payment types

CREATE TABLE IF NOT EXISTS teacher_salary_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL UNIQUE,
    center_id UUID,
    base_salary DECIMAL(12,2) DEFAULT 0,
    hourly_rate DECIMAL(10,2) DEFAULT 200000,
    session_rate DECIMAL(10,2) DEFAULT 0,
    salary_type VARCHAR(20) DEFAULT 'HOURLY', -- FIXED, HOURLY, SESSION, HYBRID
    currency VARCHAR(10) DEFAULT 'VND',
    effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_salary_config_teacher_id ON teacher_salary_config(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_salary_config_center_id ON teacher_salary_config(center_id);
CREATE INDEX IF NOT EXISTS idx_teacher_salary_config_status ON teacher_salary_config(status);

-- Auto-generate salary configs for all existing teachers
INSERT INTO teacher_salary_config (teacher_id, center_id, base_salary, hourly_rate, session_rate, salary_type, status)
SELECT 
  u.id as teacher_id,
  u.center_id,
  CASE 
    WHEN random() > 0.5 THEN 5000000.00  -- Senior teachers
    ELSE 3000000.00                       -- Junior teachers
  END as base_salary,
  CASE 
    WHEN random() > 0.5 THEN 250000.00   -- Senior rate
    ELSE 180000.00                        -- Junior rate
  END as hourly_rate,
  CASE 
    WHEN random() > 0.7 THEN 500000.00   -- Session-based pay
    ELSE 0.00
  END as session_rate,
  'HOURLY' as salary_type,
  'ACTIVE' as status
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.name = 'TEACHER'
ON CONFLICT (teacher_id) DO UPDATE
SET 
  base_salary = EXCLUDED.base_salary,
  hourly_rate = EXCLUDED.hourly_rate,
  updated_at = CURRENT_TIMESTAMP;

-- Verify data
SELECT 
  u.fullname as teacher_name,
  c.name as center_name,
  tsc.base_salary,
  tsc.hourly_rate,
  tsc.salary_type,
  tsc.status
FROM teacher_salary_config tsc
JOIN users u ON tsc.teacher_id = u.id
LEFT JOIN centers c ON tsc.center_id = c.id
ORDER BY tsc.base_salary DESC;
