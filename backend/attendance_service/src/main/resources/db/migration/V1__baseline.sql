-- V1__baseline.sql — Attendance Service indexes for 10M+ scale

CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records (student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_class_id ON attendance_records (class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records (attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_center_id ON attendance_records (center_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records (status);
CREATE INDEX IF NOT EXISTS idx_teacher_staff_leaves_user_id ON teacher_staff_leaves (user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_staff_leaves_status ON teacher_staff_leaves (status);
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_teacher_id ON teacher_sessions (teacher_id);
CREATE INDEX IF NOT EXISTS idx_leave_balance_accruals_user_id ON leave_balance_accruals (user_id);
CREATE INDEX IF NOT EXISTS idx_leave_balance_accruals_year_month ON leave_balance_accruals (year, month);
CREATE INDEX IF NOT EXISTS idx_attendance_exceptions_student_id ON attendance_exceptions (student_id);
