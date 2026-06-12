-- =====================================================
-- REPORTING MANAGER APPROVAL SYSTEM
-- Reporting Manager approves, Center Manager in CC only
-- Date: December 30, 2025
-- =====================================================

-- Add reporting manager as approver
ALTER TABLE teacher_staff_leaves 
ADD COLUMN IF NOT EXISTS reporting_manager_id UUID;

-- Add center manager (CC only, not approver)
ALTER TABLE teacher_staff_leaves 
ADD COLUMN IF NOT EXISTS center_manager_id UUID;

-- Add center manager notification tracking
ALTER TABLE teacher_staff_leaves 
ADD COLUMN IF NOT EXISTS center_manager_notified BOOLEAN DEFAULT FALSE;

ALTER TABLE teacher_staff_leaves 
ADD COLUMN IF NOT EXISTS center_manager_viewed_at TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tsl_reporting_manager ON teacher_staff_leaves(reporting_manager_id);
CREATE INDEX IF NOT EXISTS idx_tsl_center_manager ON teacher_staff_leaves(center_manager_id);
CREATE INDEX IF NOT EXISTS idx_tsl_cm_notified ON teacher_staff_leaves(center_manager_notified) WHERE center_manager_notified = TRUE;

-- Add comments
COMMENT ON COLUMN teacher_staff_leaves.reporting_manager_id IS 'Reporting manager who approves the leave';
COMMENT ON COLUMN teacher_staff_leaves.center_manager_id IS 'Center manager (CC only, not approver)';
COMMENT ON COLUMN teacher_staff_leaves.center_manager_notified IS 'Whether center manager was notified (CC)';
COMMENT ON COLUMN teacher_staff_leaves.center_manager_viewed_at IS 'When center manager viewed (CC only)';

-- Update existing pending leaves to notify center managers
UPDATE teacher_staff_leaves 
SET center_manager_notified = TRUE
WHERE status = 'PENDING'
AND center_manager_notified IS NULL;

-- Verification
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'teacher_staff_leaves' 
               AND column_name = 'reporting_manager_id') THEN
        RAISE NOTICE '✅ Column reporting_manager_id added successfully';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'teacher_staff_leaves' 
               AND column_name = 'center_manager_id') THEN
        RAISE NOTICE '✅ Column center_manager_id added successfully';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'teacher_staff_leaves' 
               AND column_name = 'center_manager_notified') THEN
        RAISE NOTICE '✅ Column center_manager_notified added successfully';
    END IF;
END $$;

SELECT 'teacher_staff_leaves' as table_name,
       COUNT(*) as total_leaves,
       COUNT(CASE WHEN reporting_manager_id IS NOT NULL THEN 1 END) as with_reporting_manager,
       COUNT(CASE WHEN center_manager_id IS NOT NULL THEN 1 END) as with_center_manager,
       COUNT(CASE WHEN center_manager_notified = TRUE THEN 1 END) as cm_notified
FROM teacher_staff_leaves;
