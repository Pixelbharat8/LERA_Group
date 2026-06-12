-- Add approval workflow columns to users and teachers tables
-- This enables Admin/Manager to create users that need Super Admin approval

-- Add approval workflow columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE users ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add approval workflow columns to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE students ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES users(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP DEFAULT NOW();
ALTER TABLE students ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE students ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add approval workflow columns to teachers table
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES users(id);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP DEFAULT NOW();
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create indexes for approval queries
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);
CREATE INDEX IF NOT EXISTS idx_users_requested_by ON users(requested_by);
CREATE INDEX IF NOT EXISTS idx_students_approval_status ON students(approval_status);
CREATE INDEX IF NOT EXISTS idx_students_requested_by ON students(requested_by);
CREATE INDEX IF NOT EXISTS idx_teachers_approval_status ON teachers(approval_status);
CREATE INDEX IF NOT EXISTS idx_teachers_requested_by ON teachers(requested_by);

-- Create approval requests table for tracking all approval activities
CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- 'USER', 'STUDENT', 'TEACHER'
    entity_id UUID NOT NULL,
    request_type VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'ACTIVATION'
    requested_by UUID REFERENCES users(id) NOT NULL,
    requested_at TIMESTAMP DEFAULT NOW(),
    approval_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    request_data JSONB, -- Store the data being requested
    changes_summary TEXT, -- Human readable summary of changes
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for approval_requests
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(approval_status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_by ON approval_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_approval_requests_approved_by ON approval_requests(approved_by);

-- Create comments/notes table for approval workflow
CREATE TABLE IF NOT EXISTS approval_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    approval_request_id UUID REFERENCES approval_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_comments_request ON approval_comments(approval_request_id);

-- Create view for pending approvals (Super Admin dashboard)
CREATE OR REPLACE VIEW vw_pending_approvals AS
SELECT 
    ar.id as request_id,
    ar.entity_type,
    ar.entity_id,
    ar.request_type,
    ar.approval_status,
    ar.requested_at,
    ar.changes_summary,
    requester.fullname as requested_by_name,
    requester.email as requested_by_email,
    CASE 
        WHEN ar.entity_type = 'USER' THEN u.fullname
        WHEN ar.entity_type = 'STUDENT' THEN s.fullname
        WHEN ar.entity_type = 'TEACHER' THEN tu.fullname
    END as entity_name,
    CASE 
        WHEN ar.entity_type = 'USER' THEN u.email
        WHEN ar.entity_type = 'STUDENT' THEN s.email
        WHEN ar.entity_type = 'TEACHER' THEN tu.email
    END as entity_email,
    ar.request_data
FROM approval_requests ar
LEFT JOIN users requester ON ar.requested_by = requester.id
LEFT JOIN users u ON ar.entity_type = 'USER' AND ar.entity_id = u.id
LEFT JOIN students s ON ar.entity_type = 'STUDENT' AND ar.entity_id = s.id
LEFT JOIN teachers t ON ar.entity_type = 'TEACHER' AND ar.entity_id = t.id
LEFT JOIN users tu ON t.user_id = tu.id
WHERE ar.approval_status = 'PENDING'
ORDER BY ar.requested_at ASC;

-- Create view for approval history
CREATE OR REPLACE VIEW vw_approval_history AS
SELECT 
    ar.id as request_id,
    ar.entity_type,
    ar.entity_id,
    ar.request_type,
    ar.approval_status,
    ar.requested_at,
    ar.approved_at,
    ar.rejection_reason,
    ar.changes_summary,
    requester.fullname as requested_by_name,
    approver.fullname as approved_by_name,
    CASE 
        WHEN ar.entity_type = 'USER' THEN u.fullname
        WHEN ar.entity_type = 'STUDENT' THEN s.fullname
        WHEN ar.entity_type = 'TEACHER' THEN tu.fullname
    END as entity_name
FROM approval_requests ar
LEFT JOIN users requester ON ar.requested_by = requester.id
LEFT JOIN users approver ON ar.approved_by = approver.id
LEFT JOIN users u ON ar.entity_type = 'USER' AND ar.entity_id = u.id
LEFT JOIN students s ON ar.entity_type = 'STUDENT' AND ar.entity_id = s.id
LEFT JOIN teachers t ON ar.entity_type = 'TEACHER' AND ar.entity_id = t.id
LEFT JOIN users tu ON t.user_id = tu.id
WHERE ar.approval_status IN ('APPROVED', 'REJECTED')
ORDER BY ar.approved_at DESC;

-- Function to automatically create approval request when user/student/teacher is created by non-superadmin
CREATE OR REPLACE FUNCTION create_approval_request_trigger()
RETURNS TRIGGER AS $$
DECLARE
    requester_role VARCHAR(50);
BEGIN
    -- Get the role of the user who created this record
    -- If created by ADMIN or MANAGER, create approval request
    -- If created by SUPERADMIN, auto-approve
    
    IF NEW.created_by IS NOT NULL THEN
        SELECT r.role_name INTO requester_role
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = NEW.created_by;
        
        IF requester_role IN ('ADMIN', 'MANAGER') THEN
            -- Set status to PENDING for approval
            NEW.approval_status := 'PENDING';
            NEW.requested_by := NEW.created_by;
            NEW.requested_at := NOW();
            NEW.status := 'INACTIVE'; -- Keep inactive until approved
            
            -- Create approval request record
            INSERT INTO approval_requests (
                entity_type,
                entity_id,
                request_type,
                requested_by,
                approval_status,
                changes_summary
            ) VALUES (
                TG_TABLE_NAME,
                NEW.id,
                'CREATE',
                NEW.created_by,
                'PENDING',
                'New ' || TG_TABLE_NAME || ' creation request'
            );
        ELSIF requester_role = 'SUPERADMIN' THEN
            -- Auto-approve if created by superadmin
            NEW.approval_status := 'APPROVED';
            NEW.approved_by := NEW.created_by;
            NEW.approved_at := NOW();
            NEW.status := 'ACTIVE';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update existing active users/teachers/students to APPROVED status
UPDATE users SET approval_status = 'APPROVED', approved_at = NOW() WHERE status = 'ACTIVE' AND approval_status IS NULL;
UPDATE students SET approval_status = 'APPROVED', approved_at = NOW() WHERE status = 'ACTIVE' AND approval_status IS NULL;
UPDATE teachers SET approval_status = 'APPROVED', approved_at = NOW() WHERE status = 'ACTIVE' AND approval_status IS NULL;

-- Summary
SELECT 
    'Approval Workflow Migration Completed!' as status,
    (SELECT COUNT(*) FROM approval_requests) as total_approval_requests,
    (SELECT COUNT(*) FROM approval_requests WHERE approval_status = 'PENDING') as pending_approvals,
    (SELECT COUNT(*) FROM users WHERE approval_status = 'PENDING') as pending_users,
    (SELECT COUNT(*) FROM students WHERE approval_status = 'PENDING') as pending_students,
    (SELECT COUNT(*) FROM teachers WHERE approval_status = 'PENDING') as pending_teachers;
