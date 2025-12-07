-- ===========================================================
-- LERA SYSTEM — Master Database Init (v10 stable)
-- ===========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================
-- CENTERS
-- =============================
CREATE TABLE IF NOT EXISTS centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================
-- USERS
-- =============================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    center_id UUID,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(100),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (center_id) REFERENCES centers(id)
);

-- =============================
-- ROLES
-- =============================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL
);

-- =============================
-- PERMISSIONS
-- =============================
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(255) UNIQUE NOT NULL
);

-- =============================
-- ROLE ↔ PERMISSION MAPPING
-- =============================
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID,
    permission_id UUID,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

-- =============================
-- COURSES
-- =============================
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    center_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(12,2),
    duration_hours INT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (center_id) REFERENCES centers(id)
);

-- =============================
-- ATTENDANCE RECORDS
-- =============================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    course_id UUID NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(50) NOT NULL, -- PRESENT / ABSENT / LATE
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- ===========================================================
-- SEED DEFAULT ROLES
-- ===========================================================
INSERT INTO roles (name) VALUES
('SUPERADMIN'),
('ADMIN'),
('TEACHER'),
('STUDENT'),
('PARENT')
ON CONFLICT DO NOTHING;

-- ===========================================================
-- SEED BASIC PERMISSIONS
-- ===========================================================
INSERT INTO permissions (code) VALUES
('manage_centers'),
('manage_users'),
('manage_courses'),
('manage_attendance'),
('manage_payments'),
('manage_settings')
ON CONFLICT DO NOTHING;
