-- Fix ID-type drift in the library & transport modules.
--
-- These tables were created (by an earlier entity version) with varchar/int ID & FK columns, but
-- the current JPA entities declare them as uuid/bigint. `ddl-auto=update` (the profile the deploy
-- runs) cannot auto-cast varchar→uuid / int→bigint, so it logs a CommandAcceptanceException for
-- each on every academy startup and the columns stay the WRONG type — a latent runtime bug if these
-- modules are ever used.
--
-- Fix: drop each table so Hibernate `ddl-auto=update` recreates it with the correct entity types on
-- the SAME startup (Flyway runs before Hibernate). GUARDED — a table is dropped only when it exists
-- AND holds zero rows, so this can never destroy data. Verified: all 16 are empty in every env, and
-- no table outside this set has a foreign key into them.
--
-- NOTE: this relies on `ddl-auto=update` recreating the tables (the deploy's docker profile). Under a
-- pure `validate` profile the tables would need a CREATE migration instead — not the current model.
DO $$
DECLARE t text; n bigint;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'assignment_submissions','authors','book_borrowings','book_categories','book_reservations',
        'library_fines','library_inventory','publishers','gps_tracking','route_stops',
        'student_transport','transport_attendance','transport_drivers','transport_schedules',
        'vehicle_maintenance','vehicles'
    ] LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('SELECT count(*) FROM %I', t) INTO n;
            IF n = 0 THEN
                EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', t);
                RAISE NOTICE 'Dropped empty drifted table % (ddl-auto will recreate with correct types)', t;
            ELSE
                RAISE NOTICE 'SKIPPED % — has % row(s); resolve its ID types manually', t, n;
            END IF;
        END IF;
    END LOOP;
END $$;
