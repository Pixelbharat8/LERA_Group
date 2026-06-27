-- V1__baseline.sql — Attendance Service indexes for 10M+ scale

-- fixed 2026-06-28: the entity table is `attendance` (not `attendance_records`), and it is
-- session-based — it uses session_id (not class_id) and check_in_time (not attendance_date).
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance (student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance (session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in ON attendance (check_in_time);
CREATE INDEX IF NOT EXISTS idx_attendance_center_id ON attendance (center_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance (status);
CREATE INDEX IF NOT EXISTS idx_teacher_staff_leaves_user_id ON teacher_staff_leaves (user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_staff_leaves_status ON teacher_staff_leaves (status);
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_teacher_id ON teacher_sessions (teacher_id);
CREATE INDEX IF NOT EXISTS idx_leave_balance_accruals_user_id ON leave_balance_accruals (user_id);
CREATE INDEX IF NOT EXISTS idx_leave_balance_accruals_year_month ON leave_balance_accruals (year, month);
CREATE INDEX IF NOT EXISTS idx_attendance_exceptions_student_id ON attendance_exceptions (student_id);
