-- device_tokens — APNs / FCM / Web Push token registry for native push.
-- Created here so the schema is tracked in version control instead of being
-- left to Hibernate `ddl-auto=update`. Idempotent.

CREATE TABLE IF NOT EXISTS device_tokens (
    id            UUID PRIMARY KEY,
    user_id       UUID NOT NULL,
    platform      VARCHAR(16) NOT NULL,         -- IOS | ANDROID | WEB
    token         TEXT NOT NULL,
    device_name   VARCHAR(255),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    last_seen_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX        IF NOT EXISTS idx_device_tokens_user  ON device_tokens(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token);

COMMENT ON COLUMN device_tokens.token IS
    'Opaque platform token. APNs is short, FCM v1 is 152+ bytes — TEXT keeps both happy.';
