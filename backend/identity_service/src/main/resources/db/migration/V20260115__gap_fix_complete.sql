-- =====================================================
-- LERA Academy - "Gap Fix" migration  (NEUTRALIZED 2026-06-28)
-- =====================================================
-- The original V20260115 was DEMO/SEED data, not schema: it backfilled user accounts for
-- existing students/teachers and inserted hardcoded sample parents, staff, exams, assignments,
-- and 30 days of random attendance.
--
-- It was written against an EARLY schema that no longer matches the JPA entities, and it has
-- never successfully run anywhere (dev runs Flyway-off; prod is undeployed). A fresh-DB dry-run
-- showed it fails pervasively:
--   • references tables that no entity creates: `parents`, `staff`, `courses`, `attendance_records`
--   • references columns the entities lack: `exams.title`, `assignments.course_id`
--   • uses `uuid_generate_v4()` (uuid-ossp), while only `pgcrypto`/`gen_random_uuid()` is installed
--
-- Per the "entities are source of truth" decision, this migration is neutralized to a no-op:
--   • a fresh PROD database is empty, so the student/teacher backfill would do nothing anyway;
--   • the hardcoded sample parents/exams/attendance are demo data that must NOT seed into prod;
--   • runtime seeding of roles/admin users is already handled by identity_service DataLoader.
--
-- The full original is preserved in git history. If demo data is ever needed for a sandbox,
-- reintroduce it as a separate, schema-aligned, profile-gated seeder — not a baseline migration.

DO $$
BEGIN
    RAISE NOTICE 'V20260115 is intentionally a no-op (legacy demo/seed data; see file header).';
END $$;
