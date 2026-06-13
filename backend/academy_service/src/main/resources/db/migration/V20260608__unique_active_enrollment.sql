-- Prevent a student being ACTIVE-enrolled in the same class twice (duplicate invoices / double counting).
-- Partial unique index so historical (completed/withdrawn) enrolments in the same class are still allowed.

-- Dedupe any existing duplicate ACTIVE rows first (keep one deterministically) so the index can be created.
UPDATE enrollments SET status = 'SUPERSEDED'
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY student_id, class_id ORDER BY id) AS rn
        FROM enrollments WHERE status = 'ACTIVE'
    ) d WHERE d.rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_enrollment
    ON enrollments (student_id, class_id) WHERE status = 'ACTIVE';
