-- Harden core academy relationships without validating old rows.
-- NOT VALID constraints protect new writes while allowing a separate data-cleanup
-- pass before validation on existing databases.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION pg_temp.add_fk_if_compatible(
    p_constraint_name text,
    child_table text,
    child_column text,
    parent_table text,
    parent_column text DEFAULT 'id'
) RETURNS void AS $$
DECLARE
    child_type text;
    parent_type text;
    existing_equivalent boolean;
BEGIN
    SELECT c.udt_name INTO child_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = child_table
      AND c.column_name = child_column;

    SELECT c.udt_name INTO parent_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = parent_table
      AND c.column_name = parent_column;

    IF child_type IS NULL OR parent_type IS NULL THEN
        RAISE NOTICE 'Skipping FK %. Missing %.% or %.%',
            p_constraint_name, child_table, child_column, parent_table, parent_column;
        RETURN;
    END IF;

    IF child_type <> parent_type THEN
        RAISE NOTICE 'Skipping FK %. Type mismatch %.%=%, %.%=%',
            p_constraint_name, child_table, child_column, child_type, parent_table, parent_column, parent_type;
        RETURN;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
         AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = child_table
          AND kcu.column_name = child_column
          AND ccu.table_name = parent_table
          AND ccu.column_name = parent_column
    ) INTO existing_equivalent;

    IF existing_equivalent OR EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public'
          AND tc.constraint_name = p_constraint_name
    ) THEN
        RETURN;
    END IF;

    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (%I)',
        'idx_' || child_table || '_' || child_column || '_fk', child_table, child_column);
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(%I) NOT VALID',
        child_table, p_constraint_name, child_column, parent_table, parent_column);
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    row_count bigint;
    id_type text;
BEGIN
    SELECT c.udt_name INTO id_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'session_attendance'
      AND c.column_name = 'id';

    IF id_type IS NOT NULL AND id_type <> 'uuid' THEN
        EXECUTE 'SELECT count(*) FROM session_attendance' INTO row_count;
        IF row_count > 0 THEN
            RAISE EXCEPTION
                'session_attendance uses % ids and has % rows. Migrate rows to UUID before applying this migration.',
                id_type, row_count;
        END IF;
        DROP TABLE session_attendance;
    END IF;

    CREATE TABLE IF NOT EXISTS session_attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL,
        student_id UUID NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
        check_in_time TIMESTAMP,
        check_out_time TIMESTAMP,
        minutes_late INTEGER,
        participation_score INTEGER,
        behavior_score INTEGER,
        notes TEXT,
        parent_notified BOOLEAN DEFAULT FALSE,
        parent_notified_at TIMESTAMP,
        recorded_by UUID,
        recorded_at TIMESTAMP DEFAULT now()
    );
END $$;

CREATE INDEX IF NOT EXISTS idx_session_attendance_session ON session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_student ON session_attendance(student_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_attendance_session_student
    ON session_attendance(session_id, student_id);

SELECT pg_temp.add_fk_if_compatible('fk_students_center', 'students', 'center_id', 'centers');
SELECT pg_temp.add_fk_if_compatible('fk_students_user', 'students', 'user_id', 'users');
SELECT pg_temp.add_fk_if_compatible('fk_students_parent_user', 'students', 'parent_id', 'users');
SELECT pg_temp.add_fk_if_compatible('fk_teachers_center', 'teachers', 'center_id', 'centers');
SELECT pg_temp.add_fk_if_compatible('fk_teachers_user', 'teachers', 'user_id', 'users');
SELECT pg_temp.add_fk_if_compatible('fk_parent_profiles_user', 'parent_profiles', 'user_id', 'users');

SELECT pg_temp.add_fk_if_compatible('fk_student_parents_student', 'student_parents', 'student_id', 'students');
SELECT pg_temp.add_fk_if_compatible('fk_student_parents_parent_user', 'student_parents', 'parent_id', 'users');

SELECT pg_temp.add_fk_if_compatible('fk_classes_center', 'classes', 'center_id', 'centers');
SELECT pg_temp.add_fk_if_compatible('fk_classes_teacher', 'classes', 'teacher_id', 'teachers');
SELECT pg_temp.add_fk_if_compatible('fk_classes_assistant_teacher', 'classes', 'assistant_teacher_id', 'teachers');
SELECT pg_temp.add_fk_if_compatible('fk_classes_program', 'classes', 'program_id', 'course_programs');

SELECT pg_temp.add_fk_if_compatible('fk_enrollments_student', 'enrollments', 'student_id', 'students');
SELECT pg_temp.add_fk_if_compatible('fk_enrollments_class', 'enrollments', 'class_id', 'classes');

SELECT pg_temp.add_fk_if_compatible('fk_assignments_class', 'assignments', 'class_id', 'classes');
SELECT pg_temp.add_fk_if_compatible('fk_assignment_submissions_student', 'assignment_submissions', 'student_id', 'students');
SELECT pg_temp.add_fk_if_compatible('fk_assignment_submissions_graded_by', 'assignment_submissions', 'graded_by', 'users');

SELECT pg_temp.add_fk_if_compatible('fk_exams_class', 'exams', 'class_id', 'classes');
SELECT pg_temp.add_fk_if_compatible('fk_exam_results_exam', 'exam_results', 'exam_id', 'exams');
SELECT pg_temp.add_fk_if_compatible('fk_exam_results_student', 'exam_results', 'student_id', 'students');
SELECT pg_temp.add_fk_if_compatible('fk_exam_results_graded_by', 'exam_results', 'graded_by', 'users');

SELECT pg_temp.add_fk_if_compatible('fk_class_schedules_class', 'class_schedules', 'class_id', 'classes');
SELECT pg_temp.add_fk_if_compatible('fk_class_sessions_class', 'class_sessions', 'class_id', 'classes');
SELECT pg_temp.add_fk_if_compatible('fk_class_sessions_teacher', 'class_sessions', 'teacher_id', 'teachers');
SELECT pg_temp.add_fk_if_compatible('fk_class_sessions_substitute_teacher', 'class_sessions', 'substitute_teacher_id', 'teachers');

SELECT pg_temp.add_fk_if_compatible('fk_session_attendance_session', 'session_attendance', 'session_id', 'class_sessions');
SELECT pg_temp.add_fk_if_compatible('fk_session_attendance_student', 'session_attendance', 'student_id', 'students');
SELECT pg_temp.add_fk_if_compatible('fk_session_attendance_recorded_by', 'session_attendance', 'recorded_by', 'users');

SELECT pg_temp.add_fk_if_compatible('fk_referrals_referrer_user', 'referrals', 'referrer_user_id', 'users');
SELECT pg_temp.add_fk_if_compatible('fk_referrals_student', 'referrals', 'student_id', 'students');
SELECT pg_temp.add_fk_if_compatible('fk_referrals_center', 'referrals', 'center_id', 'centers');
