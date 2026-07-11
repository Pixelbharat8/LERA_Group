-- Fix ID-type drift on assignments.created_by.
--
-- The Assignment entity's `createdBy` was migrated Long -> UUID (it holds a teacher's UUID, matching
-- teachers.id / Exam.createdBy), but the assignments.created_by column stayed `bigint`. Under the
-- deploy's `ddl-auto=update` profile Hibernate cannot auto-cast bigint->uuid, so the column keeps the
-- wrong type and every assignment insert fails (the entity binds a UUID to a bigint column) — teachers
-- literally cannot create or list assignments.
--
-- assignments is NOT in the V20260701 drop-and-recreate set (it is a core table that may be referenced),
-- so retype just this one column. GUARDED — only runs when the column is still bigint AND the table is
-- empty, so it can never null out an existing NOT NULL value or destroy data. Verified 0 rows in dev.
DO $$
DECLARE n bigint;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'assignments'
                 AND column_name = 'created_by' AND data_type = 'bigint') THEN
        SELECT count(*) INTO n FROM assignments;
        IF n = 0 THEN
            ALTER TABLE assignments ALTER COLUMN created_by DROP DEFAULT;
            ALTER TABLE assignments ALTER COLUMN created_by TYPE uuid USING NULL::uuid;
            RAISE NOTICE 'assignments.created_by retyped bigint -> uuid';
        ELSE
            RAISE NOTICE 'SKIPPED assignments.created_by — table has % row(s); migrate its created_by UUIDs manually', n;
        END IF;
    END IF;
END $$;
