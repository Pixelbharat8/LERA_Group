-- =====================================================
-- V20260626: Public enrolment payment orders (VNPay funnel)
-- =====================================================
-- Tracks pre-enrolment online payments created from the website /enroll flow before a full
-- student account exists. Idempotent so it is safe on dev DBs where ddl-auto already made it.

CREATE TABLE IF NOT EXISTS enrolment_orders (
    id                  UUID PRIMARY KEY,
    txn_ref             VARCHAR(64) NOT NULL UNIQUE,
    course_code         VARCHAR(50),
    amount              NUMERIC(12,2),
    student_name        VARCHAR(255),
    parent_name         VARCHAR(255),
    phone               VARCHAR(30),
    email               VARCHAR(255),
    status              VARCHAR(20) DEFAULT 'PENDING',
    vnp_response_code   VARCHAR(10),
    vnp_transaction_no  VARCHAR(30),
    created_at          TIMESTAMP,
    updated_at          TIMESTAMP,
    paid_at             TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enrolment_orders_status ON enrolment_orders (status);
