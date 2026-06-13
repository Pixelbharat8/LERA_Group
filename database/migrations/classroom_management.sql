-- Classroom Management Database Migration
-- Adds more classroom seed data with complete information

-- Get IDs for foreign keys
DO $$
DECLARE
    v_center_id UUID;
    v_starters_program UUID := '7a2dd34a-fc64-428e-8cd9-77ee6df4744b';
    v_explorers_program UUID := '5048beb6-2b50-4d9d-97ad-d0aed0e65ac4';
    v_primary_program UUID := '0ad4be0b-e7ac-4fbd-ab80-2ac46d0ba9c8';
    v_teens_program UUID := 'f126ad50-6216-4704-9734-97c37ce1e367';
    v_ielts_program UUID := '2f9e7e3f-f7fe-42fb-a638-030aca8f9a19';
    v_teacher_id UUID;
BEGIN
    -- Get first center
    SELECT id INTO v_center_id FROM centers LIMIT 1;
    
    -- Get a teacher ID
    SELECT u.id INTO v_teacher_id FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE r.name = 'TEACHER' LIMIT 1;
    
    -- If no teacher found, get any user
    IF v_teacher_id IS NULL THEN
        SELECT id INTO v_teacher_id FROM users LIMIT 1;
    END IF;

    -- Update existing classes with room and schedule info
    UPDATE classes SET 
        room = 'Room 101',
        schedule_days = 'Mon, Wed, Fri',
        schedule_time_start = '09:00:00',
        schedule_time_end = '10:30:00',
        center_id = v_center_id
    WHERE name = 'Starters - Monday Class';

    UPDATE classes SET 
        room = 'Room 102',
        schedule_days = 'Tue, Thu',
        schedule_time_start = '14:00:00',
        schedule_time_end = '15:30:00',
        center_id = v_center_id
    WHERE name = 'Starters - Wednesday Class';

    -- Insert additional classes
    INSERT INTO classes (id, name, center_id, program_id, teacher_id, room, schedule_days, schedule_time_start, schedule_time_end, start_date, end_date, max_students, status, created_at, updated_at)
    VALUES
        -- Explorers Classes
        (uuid_generate_v4(), 'Explorers - Morning Class A', v_center_id, v_explorers_program, v_teacher_id, 'Room 201', 'Mon, Wed, Fri', '08:00:00', '09:30:00', '2026-01-06', '2026-06-30', 18, 'OPEN', NOW(), NOW()),
        (uuid_generate_v4(), 'Explorers - Afternoon Class B', v_center_id, v_explorers_program, v_teacher_id, 'Room 202', 'Tue, Thu, Sat', '14:00:00', '15:30:00', '2026-01-07', '2026-06-30', 18, 'OPEN', NOW(), NOW()),
        
        -- Primary Classes
        (uuid_generate_v4(), 'Primary - Advanced Reading', v_center_id, v_primary_program, v_teacher_id, 'Room 301', 'Mon, Wed', '16:00:00', '17:30:00', '2026-01-06', '2026-06-30', 15, 'OPEN', NOW(), NOW()),
        (uuid_generate_v4(), 'Primary - Creative Writing', v_center_id, v_primary_program, v_teacher_id, 'Room 302', 'Tue, Thu', '16:00:00', '17:30:00', '2026-01-07', '2026-06-30', 15, 'OPEN', NOW(), NOW()),
        
        -- Teens Classes
        (uuid_generate_v4(), 'Teens - English Fluency', v_center_id, v_teens_program, v_teacher_id, 'Room 401', 'Mon, Wed, Fri', '17:30:00', '19:00:00', '2026-01-06', '2026-06-30', 20, 'OPEN', NOW(), NOW()),
        (uuid_generate_v4(), 'Teens - Academic English', v_center_id, v_teens_program, v_teacher_id, 'Room 402', 'Sat', '09:00:00', '12:00:00', '2026-01-11', '2026-06-30', 20, 'OPEN', NOW(), NOW()),
        
        -- IELTS Classes
        (uuid_generate_v4(), 'IELTS Intensive - Band 6.5+', v_center_id, v_ielts_program, v_teacher_id, 'Room 501', 'Mon, Wed, Fri', '18:00:00', '20:00:00', '2026-01-06', '2026-03-31', 12, 'OPEN', NOW(), NOW()),
        (uuid_generate_v4(), 'IELTS Weekend - Band 7.0+', v_center_id, v_ielts_program, v_teacher_id, 'Room 502', 'Sat, Sun', '09:00:00', '12:00:00', '2026-01-11', '2026-03-31', 10, 'OPEN', NOW(), NOW()),
        
        -- Full/Closed Classes
        (uuid_generate_v4(), 'Starters - Premium Class', v_center_id, v_starters_program, v_teacher_id, 'Room 103', 'Mon, Wed, Fri', '10:00:00', '11:30:00', '2025-09-01', '2025-12-20', 12, 'FULL', NOW(), NOW()),
        (uuid_generate_v4(), 'IELTS Intensive - Completed', v_center_id, v_ielts_program, v_teacher_id, 'Room 501', 'Mon, Wed, Fri', '18:00:00', '20:00:00', '2025-10-01', '2025-12-31', 12, 'CLOSED', NOW(), NOW())
    ON CONFLICT DO NOTHING;

END $$;

-- Create class_schedules table if not exists
CREATE TABLE IF NOT EXISTS class_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 1=Monday to 7=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create class_sessions table if not exists (for tracking individual sessions)
CREATE TABLE IF NOT EXISTS class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    topic VARCHAR(255),
    description TEXT,
    status VARCHAR(20) DEFAULT 'SCHEDULED', -- SCHEDULED, COMPLETED, CANCELLED
    teacher_id UUID,
    substitute_teacher_id UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create class_schedule_exceptions table if not exists
CREATE TABLE IF NOT EXISTS class_schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    exception_type VARCHAR(50) NOT NULL, -- CANCELLED, RESCHEDULED, MAKEUP
    reason TEXT,
    new_date DATE,
    new_start_time TIME,
    new_end_time TIME,
    new_room VARCHAR(100),
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_class_sessions_class_id ON class_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON class_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_class_schedule_exceptions_class_id ON class_schedule_exceptions(class_id);
CREATE INDEX IF NOT EXISTS idx_class_schedule_exceptions_date ON class_schedule_exceptions(exception_date);

SELECT 'Classroom management database migration completed!' as status;
