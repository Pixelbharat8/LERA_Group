-- User feedback — replaces the former in-memory FeedbackController stub with a real table.
CREATE TABLE IF NOT EXISTS feedback (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID,
    user_name    VARCHAR(255),
    category     VARCHAR(100),
    subject      VARCHAR(255),
    message      TEXT NOT NULL,
    rating       INTEGER,
    status       VARCHAR(50) DEFAULT 'NEW',
    center_id    UUID,
    reviewed_by  VARCHAR(255),
    review_notes TEXT,
    created_at   TIMESTAMP DEFAULT now(),
    updated_at   TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_center ON feedback (center_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback (status);
