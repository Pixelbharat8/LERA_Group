-- Vingroup-style itemized payslip: optional earning/deduction line items stored as JSON text.
-- Additive & nullable — existing payslips are unaffected. Guarded so re-runs are safe.
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS earnings TEXT;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS deduction_items TEXT;
