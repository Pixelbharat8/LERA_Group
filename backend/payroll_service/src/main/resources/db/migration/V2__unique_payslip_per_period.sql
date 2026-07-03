-- Backstop against duplicate payslips. The app does find-or-update per (teacher, period), which
-- covers the sequential re-run, but two overlapping /generate calls can still race (TOCTOU) and
-- double-insert. This DB unique index makes the second insert fail instead of double-paying.
-- Guarded: created only when no duplicate rows already exist (so it can't fail the migration on a
-- DB that somehow has dupes — dedupe those first, then this applies on the next start).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM (
            SELECT teacher_id, pay_period_start, pay_period_end
            FROM payroll
            GROUP BY teacher_id, pay_period_start, pay_period_end
            HAVING count(*) > 1
        ) dups
    ) THEN
        CREATE UNIQUE INDEX IF NOT EXISTS ux_payroll_teacher_period
            ON payroll (teacher_id, pay_period_start, pay_period_end);
    ELSE
        RAISE NOTICE 'ux_payroll_teacher_period skipped — duplicate payslips exist; dedupe first.';
    END IF;
END $$;
