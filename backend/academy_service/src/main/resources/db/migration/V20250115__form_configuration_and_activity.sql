-- Dynamic Form Configuration Table
CREATE TABLE IF NOT EXISTS form_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_name VARCHAR(100) NOT NULL UNIQUE,
    entity_type VARCHAR(50) NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User Activity Log Table
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    title VARCHAR(200),
    description TEXT,
    metadata JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_config_entity_type ON form_configurations(entity_type);
CREATE INDEX IF NOT EXISTS idx_form_config_form_name ON form_configurations(form_name);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity_log(created_at);

-- Seed default form configurations
INSERT INTO form_configurations (form_name, entity_type, description, fields) VALUES
('student_registration', 'STUDENT', 'Student Registration Form', '[
    {"name": "fullName", "label": "Full Name", "type": "text", "required": true, "order": 1},
    {"name": "email", "label": "Email Address", "type": "email", "required": true, "order": 2},
    {"name": "phone", "label": "Phone Number", "type": "text", "required": false, "order": 3},
    {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true, "order": 4},
    {"name": "gender", "label": "Gender", "type": "select", "options": ["Male", "Female", "Other"], "required": true, "order": 5},
    {"name": "address", "label": "Address", "type": "textarea", "required": false, "order": 6},
    {"name": "centerId", "label": "Center", "type": "select", "dataSource": "/api/centers", "required": true, "order": 7},
    {"name": "parentPhone", "label": "Parent/Guardian Phone", "type": "text", "required": true, "order": 8},
    {"name": "parentEmail", "label": "Parent/Guardian Email", "type": "email", "required": false, "order": 9},
    {"name": "emergencyContact", "label": "Emergency Contact", "type": "text", "required": false, "order": 10}
]'::jsonb),
('teacher_registration', 'TEACHER', 'Teacher Registration Form', '[
    {"name": "fullName", "label": "Full Name", "type": "text", "required": true, "order": 1},
    {"name": "email", "label": "Email Address", "type": "email", "required": true, "order": 2},
    {"name": "phone", "label": "Phone Number", "type": "text", "required": true, "order": 3},
    {"name": "specialization", "label": "Specialization/Subject", "type": "text", "required": true, "order": 4},
    {"name": "qualification", "label": "Qualification", "type": "text", "required": true, "order": 5},
    {"name": "experience", "label": "Years of Experience", "type": "number", "required": false, "order": 6},
    {"name": "centerId", "label": "Center", "type": "select", "dataSource": "/api/centers", "required": true, "order": 7},
    {"name": "hourlyRate", "label": "Hourly Rate", "type": "number", "required": true, "order": 8},
    {"name": "bio", "label": "Bio/About", "type": "textarea", "required": false, "order": 9}
]'::jsonb),
('staff_registration', 'STAFF', 'Staff Registration Form', '[
    {"name": "fullName", "label": "Full Name", "type": "text", "required": true, "order": 1},
    {"name": "email", "label": "Email Address", "type": "email", "required": true, "order": 2},
    {"name": "phone", "label": "Phone Number", "type": "text", "required": false, "order": 3},
    {"name": "jobTitle", "label": "Job Title", "type": "text", "required": true, "order": 4},
    {"name": "department", "label": "Department", "type": "select", "dataSource": "/api/departments", "required": true, "order": 5},
    {"name": "employmentType", "label": "Employment Type", "type": "select", "options": ["FULL_TIME", "PART_TIME", "CONTRACT"], "required": true, "order": 6},
    {"name": "centerId", "label": "Center", "type": "select", "dataSource": "/api/centers", "required": true, "order": 7},
    {"name": "salary", "label": "Monthly Salary", "type": "number", "required": true, "order": 8},
    {"name": "startDate", "label": "Start Date", "type": "date", "required": true, "order": 9}
]'::jsonb),
('parent_registration', 'PARENT', 'Parent/Guardian Registration Form', '[
    {"name": "fullName", "label": "Full Name", "type": "text", "required": true, "order": 1},
    {"name": "email", "label": "Email Address", "type": "email", "required": true, "order": 2},
    {"name": "phone", "label": "Phone Number", "type": "text", "required": true, "order": 3},
    {"name": "relationship", "label": "Relationship to Student", "type": "select", "options": ["Father", "Mother", "Guardian", "Other"], "required": true, "order": 4},
    {"name": "occupation", "label": "Occupation", "type": "text", "required": false, "order": 5},
    {"name": "address", "label": "Address", "type": "textarea", "required": false, "order": 6}
]'::jsonb),
('center_registration', 'CENTER', 'Center Registration Form', '[
    {"name": "name", "label": "Center Name", "type": "text", "required": true, "order": 1},
    {"name": "code", "label": "Center Code", "type": "text", "required": true, "order": 2},
    {"name": "address", "label": "Address", "type": "textarea", "required": true, "order": 3},
    {"name": "city", "label": "City", "type": "text", "required": true, "order": 4},
    {"name": "state", "label": "State", "type": "text", "required": true, "order": 5},
    {"name": "phone", "label": "Phone Number", "type": "text", "required": true, "order": 6},
    {"name": "email", "label": "Email Address", "type": "email", "required": true, "order": 7},
    {"name": "capacity", "label": "Maximum Capacity", "type": "number", "required": false, "order": 8}
]'::jsonb),
('class_registration', 'CLASS', 'Class Registration Form', '[
    {"name": "name", "label": "Class Name", "type": "text", "required": true, "order": 1},
    {"name": "code", "label": "Class Code", "type": "text", "required": true, "order": 2},
    {"name": "subject", "label": "Subject", "type": "text", "required": true, "order": 3},
    {"name": "teacherId", "label": "Teacher", "type": "select", "dataSource": "/api/teachers", "required": true, "order": 4},
    {"name": "centerId", "label": "Center", "type": "select", "dataSource": "/api/centers", "required": true, "order": 5},
    {"name": "schedule", "label": "Schedule", "type": "text", "required": false, "order": 6},
    {"name": "maxStudents", "label": "Maximum Students", "type": "number", "required": false, "order": 7},
    {"name": "fee", "label": "Monthly Fee", "type": "number", "required": true, "order": 8}
]'::jsonb)
ON CONFLICT (form_name) DO NOTHING;

-- Class switch history table
CREATE TABLE IF NOT EXISTS class_switch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    old_class_id UUID,
    new_class_id UUID NOT NULL,
    old_class_name VARCHAR(200),
    new_class_name VARCHAR(200),
    reason TEXT,
    switched_by UUID,
    switched_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_class_switch_student_id ON class_switch_history(student_id);
CREATE INDEX IF NOT EXISTS idx_class_switch_date ON class_switch_history(switched_at);
