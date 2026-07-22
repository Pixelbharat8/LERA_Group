-- LERA — default public-site CMS content (hero image + homepage gallery).
--
-- The website_settings / cms_settings tables are admin-configured (Super Admin →
-- Website Settings). On a fresh DB they're empty, so the public homepage falls
-- back to bundled placeholder images. This seed points the hero and the homepage
-- gallery at the REAL LERA photos already shipped in frontend/public/images/, so
-- an unconfigured install still shows genuine photos from the database.
--
-- Idempotent: safe to re-run. Edit/replace via the admin UI for production content.
-- Apply:  psql -h localhost -U lera -d lera -f database/migrations/cms_website_content_seed.sql

-- Hero background (website_settings.setting_value is JSONB).
INSERT INTO website_settings (id, setting_key, setting_value, updated_at) VALUES
  (gen_random_uuid(), 'hero_image', '"/images/gallery/1769244373931-main.jpg"'::jsonb, now())
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = now();

-- Homepage gallery (cms_settings, category='gallery'; setting_value is TEXT).
INSERT INTO cms_settings (id, category, setting_key, setting_type, setting_value, updated_at) VALUES
  (gen_random_uuid(),'gallery','gallery_count','number','5', now()),
  (gen_random_uuid(),'gallery','gallery_0_src','image','/images/uploads/1769696032658-main.jpg', now()),
  (gen_random_uuid(),'gallery','gallery_0_caption_en','text','Where excellence is the standard', now()),
  (gen_random_uuid(),'gallery','gallery_0_caption_vi','text','Nơi xuất sắc là tiêu chuẩn', now()),
  (gen_random_uuid(),'gallery','gallery_1_src','image','/images/gallery/1768668431496-main.jpg', now()),
  (gen_random_uuid(),'gallery','gallery_1_caption_en','text','Interactive English classes', now()),
  (gen_random_uuid(),'gallery','gallery_1_caption_vi','text','Lớp học tiếng Anh tương tác', now()),
  (gen_random_uuid(),'gallery','gallery_2_src','image','/images/gallery/1769244373931-main.jpg', now()),
  (gen_random_uuid(),'gallery','gallery_2_caption_en','text','Small, focused classes', now()),
  (gen_random_uuid(),'gallery','gallery_2_caption_vi','text','Lớp học nhỏ, tập trung', now()),
  (gen_random_uuid(),'gallery','gallery_3_src','image','/images/uploads/1769869085843-main.jpg', now()),
  (gen_random_uuid(),'gallery','gallery_3_caption_en','text','Confident young learners', now()),
  (gen_random_uuid(),'gallery','gallery_3_caption_vi','text','Học viên nhỏ tự tin', now()),
  (gen_random_uuid(),'gallery','gallery_4_src','image','/images/uploads/1769909549952-main.jpg', now()),
  (gen_random_uuid(),'gallery','gallery_4_caption_en','text','Learning that lasts', now()),
  (gen_random_uuid(),'gallery','gallery_4_caption_vi','text','Học tập bền vững', now())
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = now();
