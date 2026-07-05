-- Force-password-change flag for auto-provisioned import accounts (default password on first login).
-- Additive + nullable-with-default; existing users default to false (not forced).
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_change_required BOOLEAN DEFAULT false;
