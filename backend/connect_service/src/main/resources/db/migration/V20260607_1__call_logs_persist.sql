-- Call logs are now persisted (controller was in-memory). Add outcome + allow standalone calls.
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS outcome VARCHAR(50);
ALTER TABLE call_logs ALTER COLUMN lead_id DROP NOT NULL;
