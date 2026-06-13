-- V7: Library Management Tables
-- Migration for Library Module functionality

-- Book Categories
CREATE TABLE IF NOT EXISTS book_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id BIGINT REFERENCES book_categories(id),
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Authors
CREATE TABLE IF NOT EXISTS authors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    biography TEXT,
    nationality VARCHAR(100),
    birth_date DATE,
    photo_url VARCHAR(500),
    website VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Publishers
CREATE TABLE IF NOT EXISTS publishers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books
CREATE TABLE IF NOT EXISTS books (
    id BIGSERIAL PRIMARY KEY,
    isbn VARCHAR(50) UNIQUE,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    description TEXT,
    cover_image_url VARCHAR(500),
    category_id BIGINT REFERENCES book_categories(id),
    author_id BIGINT REFERENCES authors(id),
    publisher_id BIGINT REFERENCES publishers(id),
    publication_date DATE,
    edition VARCHAR(50),
    language VARCHAR(50) DEFAULT 'Vietnamese',
    page_count INTEGER,
    format VARCHAR(50), -- 'hardcover', 'paperback', 'ebook'
    total_copies INTEGER DEFAULT 1,
    available_copies INTEGER DEFAULT 1,
    location VARCHAR(100), -- shelf location
    price DECIMAL(12,2),
    tags JSONB,
    is_available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Library Inventory
CREATE TABLE IF NOT EXISTS library_inventory (
    id BIGSERIAL PRIMARY KEY,
    book_id BIGINT REFERENCES books(id) ON DELETE CASCADE,
    copy_number INTEGER NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    condition VARCHAR(50) DEFAULT 'good', -- 'new', 'good', 'fair', 'poor', 'damaged'
    location VARCHAR(100),
    acquisition_date DATE,
    acquisition_type VARCHAR(50), -- 'purchase', 'donation', 'transfer'
    acquisition_price DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'borrowed', 'reserved', 'maintenance', 'lost'
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Book Borrowings
CREATE TABLE IF NOT EXISTS book_borrowings (
    id BIGSERIAL PRIMARY KEY,
    inventory_id BIGINT REFERENCES library_inventory(id),
    book_id BIGINT REFERENCES books(id),
    borrower_id BIGINT REFERENCES users(id),
    borrower_type VARCHAR(50), -- 'student', 'teacher', 'staff'
    borrowed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    returned_at TIMESTAMP,
    return_condition VARCHAR(50),
    is_renewed BOOLEAN DEFAULT false,
    renewal_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'borrowed', -- 'borrowed', 'returned', 'overdue', 'lost'
    notes TEXT,
    processed_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Book Reservations
CREATE TABLE IF NOT EXISTS book_reservations (
    id BIGSERIAL PRIMARY KEY,
    book_id BIGINT REFERENCES books(id),
    user_id BIGINT REFERENCES users(id),
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'ready', 'fulfilled', 'cancelled', 'expired'
    notification_sent BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Library Fines
CREATE TABLE IF NOT EXISTS library_fines (
    id BIGSERIAL PRIMARY KEY,
    borrowing_id BIGINT REFERENCES book_borrowings(id),
    user_id BIGINT REFERENCES users(id),
    fine_type VARCHAR(50), -- 'overdue', 'damage', 'lost'
    amount DECIMAL(12,2) NOT NULL,
    days_overdue INTEGER,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'waived', 'partial'
    paid_amount DECIMAL(12,2) DEFAULT 0,
    paid_at TIMESTAMP,
    waived_by BIGINT REFERENCES users(id),
    waived_at TIMESTAMP,
    waiver_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reading Lists
CREATE TABLE IF NOT EXISTS reading_lists (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id BIGINT REFERENCES users(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reading List Items
CREATE TABLE IF NOT EXISTS reading_list_items (
    id BIGSERIAL PRIMARY KEY,
    reading_list_id BIGINT REFERENCES reading_lists(id) ON DELETE CASCADE,
    book_id BIGINT REFERENCES books(id),
    notes TEXT,
    is_completed BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_books_category ON books(category_id);
CREATE INDEX idx_books_author ON books(author_id);
CREATE INDEX idx_books_publisher ON books(publisher_id);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_library_inventory_book ON library_inventory(book_id);
CREATE INDEX idx_library_inventory_status ON library_inventory(status);
CREATE INDEX idx_book_borrowings_user ON book_borrowings(borrower_id);
CREATE INDEX idx_book_borrowings_status ON book_borrowings(status);
CREATE INDEX idx_book_reservations_book ON book_reservations(book_id);
CREATE INDEX idx_book_reservations_user ON book_reservations(user_id);
CREATE INDEX idx_library_fines_user ON library_fines(user_id);
CREATE INDEX idx_library_fines_status ON library_fines(status);
