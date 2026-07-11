-- Fix ID-type drift on bonuses.teacher_id and deductions.teacher_id.
--
-- Every other payroll entity keys teachers by UUID (teacher_salary_config, teacher_salaries,
-- teacher_overtime, salary_payouts, payroll all use uuid teacher_id, matching identity/academy
-- teacher ids). Bonus and Deduction were missed in that Long -> UUID migration and kept bigint,
-- so creating or listing a teacher's bonuses/deductions fails (a UUID can't bind to a bigint
-- column; the list endpoint's @PathVariable UUID never reaches a bigint query).
--
-- Retype both columns to uuid. GUARDED — only runs when the column is still bigint AND the table
-- is empty, so it can never null out an existing NOT NULL value or lose data. Verified 0 rows in dev.
-- Prod runs ddl-auto=validate, so this migration (Flyway runs first) is required for startup to pass.
DO $$
DECLARE t text; n bigint;
BEGIN
    FOREACH t IN ARRAY ARRAY['bonuses','deductions'] LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = t
                     AND column_name = 'teacher_id' AND data_type = 'bigint') THEN
            EXECUTE format('SELECT count(*) FROM %I', t) INTO n;
            IF n = 0 THEN
                EXECUTE format('ALTER TABLE %I ALTER COLUMN teacher_id DROP DEFAULT', t);
                EXECUTE format('ALTER TABLE %I ALTER COLUMN teacher_id TYPE uuid USING NULL::uuid', t);
                RAISE NOTICE '%.teacher_id retyped bigint -> uuid', t;
            ELSE
                RAISE NOTICE 'SKIPPED %.teacher_id — has % row(s); migrate its teacher UUIDs manually', t, n;
            END IF;
        END IF;
    END LOOP;
END $$;
