-- =====================================================
-- UPDATE PAYROLL TABLE - Payroll Service Database
-- =====================================================
-- Purpose: Add missing columns for teacher and center information
-- Usage: Enables proper display of teacher names and center filtering

-- Add teacher_name column if not exists
ALTER TABLE payroll 
ADD COLUMN IF NOT EXISTS teacher_name VARCHAR(255);

-- Add center_name column if not exists
ALTER TABLE payroll 
ADD COLUMN IF NOT EXISTS center_name VARCHAR(255);

-- Add center_id column if not exists  
ALTER TABLE payroll 
ADD COLUMN IF NOT EXISTS center_id UUID;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payroll_teacher_id ON payroll(teacher_id);
CREATE INDEX IF NOT EXISTS idx_payroll_center_id ON payroll(center_id);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll(pay_period_start, pay_period_end);

-- Update existing payroll records with teacher and center names
UPDATE payroll p
SET 
  teacher_name = u.fullname,
  center_name = c.name,
  center_id = u.center_id
FROM users u
LEFT JOIN centers c ON u.center_id = c.id
WHERE p.teacher_id = u.id
  AND (p.teacher_name IS NULL OR p.center_name IS NULL);

-- Verify update
SELECT 
  COUNT(*) as total_records,
  COUNT(teacher_name) as records_with_teacher_name,
  COUNT(center_name) as records_with_center_name,
  COUNT(CASE WHEN teacher_name IS NULL THEN 1 END) as missing_teacher_name
FROM payroll;

-- Show sample data
SELECT 
  teacher_name,
  center_name,
  pay_period_start,
  pay_period_end,
  teaching_hours,
  total_amount,
  status
FROM payroll
ORDER BY created_at DESC
LIMIT 10;
