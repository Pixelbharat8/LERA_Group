-- V20260122__custom_fields_table.sql
-- Create custom_fields table for dynamic field management

CREATE TABLE IF NOT EXISTS custom_fields (
    id VARCHAR(36) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    field_label_vi VARCHAR(255),
    field_type VARCHAR(20) NOT NULL DEFAULT 'text',
    options TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    show_in_table BOOLEAN DEFAULT TRUE,
    show_in_form BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    default_value VARCHAR(500),
    validation_regex VARCHAR(255),
    min_value DOUBLE PRECISION,
    max_value DOUBLE PRECISION,
    center_id VARCHAR(36),
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique field name per entity type
    CONSTRAINT unique_entity_field UNIQUE (entity_type, field_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_fields_entity_type ON custom_fields(entity_type);
CREATE INDEX IF NOT EXISTS idx_custom_fields_entity_active ON custom_fields(entity_type, is_active);
CREATE INDEX IF NOT EXISTS idx_custom_fields_center ON custom_fields(center_id);

-- Create custom_field_values table to store actual values
CREATE TABLE IF NOT EXISTS custom_field_values (
    id VARCHAR(36) PRIMARY KEY,
    custom_field_id VARCHAR(36) NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
    entity_id VARCHAR(36) NOT NULL,
    field_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- One value per field per entity
    CONSTRAINT unique_field_entity_value UNIQUE (custom_field_id, entity_id)
);

-- Create indexes for field values
CREATE INDEX IF NOT EXISTS idx_custom_field_values_field ON custom_field_values(custom_field_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_entity ON custom_field_values(entity_id);

-- Insert some sample custom fields for demonstration
INSERT INTO custom_fields (id, entity_type, field_name, field_label, field_label_vi, field_type, is_required, is_active, show_in_table, show_in_form, sort_order)
VALUES 
    (gen_random_uuid()::varchar, 'student', 'emergency_contact', 'Emergency Contact', 'Liên hệ khẩn cấp', 'phone', false, true, true, true, 1),
    (gen_random_uuid()::varchar, 'student', 'blood_group', 'Blood Group', 'Nhóm máu', 'select', false, true, true, true, 2),
    (gen_random_uuid()::varchar, 'student', 'medical_conditions', 'Medical Conditions', 'Tình trạng y tế', 'textarea', false, true, false, true, 3),
    (gen_random_uuid()::varchar, 'teacher', 'teaching_experience', 'Years of Experience', 'Số năm kinh nghiệm', 'number', false, true, true, true, 1),
    (gen_random_uuid()::varchar, 'teacher', 'certifications', 'Certifications', 'Chứng chỉ', 'textarea', false, true, false, true, 2)
ON CONFLICT DO NOTHING;

-- Update options for blood_group field
UPDATE custom_fields 
SET options = '["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]'
WHERE field_name = 'blood_group' AND entity_type = 'student';
