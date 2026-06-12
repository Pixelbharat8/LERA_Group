-- ============================================
-- ASSIGN CENTER IDS TO EXISTING DATA
-- This script assigns center_id to teachers, students, classes, etc.
-- Run: PGPASSWORD=lera psql -h localhost -U lera -d lera -f assign_center_ids.sql
-- ============================================

-- First, let's see what centers we have
SELECT 'Available Centers:' as info;
SELECT id, name, code FROM centers;

-- ============================================
-- Get the first center ID (default center)
-- ============================================
DO $$
DECLARE
    default_center_id UUID;
    marina_center_id UUID;
    teachers_updated INT;
    students_updated INT;
    classes_updated INT;
    classrooms_updated INT;
BEGIN
    -- Try to find the Marina center first (from your screenshot)
    SELECT id INTO marina_center_id FROM centers 
    WHERE name ILIKE '%marina%' OR name ILIKE '%vinhomes%' 
    LIMIT 1;
    
    -- If not found, use the first center
    IF marina_center_id IS NULL THEN
        SELECT id INTO default_center_id FROM centers ORDER BY created_at LIMIT 1;
    ELSE
        default_center_id := marina_center_id;
    END IF;
    
    IF default_center_id IS NULL THEN
        RAISE NOTICE 'ERROR: No centers found in database. Please create centers first.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Using center ID: %', default_center_id;

    -- ============================================
    -- ASSIGN TEACHERS TO CENTERS
    -- ============================================
    UPDATE teachers 
    SET center_id = default_center_id 
    WHERE center_id IS NULL;
    GET DIAGNOSTICS teachers_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % teachers with center_id', teachers_updated;

    -- ============================================
    -- ASSIGN STUDENTS TO CENTERS
    -- ============================================
    UPDATE students 
    SET center_id = default_center_id 
    WHERE center_id IS NULL;
    GET DIAGNOSTICS students_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % students with center_id', students_updated;

    -- ============================================
    -- ASSIGN CLASSES TO CENTERS
    -- ============================================
    UPDATE classes 
    SET center_id = default_center_id 
    WHERE center_id IS NULL;
    GET DIAGNOSTICS classes_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % classes with center_id', classes_updated;

    -- ============================================
    -- ASSIGN CLASSROOMS TO CENTERS (if table exists)
    -- ============================================
    BEGIN
        UPDATE classrooms 
        SET center_id = default_center_id 
        WHERE center_id IS NULL;
        GET DIAGNOSTICS classrooms_updated = ROW_COUNT;
        RAISE NOTICE 'Updated % classrooms with center_id', classrooms_updated;
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Classrooms table does not exist, skipping';
    END;

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
SELECT '===========================================' as separator;
SELECT 'VERIFICATION - Entities with/without center_id:' as info;

SELECT 'Teachers' as entity, 
       COUNT(*) as total, 
       COUNT(center_id) as with_center,
       COUNT(*) - COUNT(center_id) as without_center
FROM teachers
UNION ALL
SELECT 'Students', COUNT(*), COUNT(center_id), COUNT(*) - COUNT(center_id) FROM students
UNION ALL
SELECT 'Classes', COUNT(*), COUNT(center_id), COUNT(*) - COUNT(center_id) FROM classes;

SELECT '===========================================' as separator;
SELECT 'ENTITIES BY CENTER:' as info;

SELECT 'Teachers by Center' as report;
SELECT c.name as center_name, COUNT(t.id) as count 
FROM centers c 
LEFT JOIN teachers t ON t.center_id = c.id 
GROUP BY c.id, c.name
ORDER BY c.name;

SELECT 'Students by Center' as report;
SELECT c.name as center_name, COUNT(s.id) as count 
FROM centers c 
LEFT JOIN students s ON s.center_id = c.id 
GROUP BY c.id, c.name
ORDER BY c.name;

SELECT 'Classes by Center' as report;
SELECT c.name as center_name, COUNT(cl.id) as count 
FROM centers c 
LEFT JOIN classes cl ON cl.center_id = c.id 
GROUP BY c.id, c.name
ORDER BY c.name;
