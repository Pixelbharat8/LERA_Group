-- Track when a payment reminder was last sent (so we don't re-remind the same invoice daily).
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMP;
