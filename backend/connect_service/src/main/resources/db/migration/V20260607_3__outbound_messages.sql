-- Outbound messaging log (Zalo / SMS / Email).
CREATE TABLE IF NOT EXISTS outbound_messages (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id       UUID,
    to_phone      VARCHAR(50),
    channel       VARCHAR(20),
    body          TEXT,
    status        VARCHAR(20),
    provider      VARCHAR(100),
    error_message TEXT,
    sent_by       UUID,
    created_at    TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_outmsg_lead    ON outbound_messages (lead_id);
CREATE INDEX IF NOT EXISTS idx_outmsg_channel ON outbound_messages (channel);
CREATE INDEX IF NOT EXISTS idx_outmsg_status  ON outbound_messages (status);
