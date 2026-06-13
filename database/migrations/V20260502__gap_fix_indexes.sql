-- ============================================================================
-- V20260502__gap_fix_indexes.sql
--
-- Companion migration for the May-2026 frontend/backend gap fix.
--
-- The matching code changes:
--   * UserController.java now exposes /api/users/me/* and /{id}/{approve,reject}
--     and supports the ?approval_status= query param consumed by the
--     superadmin/approvals UI.
--   * StudentFeePlanController.java exposes /{id}/{activate,suspend,generate-invoice}.
--
-- This migration is idempotent — every statement uses IF NOT EXISTS / IF EXISTS
-- so it is safe to apply against a database where add_approval_workflow.sql
-- already ran.
-- ============================================================================

-- Ensure approval-workflow columns are present (created earlier by
-- migrations/add_approval_workflow.sql). Repeated here so a clean clone
-- (init scripts only, no manual migration) still has them.
ALTER TABLE users     ADD COLUMN IF NOT EXISTS approval_status   VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE users     ADD COLUMN IF NOT EXISTS requested_by      UUID REFERENCES users(id);
ALTER TABLE users     ADD COLUMN IF NOT EXISTS requested_at      TIMESTAMP DEFAULT NOW();
ALTER TABLE users     ADD COLUMN IF NOT EXISTS approved_by       UUID REFERENCES users(id);
ALTER TABLE users     ADD COLUMN IF NOT EXISTS approved_at       TIMESTAMP;
ALTER TABLE users     ADD COLUMN IF NOT EXISTS rejection_reason  TEXT;

-- Make approval_status lookups (used by /api/users?approval_status=PENDING) cheap.
CREATE INDEX IF NOT EXISTS idx_users_approval_status
    ON users(approval_status);
CREATE INDEX IF NOT EXISTS idx_users_status
    ON users(status);

-- /api/student-fee-plans?status=ACTIVE and the new lifecycle PATCH endpoints
-- both filter on `status`. Nothing new structurally, but the index is cheap.
CREATE INDEX IF NOT EXISTS idx_student_fee_plans_student_status
    ON student_fee_plans(student_id, status);

-- /api/leaves/center/{centerId}/status/{status} and pending-count queries
-- benefit from a composite index. The leaves table is named differently
-- across earlier migrations — guard with a DO block.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leaves') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_leaves_center_status ON leaves(center_id, status)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_leaves_user_year ON leaves(user_id, EXTRACT(YEAR FROM created_at))';
    END IF;
END $$;

-- Backfill: any user whose status is ACTIVE but approval_status is NULL is
-- legacy data (created before the workflow existed). Mark them APPROVED so
-- they keep working.
UPDATE users
SET approval_status = 'APPROVED',
    approved_at     = COALESCE(approved_at, created_at, NOW())
WHERE status = 'ACTIVE' AND approval_status IS NULL;

-- Sanity report
SELECT
    'V20260502 gap_fix_indexes applied' AS status,
    (SELECT COUNT(*) FROM users WHERE approval_status = 'PENDING')   AS pending_users,
    (SELECT COUNT(*) FROM users WHERE approval_status = 'APPROVED')  AS approved_users,
    (SELECT COUNT(*) FROM users WHERE approval_status = 'REJECTED')  AS rejected_users;
