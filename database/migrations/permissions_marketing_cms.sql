-- Add Marketing & CMS Permissions
-- Run this migration to add new permissions for marketing and content management

-- Marketing Permissions
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'marketing.view', 'View Marketing', 'marketing', 'Access to view marketing dashboard'),
    (uuid_generate_v4(), 'marketing.manage', 'Manage Marketing', 'marketing', 'Full access to marketing features'),
    (uuid_generate_v4(), 'campaigns.view', 'View Campaigns', 'marketing', 'View marketing campaigns'),
    (uuid_generate_v4(), 'campaigns.create', 'Create Campaigns', 'marketing', 'Create and edit marketing campaigns'),
    (uuid_generate_v4(), 'campaigns.delete', 'Delete Campaigns', 'marketing', 'Delete marketing campaigns'),
    (uuid_generate_v4(), 'social_media.view', 'View Social Media', 'marketing', 'View social media accounts and posts'),
    (uuid_generate_v4(), 'social_media.manage', 'Manage Social Media', 'marketing', 'Create and manage social media content'),
    (uuid_generate_v4(), 'social_media.publish', 'Publish to Social Media', 'marketing', 'Publish content to social platforms'),
    (uuid_generate_v4(), 'ad_accounts.view', 'View Ad Accounts', 'marketing', 'View advertising accounts'),
    (uuid_generate_v4(), 'ad_accounts.manage', 'Manage Ad Accounts', 'marketing', 'Create and edit ad accounts'),
    (uuid_generate_v4(), 'content_calendar.view', 'View Content Calendar', 'marketing', 'View scheduled content'),
    (uuid_generate_v4(), 'content_calendar.manage', 'Manage Content Calendar', 'marketing', 'Schedule and manage content'),
    (uuid_generate_v4(), 'analytics_marketing.view', 'View Marketing Analytics', 'marketing', 'Access marketing analytics and reports')
ON CONFLICT (code) DO NOTHING;

-- CMS/Website Content Permissions
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'website.view', 'View Website Content', 'cms', 'View public website content'),
    (uuid_generate_v4(), 'website.edit', 'Edit Website Content', 'cms', 'Edit public website pages'),
    (uuid_generate_v4(), 'seo.view', 'View SEO Settings', 'cms', 'View SEO configuration'),
    (uuid_generate_v4(), 'seo.manage', 'Manage SEO Settings', 'cms', 'Edit SEO and meta settings'),
    (uuid_generate_v4(), 'pages.create', 'Create Pages', 'cms', 'Create new website pages'),
    (uuid_generate_v4(), 'pages.delete', 'Delete Pages', 'cms', 'Delete website pages'),
    (uuid_generate_v4(), 'media.upload', 'Upload Media', 'cms', 'Upload images and files'),
    (uuid_generate_v4(), 'media.delete', 'Delete Media', 'cms', 'Delete uploaded media')
ON CONFLICT (code) DO NOTHING;

-- Classroom Management Permissions
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'classrooms.view', 'View Classrooms', 'academy', 'View classroom list'),
    (uuid_generate_v4(), 'classrooms.create', 'Create Classrooms', 'academy', 'Create new classrooms'),
    (uuid_generate_v4(), 'classrooms.edit', 'Edit Classrooms', 'academy', 'Edit classroom details'),
    (uuid_generate_v4(), 'classrooms.delete', 'Delete Classrooms', 'academy', 'Delete classrooms'),
    (uuid_generate_v4(), 'schedules.view', 'View Schedules', 'academy', 'View class schedules'),
    (uuid_generate_v4(), 'schedules.manage', 'Manage Schedules', 'academy', 'Create and edit class schedules'),
    (uuid_generate_v4(), 'enrollments.view', 'View Enrollments', 'academy', 'View student enrollments'),
    (uuid_generate_v4(), 'enrollments.manage', 'Manage Enrollments', 'academy', 'Create and manage enrollments')
ON CONFLICT (code) DO NOTHING;

-- Finance & Approvals Permissions
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'payroll.view', 'View Payroll', 'finance', 'View payroll data'),
    (uuid_generate_v4(), 'payroll.manage', 'Manage Payroll', 'finance', 'Process payroll'),
    (uuid_generate_v4(), 'invoices.view', 'View Invoices', 'finance', 'View invoices'),
    (uuid_generate_v4(), 'invoices.create', 'Create Invoices', 'finance', 'Create invoices'),
    (uuid_generate_v4(), 'approvals.view', 'View Approvals', 'admin', 'View pending approvals'),
    (uuid_generate_v4(), 'approvals.approve', 'Approve Requests', 'admin', 'Approve/reject requests'),
    (uuid_generate_v4(), 'audit.view', 'View Audit Logs', 'admin', 'Access audit logs'),
    (uuid_generate_v4(), 'settings.view', 'View Settings', 'system', 'View system settings'),
    (uuid_generate_v4(), 'settings.manage', 'Manage Settings', 'system', 'Edit system settings')
ON CONFLICT (code) DO NOTHING;

-- AI & Support Permissions
INSERT INTO permissions (id, code, name, module, description) VALUES
    (uuid_generate_v4(), 'ai_assistant.use', 'Use AI Assistant', 'ai', 'Access AI-powered features'),
    (uuid_generate_v4(), 'ai_tutor.manage', 'Manage AI Tutor', 'ai', 'Configure AI tutor settings'),
    (uuid_generate_v4(), 'support.view', 'View Support Tickets', 'support', 'View support requests'),
    (uuid_generate_v4(), 'support.manage', 'Manage Support', 'support', 'Handle support tickets')
ON CONFLICT (code) DO NOTHING;

-- Grant all marketing permissions to Chairman role
DO $$
DECLARE
    v_chairman_id UUID;
    v_perm_id UUID;
BEGIN
    -- Get Chairman role ID
    SELECT id INTO v_chairman_id FROM roles WHERE name = 'CHAIRMAN' OR name = 'Chairman';
    
    IF v_chairman_id IS NOT NULL THEN
        -- Add all marketing permissions
        FOR v_perm_id IN SELECT id FROM permissions WHERE module = 'marketing'
        LOOP
            INSERT INTO role_permissions (role_id, permission_id) 
            VALUES (v_chairman_id, v_perm_id)
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        -- Add all CMS permissions
        FOR v_perm_id IN SELECT id FROM permissions WHERE module = 'cms'
        LOOP
            INSERT INTO role_permissions (role_id, permission_id) 
            VALUES (v_chairman_id, v_perm_id)
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        -- Add all admin permissions
        FOR v_perm_id IN SELECT id FROM permissions WHERE module = 'admin'
        LOOP
            INSERT INTO role_permissions (role_id, permission_id) 
            VALUES (v_chairman_id, v_perm_id)
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Permissions granted to Chairman role';
    ELSE
        RAISE NOTICE 'Chairman role not found';
    END IF;
END $$;

SELECT 'Permissions migration completed!' as status, COUNT(*) as total_permissions FROM permissions;
