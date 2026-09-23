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
UPDATE cms_settings SET setting_value = '95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng'
  WHERE setting_key = 'contact_address';
UPDATE cms_settings SET setting_value = '0387.633.141'             WHERE setting_key = 'contact_phone';
UPDATE cms_settings SET setting_value = 'info@leraacademy.edu.vn'  WHERE setting_key = 'contact_email';

UPDATE centers SET
    name    = 'LERA Academy - Vinhomes Marina',
    name_vi = 'LERA Academy - Vinhomes Marina',
    address = '95 Hải Đăng, khu đô thị Vinhomes Marina, phường An Biên, Hải Phòng',
    city     = 'Hải Phòng',
    district = 'An Biên',
    phone    = '0387.633.141',
    email    = 'info@leraacademy.edu.vn'
  WHERE address LIKE '123 Education Street%';

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
