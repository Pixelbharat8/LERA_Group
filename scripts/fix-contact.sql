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
