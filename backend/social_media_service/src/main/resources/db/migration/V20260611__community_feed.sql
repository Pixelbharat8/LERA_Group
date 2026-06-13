-- Community feed (posts + events) — replaces the in-memory SocialController stub.
CREATE TABLE IF NOT EXISTS community_posts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id     UUID,
    author_name   VARCHAR(255),
    author_avatar VARCHAR(500),
    content       TEXT,
    image_url     VARCHAR(500),
    likes         INTEGER DEFAULT 0,
    comments      INTEGER DEFAULT 0,
    shares        INTEGER DEFAULT 0,
    center_id     UUID,
    created_at    TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_post_center ON community_posts (center_id);

CREATE TABLE IF NOT EXISTS community_events (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title          VARCHAR(255),
    description    TEXT,
    event_date     TIMESTAMP,
    location       VARCHAR(255),
    organizer_id   UUID,
    organizer_name VARCHAR(255),
    attendees      INTEGER DEFAULT 0,
    max_attendees  INTEGER,
    status         VARCHAR(30) DEFAULT 'upcoming',
    center_id      UUID,
    created_at     TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_event_center ON community_events (center_id);
CREATE INDEX IF NOT EXISTS idx_community_event_status ON community_events (status);
