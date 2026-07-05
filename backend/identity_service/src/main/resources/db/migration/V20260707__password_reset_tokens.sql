-- Persistent store for password-reset / onboarding set-password tokens (was an in-memory map,
-- which lost outstanding links on restart and didn't work across multiple identity instances).
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token       VARCHAR(64) PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    expires_at  BIGINT NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prt_expires_at ON password_reset_tokens(expires_at);
