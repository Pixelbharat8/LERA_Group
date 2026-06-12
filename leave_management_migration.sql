-- Migration script for Leave Management System
-- Date: December 30, 2025

-- 1. Add center_id column to attendance_exceptions table
ALTER TABLE attendance_exceptions 
ADD COLUMN IF NOT EXISTS center_id UUID;

-- 2. Create index for center_id
CREATE INDEX IF NOT EXISTS idx_attendance_exceptions_center ON attendance_exceptions(center_id);

-- 3. Create teacher_staff_leaves table
CREATE TABLE IF NOT EXISTS teacher_staff_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  center_id UUID NOT NULL,
  user_type VARCHAR(50) NOT NULL,
  leave_date DATE NOT NULL,
  end_date DATE,
  leave_type VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  documents TEXT,
  status VARCHAR(20) DEFAULT 'PENDING',
  requested_by UUID NOT NULL,
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_by UUID,
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  is_paid BOOLEAN DEFAULT TRUE,
  days_count INTEGER,
  approver_role VARCHAR(50),
  half_day BOOLEAN DEFAULT FALSE,
  start_time TIME,
  end_time TIME,
  notification_sent BOOLEAN DEFAULT FALSE,
  comments TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create indexes for teacher_staff_leaves
CREATE INDEX IF NOT EXISTS idx_tsl_user ON teacher_staff_leaves(user_id);
CREATE INDEX IF NOT EXISTS idx_tsl_center ON teacher_staff_leaves(center_id);
CREATE INDEX IF NOT EXISTS idx_tsl_status ON teacher_staff_leaves(status);
CREATE INDEX IF NOT EXISTS idx_tsl_date ON teacher_staff_leaves(leave_date);

-- 5. Create updated_at trigger for teacher_staff_leaves
CREATE OR REPLACE FUNCTION update_teacher_staff_leaves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER teacher_staff_leaves_updated_at_trigger
BEFORE UPDATE ON teacher_staff_leaves
FOR EACH ROW
EXECUTE FUNCTION update_teacher_staff_leaves_updated_at();

-- Migration complete!
-- Run this script on your database: psql -U postgres -d lera -f leave_management_migration.sql
