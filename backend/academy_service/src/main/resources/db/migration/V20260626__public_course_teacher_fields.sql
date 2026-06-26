-- =====================================================
-- V20260626: Public-site fields for course detail + teacher directory
-- =====================================================
-- Backs the public /courses detail (real curriculum/pricing/class structure) and the
-- /teachers directory (display name, photo, featured) added to the website. Idempotent:
-- IF NOT EXISTS keeps it safe on dev DBs where Hibernate ddl-auto already created the columns.

-- Course detail fields
ALTER TABLE course_programs ADD COLUMN IF NOT EXISTS duration_weeks    INTEGER;
ALTER TABLE course_programs ADD COLUMN IF NOT EXISTS sessions_per_week INTEGER;
ALTER TABLE course_programs ADD COLUMN IF NOT EXISTS max_class_size    INTEGER;
ALTER TABLE course_programs ADD COLUMN IF NOT EXISTS curriculum        TEXT;
ALTER TABLE course_programs ADD COLUMN IF NOT EXISTS curriculum_vi     TEXT;
ALTER TABLE course_programs ADD COLUMN IF NOT EXISTS benefits          TEXT;
ALTER TABLE course_programs ADD COLUMN IF NOT EXISTS benefits_vi       TEXT;

-- Teacher public-directory fields
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS display_name    VARCHAR(255);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS display_name_vi VARCHAR(255);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS photo_url       TEXT;
