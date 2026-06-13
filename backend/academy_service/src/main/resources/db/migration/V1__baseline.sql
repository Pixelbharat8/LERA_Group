-- V1__baseline.sql — Academy Service indexes for 10M+ scale
-- These indexes complement Hibernate's auto-generated schema.

-- NOTE: This baseline migration must be safe across varying dev schemas.
-- We only create an index if BOTH the table and the column exist.

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='students' AND column_name='center_id') THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_students_center_id ON students (center_id)'; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='students' AND column_name='status') THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_students_status ON students (status)'; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='students' AND column_name='email') THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_students_email ON students (email)'; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='students' AND column_name='enrollment_date') THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_students_enrollment_date ON students (enrollment_date)'; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='teachers' AND column_name='center_id') THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_teachers_center_id ON teachers (center_id)'; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='teachers' AND column_name='status') THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_teachers_status ON teachers (status)'; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='teachers' AND column_name='specialization') THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_teachers_specialization ON teachers (specialization)'; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='classes' AND column_name='center_id') THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_classes_center_id ON classes (center_id)'; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='classes' AND column_name='teacher_id') THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes (teacher_id)'; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='classes' AND column_name='program_id') THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_classes_program_id ON classes (program_id)'; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='course_programs' AND column_name='center_id') THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_course_programs_center_id ON course_programs (center_id)'; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='assignments' AND column_name='class_id') THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON assignments (class_id)'; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='assignments' AND column_name='student_id') THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_assignments_student_id ON assignments (student_id)'; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='exams' AND column_name='class_id') THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_exams_class_id ON exams (class_id)'; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='exam_results' AND column_name='student_id') THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON exam_results (student_id)'; END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='enrollments' AND column_name='student_id') THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments (student_id)'; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='enrollments' AND column_name='class_id') THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments (class_id)'; END IF; END $$;
