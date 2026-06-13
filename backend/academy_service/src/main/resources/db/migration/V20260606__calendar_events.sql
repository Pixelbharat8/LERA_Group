-- Calendar events — replaces the former in-memory CalendarController stub with a real table.
CREATE TABLE IF NOT EXISTS calendar_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    start_date  TIMESTAMP NOT NULL,
    end_date    TIMESTAMP,
    type        VARCHAR(50)  DEFAULT 'event',
    color       VARCHAR(50)  DEFAULT 'bg-blue-500',
    location    VARCHAR(255),
    all_day     BOOLEAN      DEFAULT FALSE,
    center_id   UUID,
    created_by  UUID,
    created_at  TIMESTAMP    DEFAULT now(),
    updated_at  TIMESTAMP    DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events (start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_center     ON calendar_events (center_id);
