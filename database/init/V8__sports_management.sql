-- V8: Sports Management Tables
-- Migration for Sports Module functionality

-- Sport Types
CREATE TABLE IF NOT EXISTS sport_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    max_team_size INTEGER,
    min_team_size INTEGER,
    rules TEXT,
    equipment_required JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sport Facilities
CREATE TABLE IF NOT EXISTS sport_facilities (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(100), -- 'field', 'court', 'pool', 'gym'
    location VARCHAR(255),
    capacity INTEGER,
    amenities JSONB,
    description TEXT,
    images JSONB,
    booking_rules JSONB,
    hourly_rate DECIMAL(12,2),
    is_indoor BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    maintenance_schedule JSONB,
    center_id BIGINT REFERENCES centers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sport Equipment
CREATE TABLE IF NOT EXISTS sport_equipment (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sport_type_id BIGINT REFERENCES sport_types(id),
    category VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    quantity INTEGER DEFAULT 1,
    available_quantity INTEGER DEFAULT 1,
    condition VARCHAR(50) DEFAULT 'good', -- 'new', 'good', 'fair', 'poor'
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    location VARCHAR(255),
    images JSONB,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Assignments
CREATE TABLE IF NOT EXISTS equipment_assignments (
    id BIGSERIAL PRIMARY KEY,
    equipment_id BIGINT REFERENCES sport_equipment(id),
    assigned_to_id BIGINT REFERENCES users(id),
    assigned_to_type VARCHAR(50), -- 'student', 'teacher', 'team'
    team_id BIGINT,
    quantity INTEGER DEFAULT 1,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    returned_at TIMESTAMP,
    return_condition VARCHAR(50),
    status VARCHAR(50) DEFAULT 'assigned', -- 'assigned', 'returned', 'lost', 'damaged'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sport Teams
CREATE TABLE IF NOT EXISTS sport_teams (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sport_type_id BIGINT REFERENCES sport_types(id),
    center_id BIGINT REFERENCES centers(id),
    category VARCHAR(100), -- 'junior', 'senior', 'mixed'
    age_group VARCHAR(50),
    gender VARCHAR(50), -- 'male', 'female', 'mixed'
    coach_id BIGINT REFERENCES teachers(id),
    assistant_coach_id BIGINT REFERENCES teachers(id),
    captain_id BIGINT REFERENCES students(id),
    logo_url VARCHAR(500),
    description TEXT,
    formation VARCHAR(50),
    home_color VARCHAR(50),
    away_color VARCHAR(50),
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    ranking INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT REFERENCES sport_teams(id) ON DELETE CASCADE,
    student_id BIGINT REFERENCES students(id),
    position VARCHAR(100),
    jersey_number INTEGER,
    role VARCHAR(50), -- 'player', 'captain', 'vice-captain', 'substitute'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'injured', 'suspended'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, student_id)
);

-- Student Skill Levels (sports)
CREATE TABLE IF NOT EXISTS student_skill_levels (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id),
    sport_type_id BIGINT REFERENCES sport_types(id),
    skill_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced', 'expert'
    rating DECIMAL(3,1),
    assessed_by BIGINT REFERENCES teachers(id),
    assessed_at TIMESTAMP,
    skills_detail JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, sport_type_id)
);

-- Teacher Skill Levels (coaching)
CREATE TABLE IF NOT EXISTS teacher_skill_levels (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT REFERENCES teachers(id),
    sport_type_id BIGINT REFERENCES sport_types(id),
    certification VARCHAR(255),
    certification_date DATE,
    expiry_date DATE,
    skill_level VARCHAR(50),
    specializations JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, sport_type_id)
);

-- Tournaments
CREATE TABLE IF NOT EXISTS tournaments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sport_type_id BIGINT REFERENCES sport_types(id),
    tournament_type VARCHAR(50), -- 'knockout', 'league', 'group_stage', 'round_robin'
    start_date DATE,
    end_date DATE,
    registration_deadline DATE,
    location VARCHAR(255),
    organizer VARCHAR(255),
    max_teams INTEGER,
    min_teams INTEGER,
    entry_fee DECIMAL(12,2),
    prize_pool DECIMAL(12,2),
    rules TEXT,
    bracket_data JSONB,
    status VARCHAR(50) DEFAULT 'upcoming', -- 'upcoming', 'registration', 'in_progress', 'completed', 'cancelled'
    winner_team_id BIGINT REFERENCES sport_teams(id),
    runner_up_team_id BIGINT REFERENCES sport_teams(id),
    images JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tournament Teams
CREATE TABLE IF NOT EXISTS tournament_teams (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id BIGINT REFERENCES sport_teams(id),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    group_name VARCHAR(50),
    seed_number INTEGER,
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'registered', -- 'registered', 'active', 'eliminated', 'winner'
    final_position INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, team_id)
);

-- Sport Matches
CREATE TABLE IF NOT EXISTS sport_matches (
    id BIGSERIAL PRIMARY KEY,
    sport_type_id BIGINT REFERENCES sport_types(id),
    tournament_id BIGINT REFERENCES tournaments(id),
    home_team_id BIGINT REFERENCES sport_teams(id),
    away_team_id BIGINT REFERENCES sport_teams(id),
    facility_id BIGINT REFERENCES sport_facilities(id),
    match_date TIMESTAMP,
    duration_minutes INTEGER,
    home_score INTEGER,
    away_score INTEGER,
    match_type VARCHAR(50), -- 'friendly', 'league', 'knockout', 'final'
    round VARCHAR(50),
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'postponed', 'cancelled'
    referee VARCHAR(255),
    attendance INTEGER,
    weather VARCHAR(50),
    highlights JSONB,
    match_report TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Match Events
CREATE TABLE IF NOT EXISTS match_events (
    id BIGSERIAL PRIMARY KEY,
    match_id BIGINT REFERENCES sport_matches(id) ON DELETE CASCADE,
    event_type VARCHAR(50), -- 'goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'injury'
    event_time INTEGER, -- minute of the match
    team_id BIGINT REFERENCES sport_teams(id),
    player_id BIGINT REFERENCES students(id),
    secondary_player_id BIGINT REFERENCES students(id), -- for assists, substitutions
    description TEXT,
    video_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player Statistics
CREATE TABLE IF NOT EXISTS player_statistics (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id),
    sport_type_id BIGINT REFERENCES sport_types(id),
    season VARCHAR(50),
    matches_played INTEGER DEFAULT 0,
    minutes_played INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    clean_sheets INTEGER DEFAULT 0,
    rating DECIMAL(3,1),
    stats_detail JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, sport_type_id, season)
);

-- Sport Training Sessions
CREATE TABLE IF NOT EXISTS sport_training_sessions (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT REFERENCES sport_teams(id),
    sport_type_id BIGINT REFERENCES sport_types(id),
    coach_id BIGINT REFERENCES teachers(id),
    facility_id BIGINT REFERENCES sport_facilities(id),
    session_date DATE,
    start_time TIME,
    end_time TIME,
    session_type VARCHAR(50), -- 'regular', 'fitness', 'tactical', 'recovery'
    focus_area VARCHAR(255),
    description TEXT,
    drills JSONB,
    equipment_needed JSONB,
    intensity_level VARCHAR(50),
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training Attendance
CREATE TABLE IF NOT EXISTS training_attendance (
    id BIGSERIAL PRIMARY KEY,
    training_session_id BIGINT REFERENCES sport_training_sessions(id) ON DELETE CASCADE,
    student_id BIGINT REFERENCES students(id),
    status VARCHAR(50) DEFAULT 'present', -- 'present', 'absent', 'late', 'excused'
    arrival_time TIME,
    departure_time TIME,
    performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(training_session_id, student_id)
);

-- Facility Bookings
CREATE TABLE IF NOT EXISTS facility_bookings (
    id BIGSERIAL PRIMARY KEY,
    facility_id BIGINT REFERENCES sport_facilities(id),
    booked_by BIGINT REFERENCES users(id),
    team_id BIGINT REFERENCES sport_teams(id),
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose VARCHAR(255),
    attendees_count INTEGER,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
    approved_by BIGINT REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    total_cost DECIMAL(12,2),
    is_paid BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_sport_teams_type ON sport_teams(sport_type_id);
CREATE INDEX idx_sport_teams_center ON sport_teams(center_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_student ON team_members(student_id);
CREATE INDEX idx_tournaments_type ON tournaments(sport_type_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_sport_matches_tournament ON sport_matches(tournament_id);
CREATE INDEX idx_sport_matches_date ON sport_matches(match_date);
CREATE INDEX idx_match_events_match ON match_events(match_id);
CREATE INDEX idx_player_statistics_student ON player_statistics(student_id);
CREATE INDEX idx_training_sessions_team ON sport_training_sessions(team_id);
CREATE INDEX idx_training_attendance_session ON training_attendance(training_session_id);
CREATE INDEX idx_facility_bookings_facility ON facility_bookings(facility_id);
CREATE INDEX idx_facility_bookings_date ON facility_bookings(booking_date);
