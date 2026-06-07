-- Internal recruitment / ATS: job openings + applications.
CREATE TABLE IF NOT EXISTS job_openings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    department      VARCHAR(255),
    center_id       UUID,
    location        VARCHAR(255),
    employment_type VARCHAR(50),
    description     TEXT,
    requirements    TEXT,
    status          VARCHAR(30) DEFAULT 'OPEN',
    openings_count  INTEGER DEFAULT 1,
    posted_date     DATE,
    closing_date    DATE,
    created_by      UUID,
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_job_status ON job_openings (status);
CREATE INDEX IF NOT EXISTS idx_job_center ON job_openings (center_id);

CREATE TABLE IF NOT EXISTS job_applications (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_opening_id    UUID NOT NULL,
    applicant_name    VARCHAR(255) NOT NULL,
    email             VARCHAR(255),
    phone             VARCHAR(50),
    applicant_user_id UUID,
    resume_url        VARCHAR(500),
    cover_note        TEXT,
    source            VARCHAR(100),
    status            VARCHAR(30) DEFAULT 'APPLIED',
    notes             TEXT,
    applied_at        TIMESTAMP DEFAULT now(),
    updated_at        TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_app_job    ON job_applications (job_opening_id);
CREATE INDEX IF NOT EXISTS idx_app_status ON job_applications (status);
