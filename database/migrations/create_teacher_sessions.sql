-- =====================================================
-- TEACHER SESSIONS TABLE - Attendance Service Database
-- =====================================================
-- Purpose: Track when teachers teach classes for payroll calculation
-- Usage: Stores teaching hours, session details, and duration

CREATE TABLE IF NOT EXISTS teacher_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL,
    class_id UUID,
    session_date DATE NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_hours DECIMAL(5,2),
    session_type VARCHAR(30) DEFAULT 'REGULAR', -- REGULAR, MAKEUP, TRIAL, EXTRA
    status VARCHAR(20) DEFAULT 'COMPLETED', -- SCHEDULED, COMPLETED, CANCELLED, NO_SHOW
    students_attended INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_teacher_id ON teacher_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_date ON teacher_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_teacher_sessions_status ON teacher_sessions(status);

-- Sample data: Generate 60 days of teaching sessions for existing teachers
INSERT INTO teacher_sessions (teacher_id, session_date, start_time, end_time, duration_hours, status, students_attended)
SELECT 
  u.id as teacher_id,
  date_series.session_date,
  (date_series.session_date + TIME '09:00:00') as start_time,
  (date_series.session_date + TIME '11:00:00') as end_time,
  2.0 as duration_hours,
  'COMPLETED' as status,
  (random() * 20 + 5)::int as students_attended
FROM 
  users u
  JOIN roles r ON u.role_id = r.id
  CROSS JOIN (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '60 days',
      CURRENT_DATE,
      INTERVAL '1 day'
    )::date as session_date
  ) date_series
WHERE 
  r.name = 'TEACHER'
  AND EXTRACT(DOW FROM date_series.session_date) BETWEEN 1 AND 5  -- Mon-Fri only
  AND random() > 0.2;  -- 80% attendance rate

-- Verify data
SELECT 
  u.fullname as teacher_name,
  COUNT(*) as session_count,
  SUM(duration_hours) as total_hours
FROM teacher_sessions ts
JOIN users u ON ts.teacher_id = u.id
GROUP BY u.fullname
ORDER BY total_hours DESC;
