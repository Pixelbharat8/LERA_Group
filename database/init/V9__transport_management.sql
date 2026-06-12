-- V9: Transport Management Tables
-- Migration for Transport Module functionality

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id BIGSERIAL PRIMARY KEY,
    vehicle_number VARCHAR(50) NOT NULL UNIQUE,
    license_plate VARCHAR(50) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50), -- 'bus', 'minibus', 'van', 'car'
    brand VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    color VARCHAR(50),
    capacity INTEGER NOT NULL,
    fuel_type VARCHAR(50), -- 'diesel', 'petrol', 'electric', 'hybrid'
    engine_number VARCHAR(100),
    chassis_number VARCHAR(100),
    registration_date DATE,
    registration_expiry DATE,
    insurance_number VARCHAR(100),
    insurance_expiry DATE,
    last_service_date DATE,
    next_service_date DATE,
    odometer_reading INTEGER,
    gps_device_id VARCHAR(100),
    features JSONB,
    images JSONB,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'maintenance', 'inactive', 'retired'
    center_id BIGINT REFERENCES centers(id),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Maintenance
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT REFERENCES vehicles(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(100), -- 'regular', 'repair', 'inspection', 'accident'
    description TEXT,
    service_provider VARCHAR(255),
    service_date DATE NOT NULL,
    odometer_at_service INTEGER,
    cost DECIMAL(12,2),
    parts_replaced JSONB,
    next_maintenance_date DATE,
    next_maintenance_odometer INTEGER,
    documents JSONB,
    status VARCHAR(50) DEFAULT 'completed', -- 'scheduled', 'in_progress', 'completed'
    performed_by VARCHAR(255),
    approved_by BIGINT REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transport Drivers
CREATE TABLE IF NOT EXISTS transport_drivers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    employee_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    emergency_phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    date_of_birth DATE,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    license_type VARCHAR(50),
    license_issue_date DATE,
    license_expiry DATE,
    photo_url VARCHAR(500),
    blood_group VARCHAR(10),
    experience_years INTEGER,
    previous_employer VARCHAR(255),
    background_check_date DATE,
    background_check_status VARCHAR(50),
    assigned_vehicle_id BIGINT REFERENCES vehicles(id),
    salary DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'on_leave', 'terminated'
    joined_date DATE,
    termination_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transport Routes
CREATE TABLE IF NOT EXISTS transport_routes (
    id BIGSERIAL PRIMARY KEY,
    route_name VARCHAR(255) NOT NULL,
    route_code VARCHAR(50) UNIQUE,
    route_type VARCHAR(50), -- 'morning', 'afternoon', 'both'
    start_point VARCHAR(255),
    end_point VARCHAR(255),
    total_distance DECIMAL(10,2),
    estimated_duration INTEGER, -- in minutes
    assigned_vehicle_id BIGINT REFERENCES vehicles(id),
    primary_driver_id BIGINT REFERENCES transport_drivers(id),
    secondary_driver_id BIGINT REFERENCES transport_drivers(id),
    max_students INTEGER,
    current_students INTEGER DEFAULT 0,
    fare_per_month DECIMAL(12,2),
    map_data JSONB,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    center_id BIGINT REFERENCES centers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Route Stops
CREATE TABLE IF NOT EXISTS route_stops (
    id BIGSERIAL PRIMARY KEY,
    route_id BIGINT REFERENCES transport_routes(id) ON DELETE CASCADE,
    stop_name VARCHAR(255) NOT NULL,
    stop_order INTEGER NOT NULL,
    address VARCHAR(500),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    pickup_time TIME,
    dropoff_time TIME,
    waiting_time INTEGER DEFAULT 2, -- minutes
    landmark VARCHAR(255),
    students_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(route_id, stop_order)
);

-- Transport Schedules
CREATE TABLE IF NOT EXISTS transport_schedules (
    id BIGSERIAL PRIMARY KEY,
    route_id BIGINT REFERENCES transport_routes(id) ON DELETE CASCADE,
    vehicle_id BIGINT REFERENCES vehicles(id),
    driver_id BIGINT REFERENCES transport_drivers(id),
    schedule_type VARCHAR(50), -- 'pickup', 'dropoff'
    day_of_week VARCHAR(20), -- 'monday', 'tuesday', etc. or 'all'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN DEFAULT true,
    effective_from DATE,
    effective_until DATE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Transport (enrollment)
CREATE TABLE IF NOT EXISTS student_transport (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
    route_id BIGINT REFERENCES transport_routes(id),
    pickup_stop_id BIGINT REFERENCES route_stops(id),
    dropoff_stop_id BIGINT REFERENCES route_stops(id),
    transport_type VARCHAR(50), -- 'both', 'pickup_only', 'dropoff_only'
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(50),
    emergency_contact VARCHAR(50),
    special_instructions TEXT,
    medical_notes TEXT,
    monthly_fee DECIMAL(12,2),
    fee_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, route_id)
);

-- Transport Attendance
CREATE TABLE IF NOT EXISTS transport_attendance (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id),
    route_id BIGINT REFERENCES transport_routes(id),
    schedule_id BIGINT REFERENCES transport_schedules(id),
    attendance_date DATE NOT NULL,
    attendance_type VARCHAR(50), -- 'pickup', 'dropoff'
    stop_id BIGINT REFERENCES route_stops(id),
    boarded_at TIMESTAMP,
    alighted_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'present', -- 'present', 'absent', 'no_show', 'picked_by_parent'
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    marked_by BIGINT REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, attendance_date, attendance_type)
);

-- GPS Tracking
CREATE TABLE IF NOT EXISTS gps_tracking (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT REFERENCES vehicles(id),
    route_id BIGINT REFERENCES transport_routes(id),
    driver_id BIGINT REFERENCES transport_drivers(id),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    speed DECIMAL(6,2),
    heading INTEGER, -- degrees 0-360
    altitude DECIMAL(10,2),
    accuracy DECIMAL(6,2),
    battery_level INTEGER,
    signal_strength INTEGER,
    ignition_status BOOLEAN,
    door_status BOOLEAN,
    fuel_level DECIMAL(5,2),
    odometer INTEGER,
    event_type VARCHAR(50), -- 'regular', 'stop', 'start', 'speeding', 'geofence_exit'
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trip Logs
CREATE TABLE IF NOT EXISTS trip_logs (
    id BIGSERIAL PRIMARY KEY,
    route_id BIGINT REFERENCES transport_routes(id),
    vehicle_id BIGINT REFERENCES vehicles(id),
    driver_id BIGINT REFERENCES transport_drivers(id),
    trip_type VARCHAR(50), -- 'pickup', 'dropoff'
    trip_date DATE NOT NULL,
    scheduled_start_time TIME,
    actual_start_time TIME,
    scheduled_end_time TIME,
    actual_end_time TIME,
    start_odometer INTEGER,
    end_odometer INTEGER,
    total_distance DECIMAL(10,2),
    total_students INTEGER,
    fuel_consumed DECIMAL(10,2),
    route_deviation_km DECIMAL(10,2),
    delays_minutes INTEGER,
    incidents TEXT,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parent Notifications (transport alerts)
CREATE TABLE IF NOT EXISTS transport_notifications (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id),
    parent_id BIGINT REFERENCES users(id),
    notification_type VARCHAR(50), -- 'pickup', 'dropoff', 'delay', 'arrival', 'departure'
    message TEXT,
    sent_via VARCHAR(50), -- 'sms', 'push', 'email'
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'delivered', 'failed'
    metadata JSONB
);

-- Indexes
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_center ON vehicles(center_id);
CREATE INDEX idx_vehicle_maintenance_vehicle ON vehicle_maintenance(vehicle_id);
CREATE INDEX idx_vehicle_maintenance_date ON vehicle_maintenance(service_date);
CREATE INDEX idx_transport_drivers_status ON transport_drivers(status);
CREATE INDEX idx_transport_routes_center ON transport_routes(center_id);
CREATE INDEX idx_route_stops_route ON route_stops(route_id);
CREATE INDEX idx_transport_schedules_route ON transport_schedules(route_id);
CREATE INDEX idx_student_transport_student ON student_transport(student_id);
CREATE INDEX idx_student_transport_route ON student_transport(route_id);
CREATE INDEX idx_transport_attendance_student ON transport_attendance(student_id);
CREATE INDEX idx_transport_attendance_date ON transport_attendance(attendance_date);
CREATE INDEX idx_gps_tracking_vehicle ON gps_tracking(vehicle_id);
CREATE INDEX idx_gps_tracking_time ON gps_tracking(recorded_at);
CREATE INDEX idx_trip_logs_route ON trip_logs(route_id);
CREATE INDEX idx_trip_logs_date ON trip_logs(trip_date);
CREATE INDEX idx_transport_notifications_student ON transport_notifications(student_id);
