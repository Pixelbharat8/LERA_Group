-- Persist dropdown options (was an in-memory stub that lost admin customizations on restart).
-- Defaults are seeded by the controller on first start (when the table is empty).
CREATE TABLE IF NOT EXISTS dropdown_options (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category    VARCHAR(100) NOT NULL,
    value       VARCHAR(255),
    label       VARCHAR(255),
    label_vi    VARCHAR(255),
    sort_order  INTEGER,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT now(),
    updated_at  TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dropdown_category ON dropdown_options (category);
