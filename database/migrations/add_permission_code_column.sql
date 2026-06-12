-- Add permission_code column to role_permissions table
-- This allows storing permission codes directly without needing a separate permissions table lookup

-- Add the column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'role_permissions' 
        AND column_name = 'permission_code'
    ) THEN
        ALTER TABLE role_permissions ADD COLUMN permission_code VARCHAR(100);
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_code 
ON role_permissions(role_id, permission_code);

-- Make sure permission_id is nullable (since we're using permission_code primarily)
ALTER TABLE role_permissions ALTER COLUMN permission_id DROP NOT NULL;

COMMENT ON COLUMN role_permissions.permission_code IS 'Permission code like dashboard, users, roles, etc.';
