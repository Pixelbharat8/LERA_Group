-- Update existing departments table to support organizational hierarchy
-- This migration adds missing columns to the departments table

-- Add missing columns to departments table
ALTER TABLE departments ADD COLUMN IF NOT EXISTS department_code VARCHAR(50) UNIQUE;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS department_name VARCHAR(200);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS department_name_vi VARCHAR(200);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS department_type VARCHAR(50); -- ACADEMIC, ADMINISTRATIVE, HR, etc.
ALTER TABLE departments ADD COLUMN IF NOT EXISTS office_type VARCHAR(50); -- MAIN_OFFICE, BRANCH
ALTER TABLE departments ADD COLUMN IF NOT EXISTS center_id UUID REFERENCES centers(id);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS parent_department_id UUID REFERENCES departments(id);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_departments_center_id ON departments(center_id);
CREATE INDEX IF NOT EXISTS idx_departments_department_type ON departments(department_type);
CREATE INDEX IF NOT EXISTS idx_departments_office_type ON departments(office_type);
CREATE INDEX IF NOT EXISTS idx_departments_parent_department_id ON departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON departments(manager_id);
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);

-- Insert default departments if they don't exist
DO $$
DECLARE
    main_center_id UUID;
BEGIN
    -- Get the main center ID
    SELECT id INTO main_center_id FROM centers LIMIT 1;
    
    IF main_center_id IS NOT NULL THEN
        -- Insert departments only if they don't already exist
        INSERT INTO departments (name, department_code, department_name, department_type, center_id, office_type, description, status)
        VALUES 
        -- Academic Departments
        ('Teaching Department', 'DEPT-ACD-001', 'Teaching Department', 'ACADEMIC', main_center_id, 'MAIN_OFFICE', 'Main teaching department for all instructors', 'ACTIVE'),
        ('Curriculum Development', 'DEPT-ACD-002', 'Curriculum Development', 'ACADEMIC', main_center_id, 'MAIN_OFFICE', 'Curriculum design and educational content', 'ACTIVE'),
        ('Academic Coordination', 'DEPT-ACD-003', 'Academic Coordination', 'ACADEMIC', main_center_id, 'MAIN_OFFICE', 'Coordination of academic activities', 'ACTIVE'),
        
        -- Administrative Departments
        ('General Administration', 'DEPT-ADM-001', 'General Administration', 'ADMINISTRATIVE', main_center_id, 'MAIN_OFFICE', 'General administrative tasks and operations', 'ACTIVE'),
        ('Reception & Front Desk', 'DEPT-ADM-002', 'Reception & Front Desk', 'ADMINISTRATIVE', main_center_id, 'MAIN_OFFICE', 'Front desk and visitor management', 'ACTIVE'),
        
        -- HR Department
        ('Human Resources', 'DEPT-HR-001', 'Human Resources', 'HR', main_center_id, 'MAIN_OFFICE', 'Employee recruitment, training, and management', 'ACTIVE'),
        ('Training & Development', 'DEPT-HR-002', 'Training & Development', 'HR', main_center_id, 'MAIN_OFFICE', 'Employee training and professional development', 'ACTIVE'),
        
        -- Finance Department
        ('Finance & Accounting', 'DEPT-FIN-001', 'Finance & Accounting', 'FINANCE', main_center_id, 'MAIN_OFFICE', 'Financial management and accounting', 'ACTIVE'),
        ('Billing & Collections', 'DEPT-FIN-002', 'Billing & Collections', 'FINANCE', main_center_id, 'MAIN_OFFICE', 'Student billing and payment processing', 'ACTIVE'),
        
        -- IT Department
        ('IT & Technology', 'DEPT-IT-001', 'IT & Technology', 'IT', main_center_id, 'MAIN_OFFICE', 'IT support and system administration', 'ACTIVE'),
        ('Software Development', 'DEPT-IT-002', 'Software Development', 'IT', main_center_id, 'MAIN_OFFICE', 'Internal software development', 'ACTIVE'),
        
        -- Marketing Department
        ('Marketing & Sales', 'DEPT-MKT-001', 'Marketing & Sales', 'MARKETING', main_center_id, 'MAIN_OFFICE', 'Marketing campaigns and sales', 'ACTIVE'),
        ('Content & Social Media', 'DEPT-MKT-002', 'Content & Social Media', 'MARKETING', main_center_id, 'MAIN_OFFICE', 'Content creation and social media management', 'ACTIVE'),
        
        -- Operations Department
        ('Operations Management', 'DEPT-OPS-001', 'Operations Management', 'OPERATIONS', main_center_id, 'MAIN_OFFICE', 'Daily operations and logistics', 'ACTIVE'),
        ('Facility Management', 'DEPT-OPS-002', 'Facility Management', 'OPERATIONS', main_center_id, 'MAIN_OFFICE', 'Building and facility maintenance', 'ACTIVE'),
        
        -- Student Services Department
        ('Student Support Services', 'DEPT-STU-001', 'Student Support Services', 'STUDENT_SERVICES', main_center_id, 'MAIN_OFFICE', 'Student support and counseling', 'ACTIVE'),
        ('Student Advising', 'DEPT-STU-002', 'Student Advising', 'STUDENT_SERVICES', main_center_id, 'MAIN_OFFICE', 'Academic and career advising', 'ACTIVE')
        ON CONFLICT (department_code) DO NOTHING;
    END IF;
END $$;

-- Auto-generate employee codes for users
CREATE OR REPLACE FUNCTION generate_employee_code()
RETURNS TRIGGER AS $$
DECLARE
    role_prefix VARCHAR(10);
    year_code VARCHAR(4);
    sequence_num INT;
    new_code VARCHAR(50);
BEGIN
    -- Determine role prefix
    IF NEW.role_id = (SELECT id FROM roles WHERE role_name = 'TEACHER') THEN
        role_prefix := 'TCH';
    ELSIF NEW.role_id = (SELECT id FROM roles WHERE role_name = 'TA') THEN
        role_prefix := 'TA';
    ELSIF NEW.role_id = (SELECT id FROM roles WHERE role_name = 'STAFF') THEN
        role_prefix := 'STF';
    ELSE
        role_prefix := 'EMP';
    END IF;
    
    -- Get current year
    year_code := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Get next sequence number for this role
    SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code FROM 10) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM users
    WHERE employee_code LIKE role_prefix || '-' || year_code || '-%';
    
    -- Generate new employee code
    new_code := role_prefix || '-' || year_code || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    -- Set the employee code
    NEW.employee_code := new_code;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate employee codes
DROP TRIGGER IF EXISTS trg_before_insert_user ON users;
CREATE TRIGGER trg_before_insert_user
BEFORE INSERT ON users
FOR EACH ROW
WHEN (NEW.employee_code IS NULL)
EXECUTE FUNCTION generate_employee_code();

-- Verify migration
SELECT 
    'Departments table updated successfully!' as status,
    COUNT(*) as total_departments,
    COUNT(CASE WHEN department_type IS NOT NULL THEN 1 END) as departments_with_type,
    COUNT(CASE WHEN office_type IS NOT NULL THEN 1 END) as departments_with_office_type
FROM departments;
