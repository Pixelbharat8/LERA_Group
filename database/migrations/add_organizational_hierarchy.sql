-- ========================================
-- ORGANIZATIONAL HIERARCHY MIGRATION
-- For Scaling to 50,000+ Users
-- Date: December 26, 2025
-- ========================================

-- 1. CREATE DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_code VARCHAR(50) UNIQUE NOT NULL,
    department_name VARCHAR(200) NOT NULL,
    department_name_vi VARCHAR(200),
    department_type VARCHAR(50) NOT NULL CHECK (department_type IN ('ACADEMIC', 'ADMINISTRATIVE', 'IT', 'MARKETING', 'HR', 'FINANCE', 'OPERATIONS', 'STUDENT_SERVICES')),
    parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
    office_type VARCHAR(50) NOT NULL CHECK (office_type IN ('MAIN_OFFICE', 'BRANCH')),
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast queries
CREATE INDEX idx_departments_center ON departments(center_id);
CREATE INDEX idx_departments_type ON departments(department_type);
CREATE INDEX idx_departments_office_type ON departments(office_type);
CREATE INDEX idx_departments_parent ON departments(parent_department_id);
CREATE INDEX idx_departments_manager ON departments(manager_id);
CREATE INDEX idx_departments_status ON departments(status);

-- 2. ADD ORGANIZATIONAL COLUMNS TO USERS TABLE
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS office_type VARCHAR(50) DEFAULT 'BRANCH' CHECK (office_type IN ('MAIN_OFFICE', 'BRANCH'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reports_to UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN', 'FREELANCE'));

-- Create indexes on users table
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_office_type ON users(office_type);
CREATE INDEX IF NOT EXISTS idx_users_employee_code ON users(employee_code);
CREATE INDEX IF NOT EXISTS idx_users_reports_to ON users(reports_to);
CREATE INDEX IF NOT EXISTS idx_users_employment_type ON users(employment_type);

-- 3. ADD ORGANIZATIONAL COLUMNS TO TEACHERS TABLE
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS office_type VARCHAR(50) DEFAULT 'BRANCH' CHECK (office_type IN ('MAIN_OFFICE', 'BRANCH'));
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN'));
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES teachers(id) ON DELETE SET NULL;

-- Create indexes on teachers table
CREATE INDEX IF NOT EXISTS idx_teachers_department ON teachers(department_id);
CREATE INDEX IF NOT EXISTS idx_teachers_office_type ON teachers(office_type);
CREATE INDEX IF NOT EXISTS idx_teachers_employment_type ON teachers(employment_type);
CREATE INDEX IF NOT EXISTS idx_teachers_supervisor ON teachers(supervisor_id);

-- 4. INSERT DEFAULT DEPARTMENTS FOR MAIN OFFICE

-- Get the first center ID (or create if none exists)
DO $$
DECLARE
    main_center_id UUID;
BEGIN
    -- Get or create main center
    SELECT id INTO main_center_id FROM centers LIMIT 1;
    
    IF main_center_id IS NULL THEN
        INSERT INTO centers (code, name, city, status)
        VALUES ('MAIN', 'LERA Academy Main Office', 'Hải Phòng', 'ACTIVE')
        RETURNING id INTO main_center_id;
    END IF;

    -- Insert Main Office Departments
    INSERT INTO departments (department_code, department_name, department_type, center_id, office_type, description, status)
    VALUES 
    -- Academic Departments
    ('DEPT-ACD-001', 'Teaching Department', 'ACADEMIC', main_center_id, 'MAIN_OFFICE', 'Main teaching department for all instructors', 'ACTIVE'),
    ('DEPT-ACD-002', 'Curriculum Development', 'ACADEMIC', main_center_id, 'MAIN_OFFICE', 'Curriculum design and educational content', 'ACTIVE'),
    ('DEPT-ACD-003', 'Academic Coordination', 'ACADEMIC', main_center_id, 'MAIN_OFFICE', 'Coordination of academic activities', 'ACTIVE'),
    
    -- Administrative Departments
    ('DEPT-ADM-001', 'General Administration', 'ADMINISTRATIVE', main_center_id, 'MAIN_OFFICE', 'General administrative tasks and operations', 'ACTIVE'),
    ('DEPT-ADM-002', 'Reception & Front Desk', 'ADMINISTRATIVE', main_center_id, 'MAIN_OFFICE', 'Front desk and visitor management', 'ACTIVE'),
    
    -- HR Department
    ('DEPT-HR-001', 'Human Resources', 'HR', main_center_id, 'MAIN_OFFICE', 'Employee recruitment, training, and management', 'ACTIVE'),
    ('DEPT-HR-002', 'Training & Development', 'HR', main_center_id, 'MAIN_OFFICE', 'Employee training and professional development', 'ACTIVE'),
    
    -- Finance Department
    ('DEPT-FIN-001', 'Finance & Accounting', 'FINANCE', main_center_id, 'MAIN_OFFICE', 'Financial management and accounting', 'ACTIVE'),
    ('DEPT-FIN-002', 'Billing & Collections', 'FINANCE', main_center_id, 'MAIN_OFFICE', 'Student billing and payment processing', 'ACTIVE'),
    
    -- IT Department
    ('DEPT-IT-001', 'IT & Technology', 'IT', main_center_id, 'MAIN_OFFICE', 'IT support and system administration', 'ACTIVE'),
    ('DEPT-IT-002', 'Software Development', 'IT', main_center_id, 'MAIN_OFFICE', 'Internal software development', 'ACTIVE'),
    
    -- Marketing Department
    ('DEPT-MKT-001', 'Marketing & Sales', 'MARKETING', main_center_id, 'MAIN_OFFICE', 'Marketing campaigns and sales', 'ACTIVE'),
    ('DEPT-MKT-002', 'Content & Social Media', 'MARKETING', main_center_id, 'MAIN_OFFICE', 'Content creation and social media management', 'ACTIVE'),
    
    -- Operations Department
    ('DEPT-OPS-001', 'Operations Management', 'OPERATIONS', main_center_id, 'MAIN_OFFICE', 'Daily operations and logistics', 'ACTIVE'),
    ('DEPT-OPS-002', 'Facility Management', 'OPERATIONS', main_center_id, 'MAIN_OFFICE', 'Building and facility maintenance', 'ACTIVE'),
    
    -- Student Services Department
    ('DEPT-STU-001', 'Student Support Services', 'STUDENT_SERVICES', main_center_id, 'MAIN_OFFICE', 'Student support and counseling', 'ACTIVE'),
    ('DEPT-STU-002', 'Student Advising', 'STUDENT_SERVICES', main_center_id, 'MAIN_OFFICE', 'Academic and career advising', 'ACTIVE')
    ON CONFLICT (department_code) DO NOTHING;
    
END $$;

-- 5. UPDATE EXISTING USERS (OPTIONAL - FOR MIGRATION)
-- Set all existing users to BRANCH office type by default
UPDATE users SET office_type = 'BRANCH' WHERE office_type IS NULL;

-- 6. CREATE EMPLOYEE CODE GENERATOR FUNCTION
CREATE OR REPLACE FUNCTION generate_employee_code(role_name VARCHAR) 
RETURNS VARCHAR AS $$
DECLARE
    prefix VARCHAR(3);
    next_number INT;
    year VARCHAR(4);
    new_code VARCHAR(50);
BEGIN
    -- Determine prefix based on role
    prefix := CASE 
        WHEN role_name = 'TEACHER' THEN 'TCH'
        WHEN role_name = 'TA' THEN 'TA'
        WHEN role_name = 'STAFF' THEN 'STF'
        WHEN role_name = 'CENTER_ADMIN' THEN 'ADM'
        WHEN role_name = 'SUPER_ADMIN' THEN 'SA'
        ELSE 'EMP'
    END;
    
    -- Get current year
    year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Get next number for this prefix and year
    SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code FROM '[0-9]+$') AS INT)), 0) + 1
    INTO next_number
    FROM users
    WHERE employee_code LIKE prefix || '-' || year || '-%';
    
    -- Format: TCH-2025-001
    new_code := prefix || '-' || year || '-' || LPAD(next_number::VARCHAR, 3, '0');
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- 7. CREATE TRIGGER TO AUTO-GENERATE EMPLOYEE CODE
CREATE OR REPLACE FUNCTION before_insert_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-generate employee code if not provided
    IF NEW.employee_code IS NULL OR NEW.employee_code = '' THEN
        NEW.employee_code := generate_employee_code(
            (SELECT role_name FROM roles WHERE id = NEW.role_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_before_insert_user ON users;
CREATE TRIGGER trg_before_insert_user
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION before_insert_user();

-- 8. CREATE VIEWS FOR REPORTING

-- Department Employee Count View
CREATE OR REPLACE VIEW vw_department_employee_count AS
SELECT 
    d.id as department_id,
    d.department_code,
    d.department_name,
    d.department_type,
    d.office_type,
    c.name as center_name,
    COUNT(u.id) as employee_count,
    COUNT(CASE WHEN u.status = 'ACTIVE' THEN 1 END) as active_count,
    COUNT(CASE WHEN r.role_name = 'TEACHER' THEN 1 END) as teacher_count,
    COUNT(CASE WHEN r.role_name = 'TA' THEN 1 END) as ta_count,
    COUNT(CASE WHEN r.role_name = 'STAFF' THEN 1 END) as staff_count
FROM departments d
LEFT JOIN centers c ON d.center_id = c.id
LEFT JOIN users u ON d.id = u.department_id
LEFT JOIN roles r ON u.role_id = r.id
GROUP BY d.id, d.department_code, d.department_name, d.department_type, d.office_type, c.name;

-- Office Type Distribution View
CREATE OR REPLACE VIEW vw_office_type_distribution AS
SELECT 
    office_type,
    COUNT(*) as total_employees,
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_employees,
    COUNT(CASE WHEN r.role_name = 'TEACHER' THEN 1 END) as teachers,
    COUNT(CASE WHEN r.role_name = 'TA' THEN 1 END) as teaching_assistants,
    COUNT(CASE WHEN r.role_name = 'STAFF' THEN 1 END) as staff
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
GROUP BY office_type;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check departments created
SELECT COUNT(*) as total_departments FROM departments;

-- Check department types
SELECT department_type, COUNT(*) as count 
FROM departments 
GROUP BY department_type 
ORDER BY count DESC;

-- Check office types
SELECT office_type, COUNT(*) as count 
FROM departments 
GROUP BY office_type;

-- ========================================
-- ROLLBACK SCRIPT (IF NEEDED)
-- ========================================
/*
-- To rollback this migration:

-- Remove triggers
DROP TRIGGER IF EXISTS trg_before_insert_user ON users;
DROP FUNCTION IF EXISTS before_insert_user();
DROP FUNCTION IF EXISTS generate_employee_code(VARCHAR);

-- Remove views
DROP VIEW IF EXISTS vw_office_type_distribution;
DROP VIEW IF EXISTS vw_department_employee_count;

-- Remove columns from tables
ALTER TABLE teachers DROP COLUMN IF EXISTS supervisor_id;
ALTER TABLE teachers DROP COLUMN IF EXISTS employment_type;
ALTER TABLE teachers DROP COLUMN IF EXISTS office_type;
ALTER TABLE teachers DROP COLUMN IF EXISTS department_id;

ALTER TABLE users DROP COLUMN IF EXISTS employment_type;
ALTER TABLE users DROP COLUMN IF EXISTS reports_to;
ALTER TABLE users DROP COLUMN IF EXISTS job_title;
ALTER TABLE users DROP COLUMN IF EXISTS employee_code;
ALTER TABLE users DROP COLUMN IF EXISTS office_type;
ALTER TABLE users DROP COLUMN IF EXISTS department_id;

-- Remove departments table
DROP TABLE IF EXISTS departments CASCADE;
*/

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
SELECT 'Organizational Hierarchy Migration Completed Successfully!' as status;
