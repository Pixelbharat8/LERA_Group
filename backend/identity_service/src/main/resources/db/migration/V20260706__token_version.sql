-- Per-user token version, bumped on every password change/reset. Stamped into issued
-- JWTs as the "tv" claim; a refresh token whose tv no longer matches the user's current
-- value is rejected at /api/auth/refresh, so old/stolen refresh tokens can't mint new
-- access tokens after the password is changed. Additive + default 0 for existing rows.
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 0;
