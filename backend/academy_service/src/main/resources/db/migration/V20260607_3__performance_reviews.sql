-- Staff performance reviews / appraisals.
CREATE TABLE IF NOT EXISTS performance_reviews (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id    UUID NOT NULL,
    employee_name  VARCHAR(255),
    reviewer_id    UUID,
    reviewer_name  VARCHAR(255),
    period         VARCHAR(50),
    review_date    DATE,
    overall_rating INTEGER,
    strengths      TEXT,
    improvements   TEXT,
    goals          TEXT,
    status         VARCHAR(30) DEFAULT 'DRAFT',
    center_id      UUID,
    created_at     TIMESTAMP DEFAULT now(),
    updated_at     TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_perf_employee ON performance_reviews (employee_id);
CREATE INDEX IF NOT EXISTS idx_perf_reviewer ON performance_reviews (reviewer_id);
CREATE INDEX IF NOT EXISTS idx_perf_status   ON performance_reviews (status);
