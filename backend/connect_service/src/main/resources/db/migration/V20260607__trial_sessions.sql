-- Trial / placement class funnel for CRM leads.
CREATE TABLE IF NOT EXISTS trial_sessions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id              UUID NOT NULL,
    center_id            UUID,
    program_id           UUID,
    scheduled_at         TIMESTAMP NOT NULL,
    duration_minutes     INTEGER DEFAULT 45,
    teacher_id           UUID,
    location             VARCHAR(255),
    status               VARCHAR(30) DEFAULT 'BOOKED',
    placement_level      VARCHAR(100),
    outcome_notes        TEXT,
    converted_student_id UUID,
    conversion_date      DATE,
    assigned_to          UUID,
    created_by           UUID,
    created_at           TIMESTAMP DEFAULT now(),
    updated_at           TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trial_lead      ON trial_sessions (lead_id);
CREATE INDEX IF NOT EXISTS idx_trial_center    ON trial_sessions (center_id);
CREATE INDEX IF NOT EXISTS idx_trial_scheduled ON trial_sessions (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_trial_status    ON trial_sessions (status);
