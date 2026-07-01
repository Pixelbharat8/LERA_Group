-- V1__baseline.sql — Payment Service indexes for 10M+ scale.
--
-- Guarded (2026-07-01): every index below targets a table owned by a JPA entity (created by
-- Hibernate ddl-auto) and/or by a later migration (V192). When Flyway runs V1 on a not-yet-
-- populated schema those tables/columns don't exist yet, so an unguarded CREATE INDEX aborts
-- the whole migration (42P01 undefined table / 42703 undefined column) and the service fails to
-- start under the prod/docker profile (validate + Flyway). Each index is therefore created only
-- when its table AND columns actually exist; otherwise it's skipped and self-heals on a later
-- start once the entity/migration has built the table. Mirrors the guard used in V192.
CREATE OR REPLACE FUNCTION pg_temp.v1_idx(p_table text, p_cols text[], p_ddl text) RETURNS void AS $$
DECLARE c text;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema = 'public' AND table_name = p_table) THEN
        RETURN;  -- table not created yet (fresh schema) → skip, re-applied on a later start
    END IF;
    FOREACH c IN ARRAY p_cols LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema = 'public' AND table_name = p_table AND column_name = c) THEN
            RETURN;  -- a required column is absent on the live (entity-owned) table → skip
        END IF;
    END LOOP;
    EXECUTE p_ddl;
END;
$$ LANGUAGE plpgsql;

SELECT pg_temp.v1_idx('payments', ARRAY['student_id'], 'CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments (student_id)');
SELECT pg_temp.v1_idx('payments', ARRAY['center_id'], 'CREATE INDEX IF NOT EXISTS idx_payments_center_id ON payments (center_id)');
SELECT pg_temp.v1_idx('payments', ARRAY['status'], 'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status)');
SELECT pg_temp.v1_idx('payments', ARRAY['paid_at'], 'CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments (paid_at)');
SELECT pg_temp.v1_idx('invoices', ARRAY['student_id'], 'CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON invoices (student_id)');
SELECT pg_temp.v1_idx('invoices', ARRAY['status'], 'CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status)');
SELECT pg_temp.v1_idx('invoices', ARRAY['due_date'], 'CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices (due_date)');
SELECT pg_temp.v1_idx('refunds', ARRAY['payment_id'], 'CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds (payment_id)');
SELECT pg_temp.v1_idx('fee_receipts', ARRAY['student_id'], 'CREATE INDEX IF NOT EXISTS idx_fee_receipts_student_id ON fee_receipts (student_id)');
SELECT pg_temp.v1_idx('student_fee_plans', ARRAY['student_id'], 'CREATE INDEX IF NOT EXISTS idx_student_fee_plans_student_id ON student_fee_plans (student_id)');
SELECT pg_temp.v1_idx('ledger_entries', ARRAY['center_id'], 'CREATE INDEX IF NOT EXISTS idx_ledger_entries_center_id ON ledger_entries (center_id)');
SELECT pg_temp.v1_idx('ledger_entries', ARRAY['transaction_date'], 'CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction_date ON ledger_entries (transaction_date)');
