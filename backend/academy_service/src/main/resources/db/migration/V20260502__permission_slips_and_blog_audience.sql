-- Schema additions for the consent / audience features added on 2026-05-02.
--
-- Until now these columns have been driven by Hibernate `ddl-auto=update`;
-- this migration codifies them so the schema is reproducible without ever
-- relying on Hibernate auto-DDL. Each statement is idempotent so the
-- migration is safe to re-run against any existing dev database.

-- 1. permission_slips: full table + soft-delete.
CREATE TABLE IF NOT EXISTS permission_slips (
    id              UUID PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    title_vi        VARCHAR(255),
    description     TEXT,
    description_vi  TEXT,
    activity_date   TIMESTAMP,
    due_date        TIMESTAMP,
    class_id        UUID,
    center_id       UUID,
    created_by      UUID,
    status          VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP NULL
);

ALTER TABLE permission_slips ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
CREATE INDEX IF NOT EXISTS idx_permission_slips_class    ON permission_slips(class_id);
CREATE INDEX IF NOT EXISTS idx_permission_slips_center   ON permission_slips(center_id);
CREATE INDEX IF NOT EXISTS idx_permission_slips_status   ON permission_slips(status);
CREATE INDEX IF NOT EXISTS idx_permission_slips_active   ON permission_slips(deleted_at)
    WHERE deleted_at IS NULL;

-- 2. permission_slip_responses: parent's YES/NO record for a given child.
CREATE TABLE IF NOT EXISTS permission_slip_responses (
    id            UUID PRIMARY KEY,
    slip_id       UUID NOT NULL,
    student_id    UUID NOT NULL,
    parent_id     UUID,
    response      VARCHAR(8) NOT NULL,    -- YES | NO
    comment       TEXT,
    responded_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_slip_student UNIQUE (slip_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_psr_parent ON permission_slip_responses(parent_id);

-- 3. blog_posts.audience — controls which role-bucket sees a post on the
--    parent / student / teacher resource hubs.
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS audience VARCHAR(32) NOT NULL DEFAULT 'ALL';
CREATE INDEX IF NOT EXISTS idx_blog_posts_audience ON blog_posts(audience);

COMMENT ON COLUMN permission_slips.deleted_at IS
    'Soft-delete timestamp; NULL means live. Audit and historical queries should use this instead of DELETEing.';
COMMENT ON COLUMN blog_posts.audience IS
    'Audience tag: ALL, PARENT, STUDENT, TEACHER. Non-staff readers can only see ALL or their own role''s audience.';
