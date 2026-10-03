-- =====================================================
-- V20260912: retire the LEG_* course programs V999 displaced
-- =====================================================
-- V999 replaced the old catalogue with eight canonical English programs. Where a legacy row
-- already held one of the canonical codes, V999 renamed it to LEG_<uuid> so the upsert could
-- proceed on unique(code) — but left it is_active = true. Both rows therefore appear in the
-- public course listing: on the dev database that is 14 active programs for 9 real courses, with
-- "LERA Starters", "LERA Explorers", "LERA Primary", "LERA Teens" and "Business English" each
-- shown twice, plus "IELTS & SAT Prep" alongside its replacement "IELTS & SAT Preparation".
--
-- Every LEG_* row is by construction a superseded predecessor: V999 renames a row ONLY when a
-- canonical program is taking over the code it held. So the test is the prefix, not a name match
-- (matching on name would miss the IELTS pair, which was renamed as well as recoded).
--
-- A fresh install has no LEG_* rows — V999 only renames rows that already existed, and the demo
-- seed no longer loads — so this is a no-op there. Rows still referenced by a class or a course
-- level are left active: those need a human to re-point the reference first.
--
-- The no-op above is NOT automatic, which is why this is wrapped. `course_levels` is owned by no
-- JPA entity, so ddl-auto=update never creates it — it exists only on databases old enough to
-- have had it. PostgreSQL resolves every table reference when it plans the statement, before any
-- row is matched, so the NOT EXISTS below raised
--     ERROR: relation "course_levels" does not exist
-- on a fresh database and took academy_service down with it. Measured on a Hibernate-built
-- schema, which is what a new deployment actually has.
DO $guard$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'course_levels') THEN
        RAISE NOTICE 'V20260912: course_levels absent (fresh database, no legacy catalogue) — nothing to retire, skipping';
        RETURN;
    END IF;

UPDATE course_programs leg
SET is_active = false,
    updated_at = NOW()
WHERE leg.code LIKE 'LEG\_%'
  AND leg.is_active
  AND NOT EXISTS (SELECT 1 FROM classes c       WHERE c.program_id = leg.id)
  AND NOT EXISTS (SELECT 1 FROM course_levels l WHERE l.program_id = leg.id);
END $guard$;
