-- V1__baseline.sql — Connect Service indexes for 10M+ scale

CREATE INDEX IF NOT EXISTS idx_leads_center_id ON leads (center_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads (assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_source_id ON leads (source_id);  -- fixed 2026-06-28: was leads.source, no such column; the source FK is source_id
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead_id ON lead_assignments (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_assigned_to ON lead_assignments (assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals (lead_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals (stage);
CREATE INDEX IF NOT EXISTS idx_deals_center_id ON deals (center_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_chat_messages_lead_id ON chat_messages (lead_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sent_at ON chat_messages (sent_at);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations (created_at);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks (assignee_id);  -- fixed 2026-06-28: was tasks.assigned_to, no such column; the assignee column is assignee_id
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_lead_followups_lead_id ON lead_followups (lead_id);  -- fixed 2026-06-28: entity table is lead_followups, not followups
