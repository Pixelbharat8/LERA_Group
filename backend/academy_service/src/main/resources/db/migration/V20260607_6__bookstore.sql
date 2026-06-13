-- Bookstore products + orders (replaces in-memory BookstoreController stub).
CREATE TABLE IF NOT EXISTS bookstore_products (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    category    VARCHAR(100),
    price       NUMERIC(12,2),
    stock       INTEGER DEFAULT 0,
    image       VARCHAR(500),
    active      BOOLEAN DEFAULT TRUE,
    center_id   UUID,
    created_at  TIMESTAMP DEFAULT now(),
    updated_at  TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bkp_category ON bookstore_products (category);
CREATE INDEX IF NOT EXISTS idx_bkp_active   ON bookstore_products (active);

CREATE TABLE IF NOT EXISTS bookstore_orders (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number  VARCHAR(50),
    customer_id   UUID,
    customer_name VARCHAR(255),
    items_json    TEXT,
    total_amount  NUMERIC(12,2),
    status        VARCHAR(30) DEFAULT 'PENDING',
    center_id     UUID,
    created_at    TIMESTAMP DEFAULT now(),
    completed_at  TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bko_status ON bookstore_orders (status);
