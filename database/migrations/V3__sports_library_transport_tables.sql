-- ===========================================================
-- LERA Academy - Sports, Library & Transport Tables Migration
-- ===========================================================
-- Created: January 9, 2026
-- Purpose: Add missing tables for Sports, Library, and Transport modules
-- ===========================================================

-- ===========================================================
-- 🏆 SECTION S: SPORTS MANAGEMENT
-- ===========================================================

-- =============================
-- S.1 SPORT TYPES
-- =============================
CREATE TABLE IF NOT EXISTS sport_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_vi VARCHAR(100),
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_sport_types_tenant ON sport_types(tenant_id);

-- =============================
-- S.2 SPORT TEAMS
-- =============================
CREATE TABLE IF NOT EXISTS sport_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id),
    sport_type_id UUID REFERENCES sport_types(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    name_vi VARCHAR(255),
    team_code VARCHAR(50),
    description TEXT,
    logo_url TEXT,
    coach_id UUID,
    max_players INT DEFAULT 20,
    age_group VARCHAR(50),
    level VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, team_code)
);

CREATE INDEX idx_sport_teams_tenant ON sport_teams(tenant_id);
CREATE INDEX idx_sport_teams_sport_type ON sport_teams(sport_type_id);

-- =============================
-- S.3 TEAM MEMBERS
-- =============================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES sport_teams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    position VARCHAR(100),
    jersey_number INT,
    role VARCHAR(50) DEFAULT 'PLAYER', -- PLAYER, CAPTAIN, VICE_CAPTAIN
    join_date DATE DEFAULT CURRENT_DATE,
    leave_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(team_id, student_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_student ON team_members(student_id);

-- =============================
-- S.4 SPORT MATCHES
-- =============================
CREATE TABLE IF NOT EXISTS sport_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sport_type_id UUID REFERENCES sport_types(id),
    home_team_id UUID REFERENCES sport_teams(id),
    away_team_id UUID REFERENCES sport_teams(id),
    tournament_id UUID,
    match_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    venue VARCHAR(255),
    home_score INT DEFAULT 0,
    away_score INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, POSTPONED
    match_type VARCHAR(50) DEFAULT 'FRIENDLY', -- FRIENDLY, LEAGUE, TOURNAMENT, PRACTICE
    notes TEXT,
    referee VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sport_matches_tenant ON sport_matches(tenant_id);
CREATE INDEX idx_sport_matches_date ON sport_matches(match_date);
CREATE INDEX idx_sport_matches_status ON sport_matches(status);

-- =============================
-- S.5 MATCH EVENTS
-- =============================
CREATE TABLE IF NOT EXISTS match_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES sport_matches(id) ON DELETE CASCADE,
    team_id UUID REFERENCES sport_teams(id),
    player_id UUID REFERENCES students(id),
    event_type VARCHAR(50) NOT NULL, -- GOAL, ASSIST, YELLOW_CARD, RED_CARD, SUBSTITUTION, INJURY
    event_time INT, -- minute of the match
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_match_events_match ON match_events(match_id);

-- =============================
-- S.6 PLAYER STATISTICS
-- =============================
CREATE TABLE IF NOT EXISTS player_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    sport_type_id UUID REFERENCES sport_types(id),
    season VARCHAR(50),
    matches_played INT DEFAULT 0,
    goals INT DEFAULT 0,
    assists INT DEFAULT 0,
    yellow_cards INT DEFAULT 0,
    red_cards INT DEFAULT 0,
    minutes_played INT DEFAULT 0,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    draws INT DEFAULT 0,
    custom_stats JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, sport_type_id, season)
);

CREATE INDEX idx_player_statistics_student ON player_statistics(student_id);

-- =============================
-- S.7 SPORT TRAINING SESSIONS
-- =============================
CREATE TABLE IF NOT EXISTS sport_training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    team_id UUID REFERENCES sport_teams(id),
    sport_type_id UUID REFERENCES sport_types(id),
    coach_id UUID,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue VARCHAR(255),
    training_type VARCHAR(50), -- FITNESS, TECHNICAL, TACTICAL, MATCH_PREP
    description TEXT,
    objectives TEXT,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sport_training_tenant ON sport_training_sessions(tenant_id);
CREATE INDEX idx_sport_training_date ON sport_training_sessions(session_date);

-- =============================
-- S.8 TRAINING ATTENDANCE
-- =============================
CREATE TABLE IF NOT EXISTS training_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sport_training_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'PRESENT', -- PRESENT, ABSENT, LATE, EXCUSED
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    notes TEXT,
    marked_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

CREATE INDEX idx_training_attendance_session ON training_attendance(session_id);

-- =============================
-- S.9 TOURNAMENTS
-- =============================
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sport_type_id UUID REFERENCES sport_types(id),
    name VARCHAR(255) NOT NULL,
    name_vi VARCHAR(255),
    description TEXT,
    start_date DATE,
    end_date DATE,
    location VARCHAR(255),
    format VARCHAR(50), -- KNOCKOUT, LEAGUE, GROUP_STAGE
    status VARCHAR(30) DEFAULT 'UPCOMING', -- UPCOMING, IN_PROGRESS, COMPLETED, CANCELLED
    prize_info TEXT,
    rules TEXT,
    max_teams INT,
    registration_deadline DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tournaments_tenant ON tournaments(tenant_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);

-- =============================
-- S.10 TOURNAMENT TEAMS
-- =============================
CREATE TABLE IF NOT EXISTS tournament_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES sport_teams(id) ON DELETE CASCADE,
    group_name VARCHAR(50),
    seed INT,
    points INT DEFAULT 0,
    goals_for INT DEFAULT 0,
    goals_against INT DEFAULT 0,
    matches_played INT DEFAULT 0,
    wins INT DEFAULT 0,
    draws INT DEFAULT 0,
    losses INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, ELIMINATED, WINNER, RUNNER_UP
    registered_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tournament_id, team_id)
);

CREATE INDEX idx_tournament_teams_tournament ON tournament_teams(tournament_id);

-- =============================
-- S.11 SPORT FACILITIES
-- =============================
CREATE TABLE IF NOT EXISTS sport_facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id),
    name VARCHAR(255) NOT NULL,
    name_vi VARCHAR(255),
    facility_type VARCHAR(100), -- FIELD, COURT, POOL, GYM, TRACK
    capacity INT,
    location TEXT,
    amenities TEXT[],
    operating_hours JSONB,
    hourly_rate DECIMAL(10, 2),
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sport_facilities_tenant ON sport_facilities(tenant_id);

-- =============================
-- S.12 FACILITY BOOKINGS
-- =============================
CREATE TABLE IF NOT EXISTS facility_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES sport_facilities(id) ON DELETE CASCADE,
    booked_by UUID REFERENCES users(id),
    team_id UUID REFERENCES sport_teams(id),
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, CONFIRMED, CANCELLED, COMPLETED
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_facility_bookings_facility ON facility_bookings(facility_id);
CREATE INDEX idx_facility_bookings_date ON facility_bookings(booking_date);

-- =============================
-- S.13 SPORT EQUIPMENT
-- =============================
CREATE TABLE IF NOT EXISTS sport_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id),
    sport_type_id UUID REFERENCES sport_types(id),
    name VARCHAR(255) NOT NULL,
    name_vi VARCHAR(255),
    category VARCHAR(100),
    quantity INT DEFAULT 1,
    available_quantity INT DEFAULT 1,
    condition VARCHAR(50) DEFAULT 'GOOD', -- NEW, GOOD, FAIR, POOR, DAMAGED
    purchase_date DATE,
    purchase_price DECIMAL(12, 2),
    location VARCHAR(255),
    image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sport_equipment_tenant ON sport_equipment(tenant_id);

-- =============================
-- S.14 EQUIPMENT ASSIGNMENTS
-- =============================
CREATE TABLE IF NOT EXISTS equipment_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID REFERENCES sport_equipment(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id),
    student_id UUID REFERENCES students(id),
    team_id UUID REFERENCES sport_teams(id),
    quantity INT DEFAULT 1,
    assigned_date DATE DEFAULT CURRENT_DATE,
    return_date DATE,
    actual_return_date DATE,
    condition_on_return VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ASSIGNED', -- ASSIGNED, RETURNED, LOST, DAMAGED
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_equipment_assignments_equipment ON equipment_assignments(equipment_id);

-- ===========================================================
-- 📚 SECTION L: LIBRARY MANAGEMENT
-- ===========================================================

-- =============================
-- L.1 BOOK CATEGORIES
-- =============================
CREATE TABLE IF NOT EXISTS book_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    name_vi VARCHAR(255),
    description TEXT,
    parent_id UUID REFERENCES book_categories(id),
    icon VARCHAR(50),
    color VARCHAR(20),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_book_categories_tenant ON book_categories(tenant_id);

-- =============================
-- L.2 AUTHORS
-- =============================
CREATE TABLE IF NOT EXISTS authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    name_vi VARCHAR(255),
    bio TEXT,
    nationality VARCHAR(100),
    birth_year INT,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_authors_tenant ON authors(tenant_id);

-- =============================
-- L.3 PUBLISHERS
-- =============================
CREATE TABLE IF NOT EXISTS publishers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    name_vi VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_publishers_tenant ON publishers(tenant_id);

-- =============================
-- L.4 BOOKS
-- =============================
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id),
    isbn VARCHAR(20),
    title VARCHAR(500) NOT NULL,
    title_vi VARCHAR(500),
    author_id UUID REFERENCES authors(id),
    publisher_id UUID REFERENCES publishers(id),
    category_id UUID REFERENCES book_categories(id),
    publication_year INT,
    edition VARCHAR(50),
    language VARCHAR(50) DEFAULT 'Vietnamese',
    pages INT,
    description TEXT,
    description_vi TEXT,
    cover_url TEXT,
    location VARCHAR(100), -- shelf location
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    price DECIMAL(12, 2),
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_books_tenant ON books(tenant_id);
CREATE INDEX idx_books_category ON books(category_id);
CREATE INDEX idx_books_author ON books(author_id);
CREATE INDEX idx_books_isbn ON books(isbn);

-- =============================
-- L.5 BOOK BORROWINGS
-- =============================
CREATE TABLE IF NOT EXISTS book_borrowings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    borrower_id UUID REFERENCES users(id),
    student_id UUID REFERENCES students(id),
    borrowed_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    returned_date DATE,
    status VARCHAR(20) DEFAULT 'BORROWED', -- BORROWED, RETURNED, OVERDUE, LOST
    condition_on_borrow VARCHAR(50),
    condition_on_return VARCHAR(50),
    notes TEXT,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_book_borrowings_book ON book_borrowings(book_id);
CREATE INDEX idx_book_borrowings_borrower ON book_borrowings(borrower_id);
CREATE INDEX idx_book_borrowings_status ON book_borrowings(status);

-- =============================
-- L.6 BOOK RESERVATIONS
-- =============================
CREATE TABLE IF NOT EXISTS book_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    student_id UUID REFERENCES students(id),
    reserved_date TIMESTAMP DEFAULT NOW(),
    expiry_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, FULFILLED, CANCELLED, EXPIRED
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_book_reservations_book ON book_reservations(book_id);
CREATE INDEX idx_book_reservations_status ON book_reservations(status);

-- =============================
-- L.7 LIBRARY FINES
-- =============================
CREATE TABLE IF NOT EXISTS library_fines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    borrowing_id UUID REFERENCES book_borrowings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    student_id UUID REFERENCES students(id),
    fine_type VARCHAR(50) NOT NULL, -- OVERDUE, DAMAGE, LOST
    amount DECIMAL(10, 2) NOT NULL,
    days_overdue INT,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PAID, WAIVED
    paid_date DATE,
    waived_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_library_fines_borrowing ON library_fines(borrowing_id);
CREATE INDEX idx_library_fines_status ON library_fines(status);

-- =============================
-- L.8 LIBRARY INVENTORY
-- =============================
CREATE TABLE IF NOT EXISTS library_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    copy_number INT NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    condition VARCHAR(50) DEFAULT 'GOOD',
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'AVAILABLE', -- AVAILABLE, BORROWED, RESERVED, DAMAGED, LOST
    acquisition_date DATE,
    acquisition_source VARCHAR(100), -- PURCHASE, DONATION, TRANSFER
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_library_inventory_book ON library_inventory(book_id);
CREATE INDEX idx_library_inventory_status ON library_inventory(status);

-- ===========================================================
-- 🚌 SECTION T: TRANSPORT MANAGEMENT
-- ===========================================================

-- =============================
-- T.1 VEHICLES
-- =============================
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id),
    vehicle_number VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(50), -- BUS, VAN, CAR
    make VARCHAR(100),
    model VARCHAR(100),
    year INT,
    color VARCHAR(50),
    capacity INT NOT NULL,
    fuel_type VARCHAR(50),
    registration_number VARCHAR(100),
    registration_expiry DATE,
    insurance_number VARCHAR(100),
    insurance_expiry DATE,
    gps_device_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, MAINTENANCE, INACTIVE
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, vehicle_number)
);

CREATE INDEX idx_vehicles_tenant ON vehicles(tenant_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);

-- =============================
-- T.2 VEHICLE MAINTENANCE
-- =============================
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(100) NOT NULL, -- OIL_CHANGE, TIRE, BRAKE, ENGINE, INSPECTION
    description TEXT,
    scheduled_date DATE,
    completed_date DATE,
    cost DECIMAL(12, 2),
    vendor VARCHAR(255),
    odometer_reading INT,
    status VARCHAR(20) DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    next_maintenance_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vehicle_maintenance_vehicle ON vehicle_maintenance(vehicle_id);
CREATE INDEX idx_vehicle_maintenance_status ON vehicle_maintenance(status);

-- =============================
-- T.3 TRANSPORT ROUTES
-- =============================
CREATE TABLE IF NOT EXISTS transport_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id),
    route_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_vi VARCHAR(255),
    description TEXT,
    start_location VARCHAR(255),
    end_location VARCHAR(255),
    distance_km DECIMAL(10, 2),
    estimated_duration_minutes INT,
    route_type VARCHAR(50), -- PICKUP, DROP, BOTH
    fare DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, route_code)
);

CREATE INDEX idx_transport_routes_tenant ON transport_routes(tenant_id);

-- =============================
-- T.4 ROUTE STOPS
-- =============================
CREATE TABLE IF NOT EXISTS route_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES transport_routes(id) ON DELETE CASCADE,
    stop_name VARCHAR(255) NOT NULL,
    stop_name_vi VARCHAR(255),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    stop_order INT NOT NULL,
    arrival_time TIME,
    wait_time_minutes INT DEFAULT 2,
    landmark TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_route_stops_route ON route_stops(route_id);

-- =============================
-- T.5 TRANSPORT DRIVERS
-- =============================
CREATE TABLE IF NOT EXISTS transport_drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    fullname VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    license_number VARCHAR(100) NOT NULL,
    license_expiry DATE,
    license_type VARCHAR(50),
    date_of_birth DATE,
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    photo_url TEXT,
    blood_group VARCHAR(10),
    years_of_experience INT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transport_drivers_tenant ON transport_drivers(tenant_id);

-- =============================
-- T.6 TRANSPORT SCHEDULES
-- =============================
CREATE TABLE IF NOT EXISTS transport_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES transport_routes(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id),
    driver_id UUID REFERENCES transport_drivers(id),
    assistant_id UUID REFERENCES transport_drivers(id),
    day_of_week INT, -- 0=Sunday, 1=Monday...
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    schedule_type VARCHAR(50) DEFAULT 'PICKUP', -- PICKUP, DROP
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transport_schedules_route ON transport_schedules(route_id);

-- =============================
-- T.7 STUDENT TRANSPORT
-- =============================
CREATE TABLE IF NOT EXISTS student_transport (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    route_id UUID REFERENCES transport_routes(id),
    stop_id UUID REFERENCES route_stops(id),
    transport_type VARCHAR(50) DEFAULT 'BOTH', -- PICKUP, DROP, BOTH
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    monthly_fee DECIMAL(10, 2),
    payment_status VARCHAR(20) DEFAULT 'PAID', -- PAID, PENDING, OVERDUE
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    special_instructions TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, route_id)
);

CREATE INDEX idx_student_transport_student ON student_transport(student_id);
CREATE INDEX idx_student_transport_route ON student_transport(route_id);

-- =============================
-- T.8 TRANSPORT ATTENDANCE
-- =============================
CREATE TABLE IF NOT EXISTS transport_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES transport_schedules(id),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    stop_id UUID REFERENCES route_stops(id),
    pickup_time TIMESTAMP,
    drop_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'BOARDED', -- BOARDED, ABSENT, MISSED
    marked_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(schedule_id, student_id, attendance_date)
);

CREATE INDEX idx_transport_attendance_schedule ON transport_attendance(schedule_id);
CREATE INDEX idx_transport_attendance_date ON transport_attendance(attendance_date);

-- =============================
-- T.9 GPS TRACKING
-- =============================
CREATE TABLE IF NOT EXISTS gps_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES transport_schedules(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed DECIMAL(6, 2),
    heading INT,
    altitude DECIMAL(10, 2),
    accuracy DECIMAL(6, 2),
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_gps_tracking_vehicle ON gps_tracking(vehicle_id);
CREATE INDEX idx_gps_tracking_time ON gps_tracking(recorded_at);

-- ===========================================================
-- 📊 Indexes and Views
-- ===========================================================

-- Create composite indexes for common queries
CREATE INDEX idx_books_title_search ON books USING gin(to_tsvector('english', title));
CREATE INDEX idx_sport_matches_teams ON sport_matches(home_team_id, away_team_id);
CREATE INDEX idx_vehicles_maintenance ON vehicles(id) WHERE status = 'MAINTENANCE';

-- ===========================================================
-- 📝 SEED DATA
-- ===========================================================

-- Insert default sport types
INSERT INTO sport_types (id, name, name_vi, icon, color, is_active) VALUES
    (uuid_generate_v4(), 'Football', 'Bóng đá', 'football', '#4CAF50', true),
    (uuid_generate_v4(), 'Basketball', 'Bóng rổ', 'basketball', '#FF9800', true),
    (uuid_generate_v4(), 'Badminton', 'Cầu lông', 'badminton', '#2196F3', true),
    (uuid_generate_v4(), 'Swimming', 'Bơi lội', 'swim', '#00BCD4', true),
    (uuid_generate_v4(), 'Tennis', 'Tennis', 'tennis', '#9C27B0', true),
    (uuid_generate_v4(), 'Volleyball', 'Bóng chuyền', 'volleyball', '#E91E63', true),
    (uuid_generate_v4(), 'Table Tennis', 'Bóng bàn', 'table-tennis', '#607D8B', true),
    (uuid_generate_v4(), 'Martial Arts', 'Võ thuật', 'martial-arts', '#795548', true)
ON CONFLICT DO NOTHING;

-- Insert default book categories
INSERT INTO book_categories (id, name, name_vi, icon, color) VALUES
    (uuid_generate_v4(), 'Fiction', 'Tiểu thuyết', 'book', '#9C27B0'),
    (uuid_generate_v4(), 'Non-Fiction', 'Phi hư cấu', 'book-open', '#2196F3'),
    (uuid_generate_v4(), 'Science', 'Khoa học', 'flask', '#4CAF50'),
    (uuid_generate_v4(), 'Mathematics', 'Toán học', 'calculator', '#FF9800'),
    (uuid_generate_v4(), 'History', 'Lịch sử', 'history', '#795548'),
    (uuid_generate_v4(), 'Literature', 'Văn học', 'feather', '#E91E63'),
    (uuid_generate_v4(), 'Technology', 'Công nghệ', 'computer', '#00BCD4'),
    (uuid_generate_v4(), 'Children', 'Thiếu nhi', 'child', '#FFEB3B'),
    (uuid_generate_v4(), 'Reference', 'Tham khảo', 'bookmark', '#607D8B')
ON CONFLICT DO NOTHING;

-- ===========================================================
-- ✅ Migration Complete
-- ===========================================================
-- Added tables:
-- Sports: 14 tables (sport_types, sport_teams, team_members, sport_matches, 
--         match_events, player_statistics, sport_training_sessions, 
--         training_attendance, tournaments, tournament_teams, sport_facilities, 
--         facility_bookings, sport_equipment, equipment_assignments)
-- Library: 8 tables (book_categories, authors, publishers, books, 
--          book_borrowings, book_reservations, library_fines, library_inventory)
-- Transport: 9 tables (vehicles, vehicle_maintenance, transport_routes, 
--            route_stops, transport_drivers, transport_schedules, 
--            student_transport, transport_attendance, gps_tracking)
-- ===========================================================
