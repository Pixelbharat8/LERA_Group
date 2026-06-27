-- V1__baseline.sql — Payroll Service indexes for 10M+ scale
--
-- FIXED 2026-06-28 (pre-launch fresh-DB Flyway audit): the original indexes referenced
-- a non-existent `payrolls` table (the real entity is `payroll`, singular), a non-existent
-- `salary_structures` table, and columns the `payroll` entity does not have (`user_id`,
-- `month`, `year`). Every line would have failed Flyway on a fresh prod DB. Rewritten to the
-- real tables/columns, verified against the live schema:
--   payroll(teacher_id, center_id, status, paid_at) · teacher_salary_config(teacher_id).
-- Safe to edit: V1 had never run anywhere (dev runs Flyway-off; prod not yet deployed).

CREATE INDEX IF NOT EXISTS idx_payroll_teacher_id ON payroll (teacher_id);
CREATE INDEX IF NOT EXISTS idx_payroll_center_id ON payroll (center_id);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll (status);
CREATE INDEX IF NOT EXISTS idx_payroll_paid_at ON payroll (paid_at);
CREATE INDEX IF NOT EXISTS idx_teacher_salary_config_teacher_id ON teacher_salary_config (teacher_id);
