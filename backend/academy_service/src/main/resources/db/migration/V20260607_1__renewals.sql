-- Re-enrolment / retention pipeline.
CREATE TABLE IF NOT EXISTS renewals (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id            UUID NOT NULL,
    current_enrollment_id UUID,
    class_id              UUID,
    program_id            UUID,
    center_id             UUID,
    end_date              DATE,
    status                VARCHAR(30) DEFAULT 'PENDING',
    assigned_to           UUID,
    reminder_date         DATE,
    renewed_enrollment_id UUID,
    notes                 TEXT,
    created_at            TIMESTAMP DEFAULT now(),
    updated_at            TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_renewal_status     ON renewals (status);
CREATE INDEX IF NOT EXISTS idx_renewal_center     ON renewals (center_id);
CREATE INDEX IF NOT EXISTS idx_renewal_enrollment ON renewals (current_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_renewal_end_date   ON renewals (end_date);
