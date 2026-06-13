-- Smart CRM: lead scoring, duplicate detection, speed-to-lead.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS temperature VARCHAR(10);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS duplicate BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS duplicate_of_lead_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_contacted_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads (parent_phone);
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON leads (temperature);
