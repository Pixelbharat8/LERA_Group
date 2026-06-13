-- Lead-based placement import deduplication (Connect → internal placement-record).
-- Idempotent (IF NOT EXISTS). Flyway runs in dev with spring.flyway.enabled=true.

ALTER TABLE student_skill_levels ADD COLUMN IF NOT EXISTS source_lead_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS uq_student_skill_levels_lead_import
    ON student_skill_levels (student_id, source_lead_id)
    WHERE source_lead_id IS NOT NULL;
