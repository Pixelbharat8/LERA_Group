-- Marketing & Social Media Database Migration
-- Run this script to add marketing tables and seed data

-- Add follower_count and growth_rate to social_platforms if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_platforms' AND column_name = 'follower_count') THEN
        ALTER TABLE social_platforms ADD COLUMN follower_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_platforms' AND column_name = 'growth_rate') THEN
        ALTER TABLE social_platforms ADD COLUMN growth_rate DECIMAL(5,2) DEFAULT 0.0;
    END IF;
END $$;

-- Delete existing platforms and insert fresh data
DELETE FROM social_platforms WHERE platform_name IN ('facebook', 'instagram', 'tiktok', 'zalo', 'youtube', 'twitter');

-- Insert default social platforms
INSERT INTO social_platforms (id, platform_name, display_name, icon, color, follower_count, growth_rate, is_connected, is_active, created_at, updated_at)
VALUES
    (uuid_generate_v4(), 'facebook', 'Facebook', '📘', '#1877F2', 12500, 8.5, true, true, NOW(), NOW()),
    (uuid_generate_v4(), 'instagram', 'Instagram', '📸', '#E4405F', 8300, 12.3, true, true, NOW(), NOW()),
    (uuid_generate_v4(), 'tiktok', 'TikTok', '🎵', '#000000', 5100, 28.5, true, true, NOW(), NOW()),
    (uuid_generate_v4(), 'zalo', 'Zalo', '💬', '#0068FF', 3200, 5.2, true, true, NOW(), NOW()),
    (uuid_generate_v4(), 'youtube', 'YouTube', '📺', '#FF0000', 2800, 6.8, false, true, NOW(), NOW()),
    (uuid_generate_v4(), 'twitter', 'Twitter/X', '🐦', '#1DA1F2', 1500, 3.2, false, true, NOW(), NOW())
ON CONFLICT (platform_name) DO UPDATE SET
    follower_count = EXCLUDED.follower_count,
    growth_rate = EXCLUDED.growth_rate,
    updated_at = NOW();

-- Insert sample marketing campaigns
INSERT INTO marketing_campaigns (id, campaign_name, campaign_type, description, start_date, end_date, budget, spent_amount, status, leads_generated, conversions, created_at, updated_at)
VALUES
    (uuid_generate_v4(), 'New Year Enrollment 2026', 'SOCIAL_MEDIA', 'Promote new year enrollment with special discounts', '2026-01-01', '2026-01-31', 50000000, 23500000, 'ACTIVE', 156, 42, NOW(), NOW()),
    (uuid_generate_v4(), 'Summer Camp Early Bird', 'EMAIL', 'Early bird registration for summer camp', '2026-01-15', '2026-03-15', 30000000, 8200000, 'ACTIVE', 89, 28, NOW(), NOW()),
    (uuid_generate_v4(), 'IELTS Preparation Course Launch', 'SOCIAL_MEDIA', 'Launch campaign for new IELTS preparation course', '2026-02-01', '2026-02-28', 40000000, 0, 'SCHEDULED', 0, 0, NOW(), NOW()),
    (uuid_generate_v4(), 'Open Day Event Promotion', 'EVENT', 'Promote upcoming open day event', '2025-12-01', '2025-12-20', 20000000, 18500000, 'COMPLETED', 234, 78, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert sample social media posts
INSERT INTO social_media_posts (id, title, content, content_type, platforms, status, scheduled_at, published_at, likes, shares, reach, impressions, created_at, updated_at)
VALUES
    (uuid_generate_v4(), 'Student Success Story', 'Meet Minh, who achieved IELTS 8.0 after 3 months! 🎉 #LERASuccess #IELTS', 'post', ARRAY['facebook', 'instagram', 'zalo'], 'SCHEDULED', NOW() + INTERVAL '1 day', NULL, 0, 0, 0, 0, NOW(), NOW()),
    (uuid_generate_v4(), 'Behind the Scenes', 'A day in the life at LERA Academy! 📚✨ #BehindTheScenes #LERALife', 'reel', ARRAY['tiktok', 'instagram'], 'SCHEDULED', NOW() + INTERVAL '2 days', NULL, 0, 0, 0, 0, NOW(), NOW()),
    (uuid_generate_v4(), 'Weekly Tips', 'English Tip of the Week: 5 ways to improve your speaking! 🗣️ #EnglishTips', 'post', ARRAY['facebook'], 'SCHEDULED', NOW() + INTERVAL '3 days', NULL, 0, 0, 0, 0, NOW(), NOW()),
    (uuid_generate_v4(), 'New Year Enrollment Promo', '🎊 New Year Special! Enroll now and get 20% off your first course! Limited time only! 🎊', 'post', ARRAY['facebook', 'instagram', 'zalo'], 'PUBLISHED', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', 156, 23, 4520, 8900, NOW(), NOW()),
    (uuid_generate_v4(), 'Summer Camp Preview', '☀️ Summer Camp 2026 is coming! Stay tuned for early bird registration! 🏕️', 'story', ARRAY['instagram', 'tiktok'], 'PUBLISHED', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours', 89, 12, 2340, 5600, NOW(), NOW()),
    (uuid_generate_v4(), 'TikTok Milestone', '🎉 We just hit 5,000 followers on TikTok! Thank you all! 🙏', 'post', ARRAY['tiktok', 'instagram', 'facebook'], 'PUBLISHED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 523, 87, 12500, 28000, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert sample social analytics data (using correct column names)
INSERT INTO social_analytics (id, platform, metric_date, followers, new_followers, total_impressions, total_reach, total_engagement, profile_views, created_at)
VALUES
    (uuid_generate_v4(), 'facebook', CURRENT_DATE, 12500, 45, 45000, 28000, 3200, 1200, NOW()),
    (uuid_generate_v4(), 'facebook', CURRENT_DATE - INTERVAL '1 day', 12455, 52, 42000, 26500, 3050, 1150, NOW()),
    (uuid_generate_v4(), 'instagram', CURRENT_DATE, 8300, 38, 32000, 21000, 2800, 980, NOW()),
    (uuid_generate_v4(), 'instagram', CURRENT_DATE - INTERVAL '1 day', 8262, 42, 30500, 19800, 2650, 920, NOW()),
    (uuid_generate_v4(), 'tiktok', CURRENT_DATE, 5100, 125, 85000, 52000, 8500, 450, NOW()),
    (uuid_generate_v4(), 'tiktok', CURRENT_DATE - INTERVAL '1 day', 4975, 118, 78000, 48000, 7800, 420, NOW()),
    (uuid_generate_v4(), 'zalo', CURRENT_DATE, 3200, 18, 15000, 9800, 1200, 520, NOW()),
    (uuid_generate_v4(), 'zalo', CURRENT_DATE - INTERVAL '1 day', 3182, 22, 14200, 9200, 1100, 480, NOW())
ON CONFLICT DO NOTHING;

-- Check and add total_spent column to ad_accounts if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_accounts' AND column_name = 'total_spent') THEN
        ALTER TABLE ad_accounts ADD COLUMN total_spent DECIMAL(12,2) DEFAULT 0;
    END IF;
END $$;

-- Insert sample ad accounts
INSERT INTO ad_accounts (id, platform, account_name, account_id, currency, is_active, daily_budget, monthly_budget, total_spent, created_at, updated_at)
VALUES
    (uuid_generate_v4(), 'facebook', 'LERA Main Ad Account', 'act_123456789', 'VND', true, 5000000, 150000000, 45600000, NOW(), NOW()),
    (uuid_generate_v4(), 'google', 'LERA Google Ads', 'ads_987654321', 'VND', true, 3000000, 90000000, 28300000, NOW(), NOW()),
    (uuid_generate_v4(), 'tiktok', 'LERA TikTok Business', 'tiktok_456789', 'VND', true, 2000000, 60000000, 12500000, NOW(), NOW())
ON CONFLICT DO NOTHING;

SELECT 'Marketing database migration completed successfully!' as status;
