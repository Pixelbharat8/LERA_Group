-- V1__baseline.sql — Payment Service indexes for 10M+ scale

CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments (student_id);
CREATE INDEX IF NOT EXISTS idx_payments_center_id ON payments (center_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments (paid_at);
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON invoices (student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices (due_date);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds (payment_id);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_student_id ON fee_receipts (student_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_plans_student_id ON student_fee_plans (student_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_center_id ON ledger_entries (center_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction_date ON ledger_entries (transaction_date);
