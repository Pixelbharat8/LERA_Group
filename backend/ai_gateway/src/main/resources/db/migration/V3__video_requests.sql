-- Video render requests. Students/customers can only REQUEST a video; the marketing/manager
-- team approves and triggers the (paid) render — so students never trigger provider spend directly.
CREATE TABLE IF NOT EXISTS video_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID,
    requester_label VARCHAR(200),
    prompt TEXT NOT NULL,
    images TEXT,
    aspect_ratio VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    result_url TEXT,
    cost NUMERIC(10,2) DEFAULT 0,
    decided_by UUID,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    decided_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_video_requests_status ON video_requests(status);
CREATE INDEX IF NOT EXISTS idx_video_requests_requester ON video_requests(requester_id);
