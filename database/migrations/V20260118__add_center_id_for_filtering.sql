-- Migration: Add centerId and studentId columns for center-based filtering
-- Date: 2026-01-18
-- Description: This migration adds centerId support to payments and attendance tables
--              for Center Manager data filtering

-- =====================================================
-- PAYMENTS TABLE - Add center_id and student_id columns
-- =====================================================
ALTER TABLE payments ADD COLUMN IF NOT EXISTS center_id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS student_id UUID;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_center_id ON payments(center_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);

-- =====================================================
-- ATTENDANCE TABLE - Add center_id column
-- =====================================================
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS center_id UUID;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_center_id ON attendance(center_id);

-- =====================================================
-- UPDATE EXISTING DATA (Optional - populate center_id from related tables)
-- =====================================================

-- Update payments with centerId from students
UPDATE payments p
SET center_id = s.center_id
FROM students s
WHERE p.student_id = s.id AND p.center_id IS NULL;

-- Update attendance with centerId from students
UPDATE attendance a
SET center_id = s.center_id
FROM students s
WHERE a.student_id = s.id AND a.center_id IS NULL;

-- =====================================================
-- VERIFY MIGRATION
-- =====================================================
-- Check payments table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments' AND column_name IN ('center_id', 'student_id');

-- Check attendance table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'attendance' AND column_name = 'center_id';
