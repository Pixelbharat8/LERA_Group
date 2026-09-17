-- Social Media Service Seed Data
-- This will auto-run on startup if spring.sql.init.mode=always

-- Social Platforms (Facebook, Instagram, TikTok, Zalo, YouTube, Google Ads)
INSERT INTO social_platforms (id, platform_name, display_name, icon, color, page_url, page_id, is_active, is_connected, auto_post, follower_count, growth_rate, created_at, updated_at)
VALUES 
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567891', 'facebook', 'Facebook', '📘', '#1877F2', 'https://facebook.com/LERAacademy', 'LERAacademy', true, true, true, 12500, 8.5, NOW(), NOW()),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567892', 'instagram', 'Instagram', '📸', '#E4405F', 'https://instagram.com/lera_academy', 'lera_academy', true, true, true, 8300, 12.3, NOW(), NOW()),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567893', 'tiktok', 'TikTok', '🎵', '#000000', 'https://tiktok.com/@leraacademy', 'leraacademy', true, true, true, 5100, 28.5, NOW(), NOW()),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567894', 'zalo', 'Zalo', '💬', '#0068FF', 'https://zalo.me/leraacademy', 'leraacademy', true, true, false, 3200, 5.2, NOW(), NOW()),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567895', 'youtube', 'YouTube', '📺', '#FF0000', 'https://youtube.com/c/LERAacademy', 'LERAacademy', true, false, false, 2100, 15.0, NOW(), NOW()),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567896', 'google', 'Google Ads', '🔍', '#4285F4', NULL, NULL, true, true, false, 0, 0, NOW(), NOW()),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567897', 'linkedin', 'LinkedIn', '💼', '#0077B5', 'https://linkedin.com/company/leraacademy', 'leraacademy', true, false, false, 1500, 5.8, NOW(), NOW()),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567898', 'twitter', 'Twitter/X', '🐦', '#1DA1F2', 'https://twitter.com/leraacademy', 'leraacademy', true, false, false, 980, 3.2, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    follower_count = EXCLUDED.follower_count,
    growth_rate = EXCLUDED.growth_rate,
    updated_at = NOW();

-- Social Media Posts (Recent Activity + Scheduled)
INSERT INTO social_media_posts (id, title, content, content_type, platforms, status, scheduled_at, published_at, reach, likes, shares, comments, created_at, updated_at)
VALUES 
    ('b1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Student Success Story', 'Meet Minh, who achieved IELTS 8.0 after 6 months of dedicated study! 🎉 #LERASuccess', 'text', ARRAY['facebook','instagram','zalo'], 'published', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', 15200, 890, 124, 56, NOW() - INTERVAL '3 hours', NOW()),
    ('b1b2c3d4-e5f6-7890-abcd-ef1234567892', 'TikTok Milestone', 'We just hit 5,000 followers on TikTok! 🎵 Thank you all for the support!', 'text', ARRAY['tiktok','facebook'], 'published', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 28500, 1560, 320, 89, NOW() - INTERVAL '1 day', NOW()),
    ('b1b2c3d4-e5f6-7890-abcd-ef1234567893', 'Summer Camp Promo', 'Summer Camp 2026 early bird registration open! 50% discount for first 100 students 🌞', 'image', ARRAY['facebook','instagram','zalo'], 'published', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours', 18700, 650, 89, 34, NOW() - INTERVAL '6 hours', NOW()),
    ('b1b2c3d4-e5f6-7890-abcd-ef1234567894', 'Behind the Scenes', 'Take a look behind the scenes of our new classroom setup! 📚', 'video', ARRAY['tiktok','instagram'], 'scheduled', NOW() + INTERVAL '2 days', NULL, 0, 0, 0, 0, NOW(), NOW()),
    ('b1b2c3d4-e5f6-7890-abcd-ef1234567895', 'Weekly Study Tips', 'Top 5 tips to improve your English speaking skills! 📖 #EnglishTips #LERAacademy', 'text', ARRAY['facebook'], 'scheduled', NOW() + INTERVAL '3 days', NULL, 0, 0, 0, 0, NOW(), NOW()),
    ('b1b2c3d4-e5f6-7890-abcd-ef1234567896', 'Teacher Spotlight', 'Meet our amazing teacher Ms. Lan who has helped 500+ students achieve their goals!', 'image', ARRAY['facebook','instagram','zalo'], 'scheduled', NOW() + INTERVAL '5 days', NULL, 0, 0, 0, 0, NOW(), NOW()),
    ('b1b2c3d4-e5f6-7890-abcd-ef1234567897', 'Lunar New Year Greetings', 'Wishing all our students and families a prosperous Lunar New Year! 🧧🐉 #TetHoliday', 'image', ARRAY['facebook','instagram','zalo','tiktok'], 'scheduled', NOW() + INTERVAL '1 day', NULL, 0, 0, 0, 0, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    reach = EXCLUDED.reach,
    likes = EXCLUDED.likes,
    shares = EXCLUDED.shares,
    comments = EXCLUDED.comments,
    updated_at = NOW();

-- Marketing Campaigns
INSERT INTO marketing_campaigns (id, campaign_name, description, campaign_type, status, start_date, end_date, budget, spent_amount, target_audience, created_at, updated_at)
VALUES 
    ('c1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Summer Camp 2026', 'Early bird registration campaign for Summer Camp', 'SOCIAL_MEDIA', 'ACTIVE', '2026-01-01', '2026-03-31', 25000000, 12500000, 'Parents of school-age children', NOW(), NOW()),
    ('c1b2c3d4-e5f6-7890-abcd-ef1234567892', 'IELTS Success Stories', 'Showcase student achievements to attract new enrollments', 'SOCIAL_MEDIA', 'ACTIVE', '2026-01-15', '2026-02-28', 15000000, 8200000, 'Students 16-30 preparing for IELTS', NOW(), NOW()),
    ('c1b2c3d4-e5f6-7890-abcd-ef1234567893', 'Lunar New Year Promo', 'Special discount for Tet holiday enrollment', 'EVENT', 'SCHEDULED', '2026-01-25', '2026-02-15', 20000000, 0, 'All target demographics', NOW(), NOW()),
    ('c1b2c3d4-e5f6-7890-abcd-ef1234567894', 'Q4 Brand Campaign', 'End of year brand awareness push', 'SOCIAL_MEDIA', 'COMPLETED', '2025-10-01', '2025-12-31', 30000000, 29500000, 'Parents and young professionals', NOW(), NOW()),
    ('c1b2c3d4-e5f6-7890-abcd-ef1234567895', 'Facebook Lead Gen', 'Facebook lead generation ads for new enrollments', 'PAID_ADS', 'ACTIVE', '2026-01-01', '2026-06-30', 50000000, 15000000, 'Parents with children 4-18', NOW(), NOW()),
    ('c1b2c3d4-e5f6-7890-abcd-ef1234567896', 'TikTok Brand Awareness', 'TikTok video campaign for brand awareness', 'PAID_ADS', 'ACTIVE', '2026-01-15', '2026-04-30', 30000000, 8000000, 'Students and young adults 15-25', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    spent_amount = EXCLUDED.spent_amount,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Social Analytics (Platform performance data)
INSERT INTO social_analytics (id, platform, metric_date, followers, new_followers, posts_count, total_reach, total_impressions, total_engagement, likes_count, comments_count, shares_count, click_through_rate, engagement_rate, created_at)
VALUES 
    ('d1b2c3d4-e5f6-7890-abcd-ef1234567891', 'facebook', CURRENT_DATE, 12500, 320, 45, 77400, 125000, 3100, 2100, 450, 550, 2.8, 4.0, NOW()),
    ('d1b2c3d4-e5f6-7890-abcd-ef1234567892', 'instagram', CURRENT_DATE, 8300, 280, 38, 45200, 89000, 2800, 2200, 380, 220, 3.2, 5.2, NOW()),
    ('d1b2c3d4-e5f6-7890-abcd-ef1234567893', 'tiktok', CURRENT_DATE, 5100, 450, 22, 128000, 210000, 8500, 6200, 1200, 1100, 4.1, 6.8, NOW()),
    ('d1b2c3d4-e5f6-7890-abcd-ef1234567894', 'zalo', CURRENT_DATE, 3200, 85, 15, 18500, 32000, 920, 650, 180, 90, 2.2, 2.9, NOW()),
    ('d1b2c3d4-e5f6-7890-abcd-ef1234567895', 'youtube', CURRENT_DATE, 2100, 120, 8, 35000, 52000, 1800, 1400, 280, 120, 1.8, 3.5, NOW()),
    ('d1b2c3d4-e5f6-7890-abcd-ef1234567896', 'linkedin', CURRENT_DATE, 1500, 45, 12, 8500, 15000, 420, 320, 65, 35, 1.5, 2.8, NOW())
ON CONFLICT (id) DO UPDATE SET
    followers = EXCLUDED.followers,
    total_reach = EXCLUDED.total_reach,
    total_engagement = EXCLUDED.total_engagement;

-- Sample Leads (from social media campaigns)
INSERT INTO leads (id, center_id, source_platform, campaign_id, parent_name, parent_phone, parent_email, student_name, student_age, status, lead_score, utm_source, utm_medium, utm_campaign, created_at, updated_at)
VALUES 
    ('e1b2c3d4-e5f6-7890-abcd-ef1234567891', NULL, 'facebook', 'c1b2c3d4-e5f6-7890-abcd-ef1234567895', 'Nguyen Van A', '0901234567', 'nguyenvana@email.com', 'Nguyen Minh', 12, 'NEW', 75, 'facebook', 'paid', 'summer_camp_2026', NOW() - INTERVAL '1 hour', NOW()),
    ('e1b2c3d4-e5f6-7890-abcd-ef1234567892', NULL, 'instagram', 'c1b2c3d4-e5f6-7890-abcd-ef1234567892', 'Tran Thi B', '0912345678', 'tranthib@email.com', 'Tran Anh', 18, 'CONTACTED', 85, 'instagram', 'organic', 'ielts_success', NOW() - INTERVAL '2 days', NOW()),
    ('e1b2c3d4-e5f6-7890-abcd-ef1234567893', NULL, 'tiktok', 'c1b2c3d4-e5f6-7890-abcd-ef1234567896', 'Le Van C', '0923456789', 'levanc@email.com', 'Le Hoa', 16, 'QUALIFIED', 90, 'tiktok', 'paid', 'tiktok_brand', NOW() - INTERVAL '3 days', NOW()),
    ('e1b2c3d4-e5f6-7890-abcd-ef1234567894', NULL, 'website', NULL, 'Pham Thi D', '0934567890', 'phamthid@email.com', 'Pham Nam', 10, 'NEW', 60, 'google', 'organic', NULL, NOW() - INTERVAL '5 hours', NOW()),
    ('e1b2c3d4-e5f6-7890-abcd-ef1234567895', NULL, 'facebook', 'c1b2c3d4-e5f6-7890-abcd-ef1234567891', 'Hoang Van E', '0945678901', 'hoangvane@email.com', 'Hoang Linh', 8, 'CONVERTED', 95, 'facebook', 'paid', 'summer_camp_2026', NOW() - INTERVAL '1 week', NOW())
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    lead_score = EXCLUDED.lead_score,
    updated_at = NOW();

-- Ad Accounts
INSERT INTO ad_accounts (id, platform, account_id, account_name, currency, timezone, is_active, is_connected, daily_budget, total_budget, created_at, updated_at)
VALUES 
    ('f1b2c3d4-e5f6-7890-abcd-ef1234567891', 'facebook', 'act_123456789', 'LERA Academy - Main', 'VND', 'Asia/Ho_Chi_Minh', true, true, 2000000, 50000000, NOW(), NOW()),
    ('f1b2c3d4-e5f6-7890-abcd-ef1234567892', 'google', 'ads_987654321', 'LERA Academy Google Ads', 'VND', 'Asia/Ho_Chi_Minh', true, true, 1500000, 40000000, NOW(), NOW()),
    ('f1b2c3d4-e5f6-7890-abcd-ef1234567893', 'tiktok', 'tiktok_ads_456', 'LERA TikTok Ads', 'VND', 'Asia/Ho_Chi_Minh', true, true, 1000000, 30000000, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
