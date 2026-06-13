-- Hostel rooms + registrations (replaces in-memory HostelController stub).
CREATE TABLE IF NOT EXISTS hostel_rooms (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number   VARCHAR(50) NOT NULL,
    block         VARCHAR(50),
    floor         INTEGER,
    type          VARCHAR(50),
    capacity      INTEGER DEFAULT 1,
    occupancy     INTEGER DEFAULT 0,
    monthly_rent  NUMERIC(12,2),
    status        VARCHAR(30) DEFAULT 'AVAILABLE',
    description   TEXT,
    center_id     UUID,
    created_at    TIMESTAMP DEFAULT now(),
    updated_at    TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hostel_room_center ON hostel_rooms (center_id);
CREATE INDEX IF NOT EXISTS idx_hostel_room_status ON hostel_rooms (status);

CREATE TABLE IF NOT EXISTS hostel_registrations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id       UUID NOT NULL,
    student_name     VARCHAR(255),
    room_id          UUID,
    status           VARCHAR(30) DEFAULT 'PENDING',
    join_date        DATE,
    rejection_reason VARCHAR(255),
    center_id        UUID,
    created_at       TIMESTAMP DEFAULT now(),
    updated_at       TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hostel_reg_room    ON hostel_registrations (room_id);
CREATE INDEX IF NOT EXISTS idx_hostel_reg_student ON hostel_registrations (student_id);
CREATE INDEX IF NOT EXISTS idx_hostel_reg_status  ON hostel_registrations (status);
