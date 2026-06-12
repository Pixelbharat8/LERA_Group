-- V1__baseline.sql — Payroll Service indexes for 10M+ scale

CREATE INDEX IF NOT EXISTS idx_payrolls_user_id ON payrolls (user_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_center_id ON payrolls (center_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_month_year ON payrolls (month, year);
CREATE INDEX IF NOT EXISTS idx_payrolls_status ON payrolls (status);
CREATE INDEX IF NOT EXISTS idx_salary_structures_user_id ON salary_structures (user_id);
