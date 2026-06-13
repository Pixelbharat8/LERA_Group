-- =====================================================================
-- V20260502_2 — Add referrals table backing /api/referrals.
-- Idempotent: safe to re-run on environments that already created it.
-- =====================================================================

CREATE TABLE IF NOT EXISTS referrals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    referrer_user_id    UUID,            -- parent who referred someone
    referred_email      VARCHAR(255),    -- email of the prospective family
    referred_name       VARCHAR(255),
    referred_phone      VARCHAR(50),

    student_id          UUID,            -- once they convert, link the student
    center_id           UUID,            -- center the referral is targeted at

    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                        -- PENDING | CONTACTED | CONVERTED | REJECTED | EXPIRED
    notes               TEXT,
    reward_amount       NUMERIC(12, 2),
    reward_status       VARCHAR(20) DEFAULT 'NONE',
                        -- NONE | PENDING | PAID

    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    converted_at        TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer    ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_student     ON referrals(student_id);
CREATE INDEX IF NOT EXISTS idx_referrals_center      ON referrals(center_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status      ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at  ON referrals(created_at DESC);

-- Optional FK to users — softened to NOT VALID so existing rows are not blocked.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
       AND NOT EXISTS (
           SELECT 1 FROM pg_constraint WHERE conname = 'fk_referrals_referrer_user'
       ) THEN
        EXECUTE 'ALTER TABLE referrals
                   ADD CONSTRAINT fk_referrals_referrer_user
                   FOREIGN KEY (referrer_user_id) REFERENCES users(id)
                   ON DELETE SET NULL NOT VALID';
    END IF;
END $$;
