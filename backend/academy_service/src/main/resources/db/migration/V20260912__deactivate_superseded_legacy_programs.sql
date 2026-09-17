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

UPDATE course_programs leg
SET is_active = false,
    updated_at = NOW()
WHERE leg.code LIKE 'LEG\_%'
  AND leg.is_active
  AND NOT EXISTS (SELECT 1 FROM classes c       WHERE c.program_id = leg.id)
  AND NOT EXISTS (SELECT 1 FROM course_levels l WHERE l.program_id = leg.id);
