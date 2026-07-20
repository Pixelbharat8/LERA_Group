-- Approved overtime pay now flows into generated payslips (previously ignored).
-- Add an overtime column alongside bonus/deductions so it shows as its own line.
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS overtime NUMERIC(12,2) NOT NULL DEFAULT 0;
