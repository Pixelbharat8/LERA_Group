-- Align assignment submissions with assignments.id so submissions can be FK-linked.
DO $$
DECLARE
    v_assignment_id_type TEXT;
    v_submission_count BIGINT;
    v_null_assignment_count BIGINT;
BEGIN
    IF to_regclass('public.assignment_submissions') IS NULL
            OR to_regclass('public.assignments') IS NULL THEN
        RETURN;
    END IF;

    SELECT udt_name
    INTO v_assignment_id_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assignment_submissions'
      AND column_name = 'assignment_id';

    IF v_assignment_id_type IS NULL THEN
        ALTER TABLE assignment_submissions ADD COLUMN assignment_id BIGINT;
    ELSIF v_assignment_id_type <> 'int8' THEN
        EXECUTE 'SELECT count(*) FROM assignment_submissions' INTO v_submission_count;

        IF v_submission_count > 0 THEN
            RAISE EXCEPTION
                'assignment_submissions.assignment_id is %, but assignments.id is bigint and assignment_submissions has % rows. Migrate existing assignment references before applying this migration.',
                v_assignment_id_type,
                v_submission_count;
        END IF;

        ALTER TABLE assignment_submissions DROP COLUMN assignment_id;
        ALTER TABLE assignment_submissions ADD COLUMN assignment_id BIGINT;
    END IF;

    EXECUTE 'SELECT count(*) FROM assignment_submissions WHERE assignment_id IS NULL'
    INTO v_null_assignment_count;

    IF v_null_assignment_count > 0 THEN
        RAISE EXCEPTION
            'assignment_submissions.assignment_id has % null rows. Backfill assignment references before enforcing NOT NULL.',
            v_null_assignment_count;
    END IF;

    ALTER TABLE assignment_submissions ALTER COLUMN assignment_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id_fk
        ON assignment_submissions(assignment_id);

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'assignment_submissions'
          AND constraint_name = 'fk_assignment_submissions_assignment'
    ) THEN
        ALTER TABLE assignment_submissions
            ADD CONSTRAINT fk_assignment_submissions_assignment
            FOREIGN KEY (assignment_id) REFERENCES assignments(id) NOT VALID;
    END IF;
END $$;
