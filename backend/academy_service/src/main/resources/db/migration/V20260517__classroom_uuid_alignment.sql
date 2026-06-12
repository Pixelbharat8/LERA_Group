-- Align classroom-related FK columns with UUID-based classes (JPA entities).

-- assignments.class_id → UUID
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'assignments'
          AND column_name = 'class_id' AND data_type = 'bigint'
    ) THEN
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS class_id_uuid UUID;
        UPDATE assignments a
        SET class_id_uuid = c.id
        FROM classes c
        WHERE a.class_id IS NOT NULL AND c.id::text = a.class_id::text;
        ALTER TABLE assignments DROP COLUMN class_id;
        ALTER TABLE assignments RENAME COLUMN class_id_uuid TO class_id;
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'assignments'
          AND column_name = 'class_id' AND data_type IN ('character varying', 'text')
    ) THEN
        ALTER TABLE assignments
            ALTER COLUMN class_id TYPE UUID USING class_id::uuid;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_assignments_class_id_uuid ON assignments(class_id);

-- class_schedule_exceptions.class_id → UUID
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'class_schedule_exceptions'
          AND column_name = 'class_id' AND data_type = 'bigint'
    ) THEN
        ALTER TABLE class_schedule_exceptions ADD COLUMN IF NOT EXISTS class_id_uuid UUID;
        UPDATE class_schedule_exceptions e
        SET class_id_uuid = c.id
        FROM classes c
        WHERE e.class_id IS NOT NULL AND c.id::text = e.class_id::text;
        ALTER TABLE class_schedule_exceptions DROP COLUMN class_id;
        ALTER TABLE class_schedule_exceptions RENAME COLUMN class_id_uuid TO class_id;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'class_schedule_exceptions'
          AND column_name = 'class_id'
    ) THEN
        NULL;
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'class_schedule_exceptions'
          AND column_name = 'class_id' AND udt_name <> 'uuid'
    ) THEN
        ALTER TABLE class_schedule_exceptions
            ALTER COLUMN class_id TYPE UUID USING class_id::text::uuid;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_class_schedule_exceptions_class_id ON class_schedule_exceptions(class_id);

-- class_schedule_exceptions.schedule_id, new_teacher_id, created_by → UUID where still bigint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'class_schedule_exceptions'
          AND column_name = 'schedule_id' AND data_type = 'bigint'
    ) THEN
        ALTER TABLE class_schedule_exceptions ADD COLUMN schedule_id_uuid UUID;
        ALTER TABLE class_schedule_exceptions DROP COLUMN schedule_id;
        ALTER TABLE class_schedule_exceptions RENAME COLUMN schedule_id_uuid TO schedule_id;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'class_schedule_exceptions'
          AND column_name = 'new_teacher_id' AND data_type = 'bigint'
    ) THEN
        ALTER TABLE class_schedule_exceptions ADD COLUMN new_teacher_id_uuid UUID;
        ALTER TABLE class_schedule_exceptions DROP COLUMN new_teacher_id;
        ALTER TABLE class_schedule_exceptions RENAME COLUMN new_teacher_id_uuid TO new_teacher_id;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'class_schedule_exceptions'
          AND column_name = 'created_by' AND data_type = 'bigint'
    ) THEN
        ALTER TABLE class_schedule_exceptions ADD COLUMN created_by_uuid UUID;
        ALTER TABLE class_schedule_exceptions DROP COLUMN created_by;
        ALTER TABLE class_schedule_exceptions RENAME COLUMN created_by_uuid TO created_by;
    END IF;
END $$;

-- class_sessions.teacher_id / substitute_teacher_id → UUID (nullable)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'class_sessions'
          AND column_name = 'teacher_id' AND data_type = 'bigint'
    ) THEN
        ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS teacher_id_uuid UUID;
        ALTER TABLE class_sessions DROP COLUMN teacher_id;
        ALTER TABLE class_sessions RENAME COLUMN teacher_id_uuid TO teacher_id;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'class_sessions'
          AND column_name = 'substitute_teacher_id' AND data_type = 'bigint'
    ) THEN
        ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS substitute_teacher_id_uuid UUID;
        ALTER TABLE class_sessions DROP COLUMN substitute_teacher_id;
        ALTER TABLE class_sessions RENAME COLUMN substitute_teacher_id_uuid TO substitute_teacher_id;
    END IF;
END $$;
