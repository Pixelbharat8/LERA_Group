-- Enforce unique user email at the DB level (the User entity declares unique=true, but the
-- baseline migration only created a non-unique index — so duplicates were possible via raw inserts).
-- Postgres allows multiple NULL emails; only non-null duplicates would block this (none expected).
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users (email);
