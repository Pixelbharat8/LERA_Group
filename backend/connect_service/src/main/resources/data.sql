-- Marketing Seed Data for Connect Service
-- This will auto-run on startup if spring.sql.init.mode=always

-- Social Platforms (Facebook, Instagram, TikTok, Zalo, YouTube, Google Ads)
INSERT INTO social_platforms (id, platform_name, display_name, icon, color, page_url, page_id, is_active, is_connected, auto_post, follower_count, growth_rate, created_at, updated_at)
VALUES 
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567891', 'facebook', 'Facebook', '📘', '#1877F2', 'https://facebook.com/LERAacademy', 'LERAacademy', true, true, true, 12500, 8.5, NOW(), NOW()),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567892', 'instagram', 'Instagram', '📸', '#E4405F', 'https://instagram.com/lera_academy', 'lera_academy', true, true, true, 8300, 12.3, NOW(), NOW()),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567893', 'tiktok', 'TikTok', '🎵', '#000000', 'https://tiktok.com/@leraacademy', 'leraacademy', true, true, true, 5100, 28.5, NOW(), NOW()),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567894', 'zalo', 'Zalo', '💬', '#0068FF', 'https://zalo.me/leraacademy', 'leraacademy', true, true, false, 3200, 5.2, NOW(), NOW()),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567895', 'youtube', 'YouTube', '📺', '#FF0000', 'https://youtube.com/c/LERAacademy', 'LERAacademy', true, false, false, 2100, 15.0, NOW(), NOW()),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567896', 'google', 'Google Ads', '🔍', '#4285F4', NULL, NULL, true, true, false, 0, 0, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    follower_count = EXCLUDED.follower_count,
    growth_rate = EXCLUDED.growth_rate,
    updated_at = NOW();
-- Social Media Posts (Recent Activity + Scheduled) - Using TEXT[] for platforms array
INSERT INTO social_media_posts (id, title, content, content_type, platforms, status, scheduled_at, published_at, reach, likes, shares, comments, created_at, updated_at)
VALUES 
    ('b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Student Success Story', 'Meet Minh, who achieved IELTS 8.0 after 6 months of dedicated study! 🎉 #LERASuccess', 'text', ARRAY['facebook','instagram','zalo'], 'published', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', 15200, 890, 124, 56, NOW() - INTERVAL '3 hours', NOW()),
    ('b1b2c3d4-e5f6-7890-abcd-ef1234567892', 'TikTok Milestone', 'We just hit 5,000 followers on TikTok! 🎵 Thank you all for the support!', 'text', ARRAY['tiktok','facebook'], 'published', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 28500, 1560, 320, 89, NOW() - INTERVAL '1 day', NOW()),
    ('b1b2c3d4-e5f6-7890-abcd-ef1234567893', 'Summer Camp Promo', 'Summer Camp 2026 early bird registration open! 50% discount for first 100 students 🌞', 'image', ARRAY['facebook','instagram','zalo'], 'published', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours', 18700, 650, 89, 34, NOW() - INTERVAL '6 hours', NOW()),
    ('b1b2c3d4-e5f6-7890-abcd-ef1234567894', 'Behind the Scenes', 'Take a look behind the scenes of our new classroom setup! 📚', 'video', ARRAY['tiktok','instagram'], 'scheduled', NOW() + INTERVAL '2 days', NULL, 0, 0, 0, 0, NOW(), NOW()),
    ('b1b2c3d4-e5f6-7890-abcd-ef1234567895', 'Weekly Study Tips', 'Top 5 tips to improve your English speaking skills! 📖 #EnglishTips #LERAacademy', 'text', ARRAY['facebook'], 'scheduled', NOW() + INTERVAL '3 days', NULL, 0, 0, 0, 0, NOW(), NOW()),
    ('b1b2c3d4-e5f6-7890-abcd-ef1234567896', 'Teacher Spotlight', 'Meet our amazing teacher Ms. Lan who has helped 500+ students achieve their goals!', 'image', ARRAY['facebook','instagram','zalo'], 'scheduled', NOW() + INTERVAL '5 days', NULL, 0, 0, 0, 0, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    reach = EXCLUDED.reach,
    likes = EXCLUDED.likes,
    shares = EXCLUDED.shares,
    comments = EXCLUDED.comments,
    updated_at = NOW();

-- Marketing Campaigns (using column names from entity: campaign_name, budget)
INSERT INTO marketing_campaigns (id, campaign_name, description, campaign_type, status, start_date, end_date, budget, spent_amount, target_audience, created_at, updated_at)
VALUES 
    ('c1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Summer Camp 2026', 'Early bird registration campaign for Summer Camp', 'SOCIAL_MEDIA', 'ACTIVE', '2026-01-01', '2026-03-31', 25000000, 12500000, 'Parents of school-age children', NOW(), NOW()),
    ('c1b2c3d4-e5f6-7890-abcd-ef1234567892', 'IELTS Success Stories', 'Showcase student achievements to attract new enrollments', 'SOCIAL_MEDIA', 'ACTIVE', '2026-01-15', '2026-02-28', 15000000, 8200000, 'Students 16-30 preparing for IELTS', NOW(), NOW()),
    ('c1b2c3d4-e5f6-7890-abcd-ef1234567893', 'Lunar New Year Promo', 'Special discount for Tet holiday enrollment', 'EVENT', 'SCHEDULED', '2026-01-25', '2026-02-15', 20000000, 0, 'All target demographics', NOW(), NOW()),
    ('c1b2c3d4-e5f6-7890-abcd-ef1234567894', 'Q4 Brand Campaign', 'End of year brand awareness push', 'SOCIAL_MEDIA', 'COMPLETED', '2025-10-01', '2025-12-31', 30000000, 29500000, 'Parents and young professionals', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    spent_amount = EXCLUDED.spent_amount,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Social Analytics (Platform performance data)
INSERT INTO social_analytics (id, platform, metric_date, followers, new_followers, posts_count, total_reach, total_impressions, total_engagement, engagement_rate, created_at)
VALUES 
    ('d1b2c3d4-e5f6-7890-abcd-ef1234567891', 'facebook', CURRENT_DATE, 12500, 320, 45, 77400, 125000, 3100, 4.0, NOW()),
    ('d1b2c3d4-e5f6-7890-abcd-ef1234567892', 'instagram', CURRENT_DATE, 8300, 280, 38, 45200, 89000, 2800, 5.2, NOW()),
    ('d1b2c3d4-e5f6-7890-abcd-ef1234567893', 'tiktok', CURRENT_DATE, 5100, 450, 22, 128000, 210000, 8500, 6.8, NOW()),
    ('d1b2c3d4-e5f6-7890-abcd-ef1234567894', 'zalo', CURRENT_DATE, 3200, 85, 15, 18500, 32000, 920, 2.9, NOW())
ON CONFLICT (id) DO UPDATE SET
    followers = EXCLUDED.followers,
    total_reach = EXCLUDED.total_reach,
    total_engagement = EXCLUDED.total_engagement;

-- Ad Accounts (Facebook, Google, TikTok ad accounts)
INSERT INTO ad_accounts (id, platform, account_id, account_name, currency, timezone, daily_budget, monthly_budget, total_spend, is_active, created_at, updated_at)
VALUES 
    ('e1b2c3d4-e5f6-7890-abcd-ef1234567891', 'facebook', 'act_123456789012345', 'LERA Academy Main', 'VND', 'Asia/Ho_Chi_Minh', 2000000, 50000000, 32500000, true, NOW(), NOW()),
    ('e1b2c3d4-e5f6-7890-abcd-ef1234567892', 'google', '123-456-7890', 'LERA Google Ads', 'VND', 'Asia/Ho_Chi_Minh', 1500000, 40000000, 28000000, true, NOW(), NOW()),
    ('e1b2c3d4-e5f6-7890-abcd-ef1234567893', 'tiktok', '7012345678901234567', 'LERA TikTok Ads', 'VND', 'Asia/Ho_Chi_Minh', 1000000, 25000000, 15000000, true, NOW(), NOW()),
    ('e1b2c3d4-e5f6-7890-abcd-ef1234567894', 'zalo', 'zalo_ads_lera_2026', 'LERA Zalo OA', 'VND', 'Asia/Ho_Chi_Minh', 500000, 15000000, 8500000, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    total_spend = EXCLUDED.total_spend,
    updated_at = NOW();

-- Leads (Prospective students/parents from marketing) - matches leads table
INSERT INTO leads (id, parent_name, parent_email, parent_phone, student_name, student_age, utm_source, status, notes, assigned_to, center_id, created_at, updated_at)
VALUES 
    ('f1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Nguyen Van A', 'nguyenvana@gmail.com', '0901234567', 'Nguyen Van B', 8, 'FACEBOOK_AD', 'NEW', 'Interested in summer camp', NULL, NULL, NOW() - INTERVAL '1 hour', NOW()),
    ('f1b2c3d4-e5f6-7890-abcd-ef1234567892', 'Tran Thi C', 'tranthic@gmail.com', '0912345678', 'Tran Van D', 15, 'INSTAGRAM', 'CONTACTED', 'Called, scheduled visit', NULL, NULL, NOW() - INTERVAL '2 days', NOW()),
    ('f1b2c3d4-e5f6-7890-abcd-ef1234567893', 'Le Van E', 'levane@gmail.com', '0923456789', 'Le Thi F', 12, 'WEBSITE', 'QUALIFIED', 'Ready to enroll', NULL, NULL, NOW() - INTERVAL '3 days', NOW()),
    ('f1b2c3d4-e5f6-7890-abcd-ef1234567894', 'Pham Thi G', 'phamthig@gmail.com', '0934567890', 'Pham Van H', 10, 'REFERRAL', 'CONVERTED', 'Enrolled in Jan batch', NULL, NULL, NOW() - INTERVAL '5 days', NOW()),
    ('f1b2c3d4-e5f6-7890-abcd-ef1234567895', 'Hoang Van I', 'hoangvani@gmail.com', '0945678901', 'Hoang Thi J', 17, 'TIKTOK', 'NEW', 'Just inquired', NULL, NULL, NOW() - INTERVAL '30 minutes', NOW()),
    ('f1b2c3d4-e5f6-7890-abcd-ef1234567896', 'Vo Thi K', 'vothik@gmail.com', '0956789012', 'Vo Van L', 6, 'ZALO', 'CONTACTED', 'Parent very interested', NULL, NULL, NOW() - INTERVAL '1 day', NOW())
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = NOW();

-- Lead Followups (Lead follow-up tasks) - matches lead_followups table
INSERT INTO lead_followups (id, lead_id, action_type, next_followup_date, notes, outcome, created_at)
VALUES 
    ('g1b2c3d4-e5f6-7890-abcd-ef1234567891', 'f1b2c3d4-e5f6-7890-abcd-ef1234567891', 'PHONE', CURRENT_DATE + INTERVAL '1 day', 'Initial contact call', NULL, NOW()),
    ('g1b2c3d4-e5f6-7890-abcd-ef1234567892', 'f1b2c3d4-e5f6-7890-abcd-ef1234567892', 'MEETING', CURRENT_DATE + INTERVAL '2 days', 'Scheduled center visit', NULL, NOW()),
    ('g1b2c3d4-e5f6-7890-abcd-ef1234567893', 'f1b2c3d4-e5f6-7890-abcd-ef1234567893', 'EMAIL', CURRENT_DATE - INTERVAL '1 day', 'Sent enrollment info', 'INTERESTED', NOW() - INTERVAL '2 days'),
    ('g1b2c3d4-e5f6-7890-abcd-ef1234567894', 'f1b2c3d4-e5f6-7890-abcd-ef1234567896', 'PHONE', CURRENT_DATE, 'Follow up on interest', 'CALLBACK', NOW())
ON CONFLICT (id) DO UPDATE SET
    outcome = EXCLUDED.outcome;

-- Tasks (Sample tasks for TA/Staff/Teachers)
INSERT INTO tasks (id, title, description, status, priority, category, due_date, created_at)
VALUES 
    ('h1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Grade Midterm Exams', 'Grade all midterm exams for English Basics class', 'PENDING', 'HIGH', 'GRADING', CURRENT_DATE + INTERVAL '3 days', NOW()),
    ('h1b2c3d4-e5f6-7890-abcd-ef1234567892', 'Update Attendance Records', 'Ensure all January attendance is recorded', 'IN_PROGRESS', 'MEDIUM', 'ATTENDANCE', CURRENT_DATE + INTERVAL '1 day', NOW()),
    ('h1b2c3d4-e5f6-7890-abcd-ef1234567893', 'Prepare Weekly Report', 'Compile student progress for weekly report', 'PENDING', 'LOW', 'ADMINISTRATIVE', CURRENT_DATE + INTERVAL '5 days', NOW()),
    ('h1b2c3d4-e5f6-7890-abcd-ef1234567894', 'Student Support Call', 'Follow up with parents about student performance', 'COMPLETED', 'MEDIUM', 'SUPPORT', CURRENT_DATE - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
    ('h1b2c3d4-e5f6-7890-abcd-ef1234567895', 'Class Material Prep', 'Prepare materials for next week lessons', 'PENDING', 'HIGH', 'ADMINISTRATIVE', CURRENT_DATE + INTERVAL '2 days', NOW())
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status;

-- Notifications/Messages (Sample notifications)
INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
VALUES 
    -- Broadcast notifications (user_id NULL = for all users)
    ('i1b2c3d4-e5f6-7890-abcd-ef1234567891', NULL, 'System Update', 'New features have been added to the platform. Check out the improved dashboard!', 'info', false, NOW() - INTERVAL '1 hour'),
    ('i1b2c3d4-e5f6-7890-abcd-ef1234567892', NULL, 'New Assignment Posted', 'A new assignment has been posted for your class. Please review and complete.', 'info', false, NOW() - INTERVAL '2 hours'),
    ('i1b2c3d4-e5f6-7890-abcd-ef1234567893', NULL, 'Attendance Reminder', 'Please mark attendance for today classes before 5 PM', 'warning', false, NOW() - INTERVAL '30 minutes'),
    ('i1b2c3d4-e5f6-7890-abcd-ef1234567894', NULL, 'Payment Received', 'Payment confirmation for January tuition has been processed', 'success', true, NOW() - INTERVAL '1 day'),
    
    -- CEO specific notifications
    ('i1b2c3d4-e5f6-7890-abcd-ef1234567895', 'e0000000-0000-0000-0000-000000000002', 'Monthly Report Ready', 'The January 2026 monthly performance report is ready for review', 'info', false, NOW() - INTERVAL '5 minutes'),
    ('i1b2c3d4-e5f6-7890-abcd-ef1234567896', 'e0000000-0000-0000-0000-000000000002', 'New Enrollment Request', 'A new student enrollment request requires your approval', 'approval', false, NOW() - INTERVAL '15 minutes'),
    ('i1b2c3d4-e5f6-7890-abcd-ef1234567897', 'e0000000-0000-0000-0000-000000000002', 'Budget Review', 'Q1 2026 budget proposal needs your review and approval', 'approval', false, NOW() - INTERVAL '45 minutes'),
    
    -- Chairman specific notifications  
    ('i1b2c3d4-e5f6-7890-abcd-ef1234567898', 'e0000000-0000-0000-0000-000000000001', 'Board Meeting Scheduled', 'Monthly board meeting scheduled for Feb 15, 2026', 'info', false, NOW() - INTERVAL '10 minutes'),
    ('i1b2c3d4-e5f6-7890-abcd-ef1234567899', 'e0000000-0000-0000-0000-000000000001', 'Strategic Plan Review', 'Annual strategic plan document requires your final approval', 'approval', false, NOW() - INTERVAL '20 minutes'),
    
    -- Director notifications
    ('i1b2c3d4-e5f6-7890-abcd-ef123456789a', 'e0000000-0000-0000-0000-000000000004', 'Staff Performance Review', 'Q4 2025 staff performance reviews are due this week', 'warning', false, NOW() - INTERVAL '3 hours'),
    ('i1b2c3d4-e5f6-7890-abcd-ef123456789b', 'e0000000-0000-0000-0000-000000000004', 'New Course Proposal', 'IELTS Advanced course proposal submitted for review', 'info', false, NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO UPDATE SET
    is_read = EXCLUDED.is_read;
