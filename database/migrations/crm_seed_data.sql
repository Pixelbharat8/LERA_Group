-- CRM Seed Data Migration
-- Add leads and followups data

-- Insert Lead Sources
INSERT INTO lead_sources (id, name, description, is_active, created_at) VALUES
    (uuid_generate_v4(), 'Website', 'Website inquiry form', true, NOW()),
    (uuid_generate_v4(), 'Facebook', 'Facebook ads and page', true, NOW()),
    (uuid_generate_v4(), 'Google Ads', 'Google advertising', true, NOW()),
    (uuid_generate_v4(), 'Referral', 'Customer referral', true, NOW()),
    (uuid_generate_v4(), 'Walk-in', 'Direct walk-in inquiry', true, NOW()),
    (uuid_generate_v4(), 'Phone Call', 'Inbound phone inquiry', true, NOW())
ON CONFLICT DO NOTHING;

-- Insert Lead Statuses
INSERT INTO lead_statuses (id, name, color, sort_order, is_active, created_at) VALUES
    (uuid_generate_v4(), 'NEW', '#3B82F6', 1, true, NOW()),
    (uuid_generate_v4(), 'CONTACTED', '#F59E0B', 2, true, NOW()),
    (uuid_generate_v4(), 'QUALIFIED', '#10B981', 3, true, NOW()),
    (uuid_generate_v4(), 'NEGOTIATION', '#8B5CF6', 4, true, NOW()),
    (uuid_generate_v4(), 'CONVERTED', '#059669', 5, true, NOW()),
    (uuid_generate_v4(), 'LOST', '#EF4444', 6, true, NOW())
ON CONFLICT DO NOTHING;

-- Insert sample Leads
INSERT INTO leads (id, full_name, parent_name, parent_phone, parent_email, student_name, student_age, status, notes, created_at, updated_at) VALUES
    (uuid_generate_v4(), 'Nguyễn Văn An', 'Nguyễn Văn An', '0901234567', 'nguyen.an@email.com', 'Nguyễn Minh Anh', 8, 'NEW', 'Interested in English speaking course', NOW() - INTERVAL '2 days', NOW()),
    (uuid_generate_v4(), 'Trần Thị Bình', 'Trần Thị Bình', '0902345678', 'tran.binh@email.com', 'Trần Văn Hùng', 10, 'CONTACTED', 'Called, interested in IELTS prep', NOW() - INTERVAL '5 days', NOW()),
    (uuid_generate_v4(), 'Lê Văn Cường', 'Lê Văn Cường', '0903456789', 'le.cuong@email.com', 'Lê Thị Mai', 12, 'QUALIFIED', 'Ready to enroll, discussing schedule', NOW() - INTERVAL '7 days', NOW()),
    (uuid_generate_v4(), 'Phạm Thị Dung', 'Phạm Thị Dung', '0904567890', 'pham.dung@email.com', 'Phạm Đức Long', 9, 'NEW', 'Website inquiry for English basics', NOW() - INTERVAL '1 day', NOW()),
    (uuid_generate_v4(), 'Hoàng Văn Em', 'Hoàng Văn Em', '0905678901', 'hoang.em@email.com', 'Hoàng Minh Tú', 11, 'CONTACTED', 'Sent brochure via email', NOW() - INTERVAL '3 days', NOW()),
    (uuid_generate_v4(), 'Vũ Thị Phương', 'Vũ Thị Phương', '0906789012', 'vu.phuong@email.com', 'Vũ Thị Lan', 7, 'QUALIFIED', 'Campus tour scheduled', NOW() - INTERVAL '4 days', NOW()),
    (uuid_generate_v4(), 'Đặng Văn Giang', 'Đặng Văn Giang', '0907890123', 'dang.giang@email.com', 'Đặng Quốc Anh', 13, 'CONVERTED', 'Enrolled in IELTS Advanced', NOW() - INTERVAL '14 days', NOW()),
    (uuid_generate_v4(), 'Bùi Thị Hạnh', 'Bùi Thị Hạnh', '0908901234', 'bui.hanh@email.com', 'Bùi Văn Khoa', 8, 'NEW', 'Referral from existing student', NOW(), NOW()),
    (uuid_generate_v4(), 'Ngô Văn Ích', 'Ngô Văn Ích', '0909012345', 'ngo.ich@email.com', 'Ngô Thị Kim', 10, 'LOST', 'Found another school closer to home', NOW() - INTERVAL '10 days', NOW()),
    (uuid_generate_v4(), 'Đinh Thị Linh', 'Đinh Thị Linh', '0910123456', 'dinh.linh@email.com', 'Đinh Văn Minh', 14, 'CONTACTED', 'Interested in exam preparation', NOW() - INTERVAL '2 days', NOW())
ON CONFLICT DO NOTHING;

-- Insert Followups linked to leads
INSERT INTO lead_followups (id, lead_id, action_type, notes, outcome, next_followup_date, created_at)
SELECT 
    uuid_generate_v4(),
    l.id,
    'PHONE',
    'Initial contact call - parent interested',
    'INTERESTED',
    CURRENT_DATE + INTERVAL '3 days',
    NOW() - INTERVAL '1 day'
FROM leads l WHERE l.full_name = 'Nguyễn Văn An'
ON CONFLICT DO NOTHING;

INSERT INTO lead_followups (id, lead_id, action_type, notes, outcome, next_followup_date, created_at)
SELECT 
    uuid_generate_v4(),
    l.id,
    'EMAIL',
    'Sent course brochure and pricing',
    'CALLBACK',
    CURRENT_DATE + INTERVAL '2 days',
    NOW() - INTERVAL '3 days'
FROM leads l WHERE l.full_name = 'Trần Thị Bình'
ON CONFLICT DO NOTHING;

INSERT INTO lead_followups (id, lead_id, action_type, notes, outcome, next_followup_date, created_at)
SELECT 
    uuid_generate_v4(),
    l.id,
    'MEETING',
    'Campus tour completed - very positive',
    'INTERESTED',
    CURRENT_DATE + INTERVAL '1 day',
    NOW() - INTERVAL '5 days'
FROM leads l WHERE l.full_name = 'Lê Văn Cường'
ON CONFLICT DO NOTHING;

INSERT INTO lead_followups (id, lead_id, action_type, notes, outcome, next_followup_date, created_at)
SELECT 
    uuid_generate_v4(),
    l.id,
    'SMS',
    'Sent welcome SMS with info',
    NULL,
    CURRENT_DATE + INTERVAL '2 days',
    NOW()
FROM leads l WHERE l.full_name = 'Phạm Thị Dung'
ON CONFLICT DO NOTHING;

INSERT INTO lead_followups (id, lead_id, action_type, notes, outcome, next_followup_date, created_at)
SELECT 
    uuid_generate_v4(),
    l.id,
    'PHONE',
    'Follow-up call - discussing schedule options',
    'CALLBACK',
    CURRENT_DATE + INTERVAL '4 days',
    NOW() - INTERVAL '2 days'
FROM leads l WHERE l.full_name = 'Hoàng Văn Em'
ON CONFLICT DO NOTHING;

INSERT INTO lead_followups (id, lead_id, action_type, notes, outcome, next_followup_date, created_at)
SELECT 
    uuid_generate_v4(),
    l.id,
    'MEETING',
    'Trial class scheduled for next week',
    'INTERESTED',
    CURRENT_DATE + INTERVAL '5 days',
    NOW() - INTERVAL '2 days'
FROM leads l WHERE l.full_name = 'Vũ Thị Phương'
ON CONFLICT DO NOTHING;

-- Insert registrations data (using enrollments table if exists, or create a simple structure)
-- Check if student_enrollments or similar exists

-- Create view for CRM dashboard stats
CREATE OR REPLACE VIEW crm_dashboard_stats AS
SELECT 
    COUNT(*) FILTER (WHERE status = 'NEW') as new_leads,
    COUNT(*) FILTER (WHERE status = 'CONTACTED') as contacted_leads,
    COUNT(*) FILTER (WHERE status = 'QUALIFIED') as qualified_leads,
    COUNT(*) FILTER (WHERE status = 'CONVERTED') as converted_leads,
    COUNT(*) FILTER (WHERE status = 'LOST') as lost_leads,
    COUNT(*) as total_leads,
    ROUND(COUNT(*) FILTER (WHERE status = 'CONVERTED')::numeric / NULLIF(COUNT(*), 0) * 100, 1) as conversion_rate
FROM leads;

-- Summary
SELECT 'CRM seed data inserted successfully!' as status,
       (SELECT COUNT(*) FROM leads) as total_leads,
       (SELECT COUNT(*) FROM lead_followups) as total_followups;
