-- Harden core CRM relationships without validating old rows.

CREATE OR REPLACE FUNCTION pg_temp.add_fk_if_compatible(
    p_constraint_name text,
    child_table text,
    child_column text,
    parent_table text,
    parent_column text DEFAULT 'id'
) RETURNS void AS $$
DECLARE
    child_type text;
    parent_type text;
    existing_equivalent boolean;
BEGIN
    SELECT c.udt_name INTO child_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = child_table
      AND c.column_name = child_column;

    SELECT c.udt_name INTO parent_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = parent_table
      AND c.column_name = parent_column;

    IF child_type IS NULL OR parent_type IS NULL THEN
        RAISE NOTICE 'Skipping FK %. Missing %.% or %.%',
            p_constraint_name, child_table, child_column, parent_table, parent_column;
        RETURN;
    END IF;

    IF child_type <> parent_type THEN
        RAISE NOTICE 'Skipping FK %. Type mismatch %.%=%, %.%=%',
            p_constraint_name, child_table, child_column, child_type, parent_table, parent_column, parent_type;
        RETURN;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
         AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = child_table
          AND kcu.column_name = child_column
          AND ccu.table_name = parent_table
          AND ccu.column_name = parent_column
    ) INTO existing_equivalent;

    IF existing_equivalent OR EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public'
          AND tc.constraint_name = p_constraint_name
    ) THEN
        RETURN;
    END IF;

    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (%I)',
        'idx_' || child_table || '_' || child_column || '_fk', child_table, child_column);
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(%I) NOT VALID',
        child_table, p_constraint_name, child_column, parent_table, parent_column);
END;
$$ LANGUAGE plpgsql;

SELECT pg_temp.add_fk_if_compatible('fk_leads_center', 'leads', 'center_id', 'centers');
SELECT pg_temp.add_fk_if_compatible('fk_leads_interested_program', 'leads', 'interested_program_id', 'course_programs');
SELECT pg_temp.add_fk_if_compatible('fk_leads_converted_student', 'leads', 'converted_student_id', 'students');
SELECT pg_temp.add_fk_if_compatible('fk_leads_assigned_to', 'leads', 'assigned_to', 'users');
SELECT pg_temp.add_fk_if_compatible('fk_leads_campaign', 'leads', 'campaign_id', 'marketing_campaigns');

SELECT pg_temp.add_fk_if_compatible('fk_lead_notes_lead', 'lead_notes', 'lead_id', 'leads');
SELECT pg_temp.add_fk_if_compatible('fk_lead_notes_created_by', 'lead_notes', 'created_by', 'users');
SELECT pg_temp.add_fk_if_compatible('fk_lead_notes_updated_by', 'lead_notes', 'updated_by', 'users');

SELECT pg_temp.add_fk_if_compatible('fk_lead_activities_lead', 'lead_activities', 'lead_id', 'leads');
SELECT pg_temp.add_fk_if_compatible('fk_lead_assignments_lead', 'lead_assignments', 'lead_id', 'leads');
SELECT pg_temp.add_fk_if_compatible('fk_lead_assignments_assigned_to', 'lead_assignments', 'assigned_to', 'users');

SELECT pg_temp.add_fk_if_compatible('fk_deals_lead', 'deals', 'lead_id', 'leads');
SELECT pg_temp.add_fk_if_compatible('fk_deals_center', 'deals', 'center_id', 'centers');
SELECT pg_temp.add_fk_if_compatible('fk_deals_assigned_to', 'deals', 'assigned_to', 'users');
SELECT pg_temp.add_fk_if_compatible('fk_deals_created_by', 'deals', 'created_by', 'users');

SELECT pg_temp.add_fk_if_compatible('fk_tasks_assigned_to', 'tasks', 'assigned_to', 'users');
SELECT pg_temp.add_fk_if_compatible('fk_notifications_user', 'notifications', 'user_id', 'users');
