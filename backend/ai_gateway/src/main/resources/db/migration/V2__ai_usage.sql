-- Per-user monthly AI token usage (backs the AI quota system).
-- One row per (user, calendar-month); tokens_used accumulates as the user makes AI calls.
CREATE TABLE IF NOT EXISTS ai_usage (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    period      VARCHAR(7)  NOT NULL,           -- 'YYYY-MM'
    tokens_used BIGINT      NOT NULL DEFAULT 0,
    updated_at  TIMESTAMP,
    CONSTRAINT uk_ai_usage_user_period UNIQUE (user_id, period)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id);
