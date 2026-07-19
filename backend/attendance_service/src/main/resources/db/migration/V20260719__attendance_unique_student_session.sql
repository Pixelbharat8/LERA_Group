-- Prevent duplicate attendance for the same (student, session).
--
-- createAttendance did a check-then-insert with no DB constraint, and
-- createBulkAttendance had no duplicate check at all, so a concurrent mark or a
-- re-submitted roster could insert duplicate rows that skew present/absent
-- counts and attendance rates. Mirror the enrollment service's
-- uq_enrollment_student_class approach with a DB-level guarantee.
--
-- First de-duplicate any rows the old code already created (keep the earliest
-- physical row per student+session), then add a PARTIAL unique index — rows with
-- a NULL session_id (e.g. session-less self-attendance) are intentionally not
-- constrained, matching the application guard.

DELETE FROM attendance a
USING attendance b
WHERE a.session_id IS NOT NULL
  AND a.student_id = b.student_id
  AND a.session_id = b.session_id
  AND a.ctid > b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS ux_attendance_student_session
  ON attendance (student_id, session_id)
  WHERE session_id IS NOT NULL;
