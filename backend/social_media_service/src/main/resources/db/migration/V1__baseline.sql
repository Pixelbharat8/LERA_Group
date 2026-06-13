-- V1__baseline.sql — Social Media Service indexes for 10M+ scale

CREATE INDEX IF NOT EXISTS idx_social_media_posts_platform_id ON social_media_posts (platform_id);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_status ON social_media_posts (status);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_scheduled_at ON social_media_posts (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_social_analytics_post_id ON social_analytics (post_id);
CREATE INDEX IF NOT EXISTS idx_social_analytics_platform_id ON social_analytics (platform_id);
CREATE INDEX IF NOT EXISTS idx_social_platforms_platform_type ON social_platforms (platform_type);
