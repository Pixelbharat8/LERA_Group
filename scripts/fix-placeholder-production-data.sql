-- LERA: replace placeholder data that reaches customers.
--
-- Written 2026-09-20. Applied and verified on the development database; PRODUCTION HAS NOT
-- BEEN INSPECTED and was built from the same seed, so it very likely needs all of this.
--
-- READ BEFORE RUNNING: the contact details below are taken from constants the repository
-- marks "REAL DATA from LERA Academy" and corroborates across ~19 (address), ~14 (phone)
-- and ~6 (email) references in the public pages. Confirm each against what LERA actually
-- uses before running — a wrong digit here is a phone number that does not ring.
--
-- Run inside a transaction so you can inspect before committing:
--   BEGIN; \i scripts/fix-placeholder-production-data.sql
--   SELECT setting_key, setting_value FROM cms_settings WHERE category='contact';
--   SELECT email FROM users; SELECT name, address, city FROM centers;
--   COMMIT;   -- or ROLLBACK;

-- Replace placeholder contact details with the values the codebase documents as real.
-- Corroboration: 19 references to the Vinhomes Marina address, 14 to the phone number
-- (tel: links, Zalo link, SEO description), 6 to the email, across the public pages.
-- UPSERT, not UPDATE. A plain UPDATE changes 0 rows when the key is absent, and a fresh
-- database has NO cms_settings rows at all — so the original form silently did nothing on
-- exactly the database this script matters most for. The public pages fall back to correct
-- values in code, which is why that went unnoticed, but the Super Admin -> Public Website
-- editor reads these rows and would have shown empty fields.
-- Written as UPDATE-then-INSERT-if-absent rather than ON CONFLICT so it does not depend on
-- the unique index on setting_key being present.
UPDATE cms_settings SET setting_value = '95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng',
       updated_at = NOW() WHERE setting_key = 'contact_address';
INSERT INTO cms_settings (id, setting_key, setting_value, setting_type, category, updated_at)
SELECT gen_random_uuid(), 'contact_address',
       '95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng', 'text', 'contact', NOW()
 WHERE NOT EXISTS (SELECT 1 FROM cms_settings WHERE setting_key = 'contact_address');

UPDATE cms_settings SET setting_value = '0387.633.141', updated_at = NOW()
  WHERE setting_key = 'contact_phone';
INSERT INTO cms_settings (id, setting_key, setting_value, setting_type, category, updated_at)
SELECT gen_random_uuid(), 'contact_phone', '0387.633.141', 'text', 'contact', NOW()
 WHERE NOT EXISTS (SELECT 1 FROM cms_settings WHERE setting_key = 'contact_phone');

UPDATE cms_settings SET setting_value = 'info@leraacademy.edu.vn', updated_at = NOW()
  WHERE setting_key = 'contact_email';
INSERT INTO cms_settings (id, setting_key, setting_value, setting_type, category, updated_at)
SELECT gen_random_uuid(), 'contact_email', 'info@leraacademy.edu.vn', 'text', 'contact', NOW()
 WHERE NOT EXISTS (SELECT 1 FROM cms_settings WHERE setting_key = 'contact_email');

-- The original clause here was WHERE address LIKE '123 Education Street%'. No such string
-- exists anywhere in this repository: the seeded centres are in Ho Chi Minh City ('123
-- Nguyen Hue Street, District 1' and friends), so that clause matched nothing and the centre
-- address was never actually corrected. LERA operates in Hải Phòng, ~1,700 km away.
--
-- Scoped to the HQ row on purpose. Three placeholder centres were seeded; rewriting every
-- non-Hải Phòng row to this address would collapse three distinct centres into one identity
-- and quietly invent two more Vinhomes Marina branches. The other two are listed by the
-- verification query at the end of this file for a human to decide on.
UPDATE centers SET
    name    = 'LERA Academy - Vinhomes Marina',
    name_vi = 'LERA Academy - Vinhomes Marina',
    address = '95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng',
    address_vi = '95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng',
    city     = 'Hải Phòng',
    district = 'An Biên',
    phone    = '0387.633.141',
    email    = 'info@leraacademy.edu.vn'
  WHERE code = 'HQ'
     OR address LIKE '123 Education Street%';

-- The other two seeded centres are in Ho Chi Minh City and are not LERA branches. The public
-- /centers page and the homepage both call GET /api/centers, which returns every row except
-- those with status 'DELETED' — so they WOULD be listed to customers as LERA locations, and
-- marking them merely INACTIVE would not hide them.
--
-- 'DELETED' is the application's own soft-delete (CenterService.deleteCenter sets exactly this,
-- and getAllCenters filters it out), so this is reversible and cannot orphan a foreign key the
-- way a hard DELETE would — seeded students reference these center_ids.
--
-- Scoped by the seeded id prefix, not by city: a real Ho Chi Minh City branch LERA opens later
-- must not be caught by a script that still happens to be lying around.
UPDATE centers SET status = 'DELETED'
  WHERE id::text LIKE 'c0000000-%'
    AND code <> 'HQ'
    AND city IS DISTINCT FROM 'Hải Phòng';

-- The Vietnamese address column too: the public centres page reads addressVi and falls back to
-- address, so leaving it null is invisible here only because the address is already Vietnamese.
UPDATE centers SET address_vi = address WHERE address_vi IS NULL AND address IS NOT NULL;
-- SECURITY: /api/auth/forgot-password is permitAll and mails a reset link to whatever address
-- is on the account. These two SUPER_ADMIN accounts sat on domains LERA does not own, so the
-- moment SMTP is configured either one would hand a stranger a SUPER_ADMIN reset link.
-- Renamed, not deleted: the ids are unchanged, so audit trails and created_by stay intact.
UPDATE users SET email = 'admin@leraacademy.edu.vn'      WHERE email = 'admin@lera.com';
UPDATE users SET email = 'superadmin@leraacademy.edu.vn' WHERE email = 'admin@lera.edu.vn';

-- ---------------------------------------------------------------------------
-- Demo-seed rows still served or counted. The three public ones are safe to
-- clear: each section hides itself when empty (verified on /about, /contact).
-- ---------------------------------------------------------------------------
DELETE FROM testimonials    WHERE id::text LIKE '5eed%';
DELETE FROM faqs            WHERE id::text LIKE '5eed%';
DELETE FROM leadership_team WHERE id::text LIKE '5eed%';

-- Fabricated CRM pipeline: 11 alphabet-placeholder leads (Nguyen Van A ... Vo Thi K),
-- 2 marked CONVERTED, producing an invented 18.2% conversion rate and invented
-- channel attribution on the marketing ROI screen.
DELETE FROM leads WHERE parent_name ~ '^(Nguyen|Tran|Le|Pham|Hoang|Vo|Dang|Bui|Do|Ngo|Duong|Ly)[ ](Van|Thi)[ ][A-Z]$';

-- NOT included on purpose — financial and operational records are LERA's call:
--   payroll (7 runs, ~322M VND), salary_payouts, teacher_salaries, teacher_overtime,
--   teacher_salary_config, certificates, banners, leave_balance_accruals,
--   rule_conditions/actions/executions, ai_* (4 tables).
-- Inspect first:
--   SELECT 'payroll' t, count(*) FROM payroll WHERE id::text LIKE '5eed%'
--   UNION ALL SELECT 'certificates', count(*) FROM certificates WHERE id::text LIKE '5eed%';

-- ---------------------------------------------------------------------------
-- VERIFICATION — run these before COMMIT. They answer "did the contact details
-- actually change, and is anything still pointing somewhere LERA does not operate?"

-- 1. The public contact block. Expect three rows, all Hải Phòng / 0387.633.141 /
--    info@leraacademy.edu.vn. Before this script's upsert these could be absent entirely.
SELECT setting_key, setting_value
  FROM cms_settings
 WHERE setting_key IN ('contact_address', 'contact_phone', 'contact_email')
 ORDER BY setting_key;

-- 2. Any centre not in Hải Phòng. The HQ row is corrected above; anything else listed here
--    is a seeded placeholder in the wrong province and needs a human decision — rename it to
--    a real branch, or delete it if LERA has only the one location. It is NOT auto-rewritten,
--    because giving three different centres one identity would be worse than leaving them.
SELECT code, name, address, city, phone, email
  FROM centers
 WHERE city IS DISTINCT FROM 'Hải Phòng'
   AND status IS DISTINCT FROM 'DELETED'
 ORDER BY code;

-- 3. Any remaining account on a domain LERA does not own. Must return no rows before SMTP
--    is enabled — forgot-password is public and mails the reset link to whatever is here.
SELECT email FROM users WHERE email !~* '@leraacademy\.edu\.vn$';
