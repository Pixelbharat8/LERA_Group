#!/bin/bash
# Script to apply all database migrations to localhost PostgreSQL

echo "=== LERA GROUP - Database Migration Script ==="
echo ""

# Database connection settings
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="lera"
DB_USER="lera"
DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD must be set (export it before running)}"

# Migration files directory
MIGRATIONS_DIR="$(dirname "$0")"

# Function to run SQL file
run_migration() {
    local file=$1
    echo "Applying: $file"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$file" 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Success: $file"
    else
        echo "❌ Failed: $file"
    fi
    echo ""
}

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql command not found!"
    echo ""
    echo "Please install PostgreSQL client or use Docker:"
    echo ""
    echo "Option 1 - Homebrew (macOS):"
    echo "  brew install postgresql"
    echo ""
    echo "Option 2 - Docker:"
    echo "  docker exec -i lera_postgres psql -U lera -d lera < migration.sql"
    echo ""
    exit 1
fi

# Check database connection
echo "Testing database connection..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Cannot connect to database!"
    echo "Make sure PostgreSQL is running on $DB_HOST:$DB_PORT"
    exit 1
fi
echo "✅ Database connection successful"
echo ""

# Apply migrations
echo "=== Applying Migrations ==="
echo ""

run_migration "$MIGRATIONS_DIR/V5__ai_features.sql"
run_migration "$MIGRATIONS_DIR/V6__chat_features.sql"
run_migration "$MIGRATIONS_DIR/V7__library_management.sql"
run_migration "$MIGRATIONS_DIR/V8__sports_management.sql"
run_migration "$MIGRATIONS_DIR/V9__transport_management.sql"
run_migration "$MIGRATIONS_DIR/V10__website_and_features.sql"

echo "=== Migration Complete ==="
echo ""

# Show table count
echo "Total tables in database:"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"
