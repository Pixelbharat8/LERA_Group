-- Internal staff training + certifications.
CREATE TABLE IF NOT EXISTS training_sessions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    category         VARCHAR(100),
    trainer          VARCHAR(255),
    scheduled_at     TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    location         VARCHAR(255),
    capacity         INTEGER,
    status           VARCHAR(30) DEFAULT 'SCHEDULED',
    center_id        UUID,
    created_by       UUID,
    created_at       TIMESTAMP DEFAULT now(),
    updated_at       TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_training_center    ON training_sessions (center_id);
CREATE INDEX IF NOT EXISTS idx_training_scheduled ON training_sessions (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_training_status    ON training_sessions (status);

CREATE TABLE IF NOT EXISTS training_registrations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    UUID NOT NULL,
    user_id       UUID NOT NULL,
    user_name     VARCHAR(255),
    status        VARCHAR(30) DEFAULT 'REGISTERED',
    registered_at TIMESTAMP DEFAULT now(),
    updated_at    TIMESTAMP DEFAULT now(),
    CONSTRAINT uq_treg_session_user UNIQUE (session_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_treg_session ON training_registrations (session_id);
CREATE INDEX IF NOT EXISTS idx_treg_user    ON training_registrations (user_id);

CREATE TABLE IF NOT EXISTS staff_certifications (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL,
    user_name     VARCHAR(255),
    name          VARCHAR(255) NOT NULL,
    issuer        VARCHAR(255),
    issue_date    DATE,
    expiry_date   DATE,
    credential_id VARCHAR(255),
    file_url      VARCHAR(500),
    notes         TEXT,
    center_id     UUID,
    created_at    TIMESTAMP DEFAULT now(),
    updated_at    TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cert_user   ON staff_certifications (user_id);
CREATE INDEX IF NOT EXISTS idx_cert_expiry ON staff_certifications (expiry_date);
