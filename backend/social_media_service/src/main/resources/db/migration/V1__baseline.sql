-- V1__baseline.sql — Social Media Service indexes for 10M+ scale
--
-- FIXED 2026-06-28 (pre-launch fresh-DB Flyway audit): several indexes referenced columns
-- that the real entities do not have, and would fail Flyway on a fresh prod DB:
--   • social_media_posts.platform_id  — removed: posts are multi-platform (`platforms` list),
--     there is no single platform FK; per-platform ids are facebook_post_id/instagram_post_id/etc.
--   • social_analytics.post_id        — removed: social_analytics rows are per-platform/per-date
--     aggregates (platform, metric_date, followers…), not per-post.
--   • social_analytics.platform_id    — corrected to `platform` (the real grouping column).
--   • social_platforms.platform_type  — corrected to `platform_name` (the real identifier column).
-- Verified against the live ddl-auto schema.

CREATE INDEX IF NOT EXISTS idx_social_media_posts_status ON social_media_posts (status);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_scheduled_at ON social_media_posts (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_social_analytics_platform ON social_analytics (platform);
CREATE INDEX IF NOT EXISTS idx_social_analytics_metric_date ON social_analytics (metric_date);
CREATE INDEX IF NOT EXISTS idx_social_platforms_platform_name ON social_platforms (platform_name);
