-- =====================================================
-- LEAVE SYSTEM ENHANCEMENT MIGRATION
-- Monthly Leave Accrual System + CEO/Chairman Visibility
-- Date: December 30, 2025
-- =====================================================

-- ==========================================
-- 1. Add new columns to teacher_staff_leaves
-- ==========================================

-- Add assigned approver (Chairman can assign specific person)
ALTER TABLE teacher_staff_leaves 
ADD COLUMN IF NOT EXISTS assigned_approver_id UUID;

-- Add CEO visibility tracking
ALTER TABLE teacher_staff_leaves 
ADD COLUMN IF NOT EXISTS notified_to_ceo BOOLEAN DEFAULT FALSE;

ALTER TABLE teacher_staff_leaves 
ADD COLUMN IF NOT EXISTS ceo_viewed_at TIMESTAMP;

-- Add Chairman visibility tracking
ALTER TABLE teacher_staff_leaves 
ADD COLUMN IF NOT EXISTS notified_to_chairman BOOLEAN DEFAULT FALSE;

ALTER TABLE teacher_staff_leaves 
ADD COLUMN IF NOT EXISTS chairman_viewed_at TIMESTAMP;

-- Add index for assigned approver
CREATE INDEX IF NOT EXISTS idx_tsl_assigned_approver ON teacher_staff_leaves(assigned_approver_id);

-- Add indexes for executive visibility
CREATE INDEX IF NOT EXISTS idx_tsl_ceo_notified ON teacher_staff_leaves(notified_to_ceo) WHERE notified_to_ceo = TRUE;
CREATE INDEX IF NOT EXISTS idx_tsl_chairman_notified ON teacher_staff_leaves(notified_to_chairman) WHERE notified_to_chairman = TRUE;

-- ==========================================
-- 2. Create Leave Balance Accrual Table
-- ==========================================

CREATE TABLE IF NOT EXISTS leave_balance_accruals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    center_id UUID NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    leaves_accrued DOUBLE PRECISION DEFAULT 1.0,
    leaves_used DOUBLE PRECISION DEFAULT 0.0,
    leaves_carried_forward DOUBLE PRECISION DEFAULT 0.0,
    total_available DOUBLE PRECISION DEFAULT 1.0,
    accrual_date DATE NOT NULL,
    is_processed BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one entry per user per month per year
    CONSTRAINT unique_user_year_month UNIQUE (user_id, year, month)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lba_user ON leave_balance_accruals(user_id);
CREATE INDEX IF NOT EXISTS idx_lba_center ON leave_balance_accruals(center_id);
CREATE INDEX IF NOT EXISTS idx_lba_year_month ON leave_balance_accruals(year, month);
CREATE INDEX IF NOT EXISTS idx_lba_user_year ON leave_balance_accruals(user_id, year);
CREATE INDEX IF NOT EXISTS idx_lba_is_processed ON leave_balance_accruals(is_processed) WHERE is_processed = FALSE;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_leave_balance_accruals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leave_balance_accruals_updated_at
    BEFORE UPDATE ON leave_balance_accruals
    FOR EACH ROW
    EXECUTE FUNCTION update_leave_balance_accruals_updated_at();

-- ==========================================
-- 3. Add Comments for Documentation
-- ==========================================

COMMENT ON TABLE leave_balance_accruals IS 'Monthly leave accrual system - Users get 1 leave per month (12 per year)';
COMMENT ON COLUMN leave_balance_accruals.leaves_accrued IS 'Leaves accrued this month (typically 1.0)';
COMMENT ON COLUMN leave_balance_accruals.leaves_used IS 'Leaves used from this months accrual';
COMMENT ON COLUMN leave_balance_accruals.leaves_carried_forward IS 'Unused leaves from previous months';
COMMENT ON COLUMN leave_balance_accruals.total_available IS 'Total available = accrued + carried_forward - used';
COMMENT ON COLUMN leave_balance_accruals.is_processed IS 'Whether monthly accrual has been processed';

COMMENT ON COLUMN teacher_staff_leaves.assigned_approver_id IS 'Chairman can assign specific approver for this leave';
COMMENT ON COLUMN teacher_staff_leaves.notified_to_ceo IS 'Whether CEO has been notified about this leave';
COMMENT ON COLUMN teacher_staff_leaves.notified_to_chairman IS 'Whether Chairman has been notified about this leave';
COMMENT ON COLUMN teacher_staff_leaves.ceo_viewed_at IS 'When CEO viewed this leave';
COMMENT ON COLUMN teacher_staff_leaves.chairman_viewed_at IS 'When Chairman viewed this leave';

-- ==========================================
-- 4. Initialize Accruals for Existing Users
-- ==========================================

-- This will create accrual entries for current month for all users who have applied for leave
INSERT INTO leave_balance_accruals (user_id, center_id, year, month, accrual_date)
SELECT DISTINCT 
    user_id,
    center_id,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER as year,
    EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER as month,
    DATE_TRUNC('month', CURRENT_DATE)::DATE as accrual_date
FROM teacher_staff_leaves
WHERE NOT EXISTS (
    SELECT 1 FROM leave_balance_accruals lba
    WHERE lba.user_id = teacher_staff_leaves.user_id
    AND lba.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
    AND lba.month = EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
)
ON CONFLICT (user_id, year, month) DO NOTHING;

-- Update all existing pending leaves to notify CEO and Chairman
UPDATE teacher_staff_leaves 
SET 
    notified_to_ceo = TRUE,
    notified_to_chairman = TRUE
WHERE status = 'PENDING'
AND (notified_to_ceo IS NULL OR notified_to_ceo = FALSE);

-- ==========================================
-- 5. Verification Queries
-- ==========================================

-- Verify table creation
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_balance_accruals') THEN
        RAISE NOTICE '✅ Table leave_balance_accruals created successfully';
    ELSE
        RAISE EXCEPTION '❌ Table leave_balance_accruals was not created';
    END IF;
END $$;

-- Verify columns added
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'teacher_staff_leaves' 
               AND column_name = 'assigned_approver_id') THEN
        RAISE NOTICE '✅ Column assigned_approver_id added successfully';
    ELSE
        RAISE EXCEPTION '❌ Column assigned_approver_id was not added';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'teacher_staff_leaves' 
               AND column_name = 'notified_to_ceo') THEN
        RAISE NOTICE '✅ Column notified_to_ceo added successfully';
    ELSE
        RAISE EXCEPTION '❌ Column notified_to_ceo was not added';
    END IF;
END $$;

-- Show summary
SELECT 
    'teacher_staff_leaves' as table_name,
    COUNT(*) as total_leaves,
    COUNT(CASE WHEN notified_to_ceo = TRUE THEN 1 END) as ceo_notified,
    COUNT(CASE WHEN notified_to_chairman = TRUE THEN 1 END) as chairman_notified,
    COUNT(CASE WHEN assigned_approver_id IS NOT NULL THEN 1 END) as assigned_approvers
FROM teacher_staff_leaves;

SELECT 
    'leave_balance_accruals' as table_name,
    COUNT(*) as total_accruals,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(leaves_accrued) as total_accrued,
    SUM(leaves_used) as total_used,
    SUM(total_available) as total_available
FROM leave_balance_accruals;

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================

RAISE NOTICE '🎉 Leave system enhancement migration completed successfully!';
RAISE NOTICE '📊 Features added:';
RAISE NOTICE '   ✅ Monthly leave accrual system (1 leave/month)';
RAISE NOTICE '   ✅ CEO visibility tracking';
RAISE NOTICE '   ✅ Chairman visibility tracking';
RAISE NOTICE '   ✅ Assigned approver functionality';
RAISE NOTICE '   ✅ Leave carry-forward support';
