-- Harden core attendance relationships without validating old rows.

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

SELECT pg_temp.add_fk_if_compatible('fk_attendance_student', 'attendance', 'student_id', 'students');
SELECT pg_temp.add_fk_if_compatible('fk_attendance_center', 'attendance', 'center_id', 'centers');
SELECT pg_temp.add_fk_if_compatible('fk_attendance_session', 'attendance', 'session_id', 'class_sessions');
SELECT pg_temp.add_fk_if_compatible('fk_attendance_marked_by', 'attendance', 'marked_by', 'users');

SELECT pg_temp.add_fk_if_compatible('fk_attendance_exceptions_student', 'attendance_exceptions', 'student_id', 'students');
SELECT pg_temp.add_fk_if_compatible('fk_attendance_exceptions_class', 'attendance_exceptions', 'class_id', 'classes');
SELECT pg_temp.add_fk_if_compatible('fk_attendance_exceptions_center', 'attendance_exceptions', 'center_id', 'centers');
SELECT pg_temp.add_fk_if_compatible('fk_attendance_exceptions_requested_by', 'attendance_exceptions', 'requested_by', 'users');
SELECT pg_temp.add_fk_if_compatible('fk_attendance_exceptions_approved_by', 'attendance_exceptions', 'approved_by', 'users');

SELECT pg_temp.add_fk_if_compatible('fk_teacher_sessions_teacher', 'teacher_sessions', 'teacher_id', 'teachers');
SELECT pg_temp.add_fk_if_compatible('fk_teacher_sessions_class', 'teacher_sessions', 'class_id', 'classes');
SELECT pg_temp.add_fk_if_compatible('fk_teacher_sessions_class_session', 'teacher_sessions', 'class_session_id', 'class_sessions');

SELECT pg_temp.add_fk_if_compatible('fk_teacher_staff_leaves_user', 'teacher_staff_leaves', 'user_id', 'users');
SELECT pg_temp.add_fk_if_compatible('fk_teacher_staff_leaves_center', 'teacher_staff_leaves', 'center_id', 'centers');
SELECT pg_temp.add_fk_if_compatible('fk_teacher_staff_leaves_reporting_manager', 'teacher_staff_leaves', 'reporting_manager_id', 'users');
SELECT pg_temp.add_fk_if_compatible('fk_teacher_staff_leaves_center_manager', 'teacher_staff_leaves', 'center_manager_id', 'users');
SELECT pg_temp.add_fk_if_compatible('fk_teacher_staff_leaves_requested_by', 'teacher_staff_leaves', 'requested_by', 'users');
SELECT pg_temp.add_fk_if_compatible('fk_teacher_staff_leaves_approved_by', 'teacher_staff_leaves', 'approved_by', 'users');
