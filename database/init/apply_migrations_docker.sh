#!/bin/bash
# Script to apply migrations using Docker PostgreSQL container

echo "=== LERA GROUP - Docker Database Migration ==="
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../.."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if postgres container exists
if ! docker ps -a | grep -q lera_postgres; then
    echo "Starting PostgreSQL container..."
    docker-compose up -d postgres
    sleep 5
fi

# Check if postgres container is running
if ! docker ps | grep -q lera_postgres; then
    echo "Starting PostgreSQL container..."
    docker-compose start postgres
    sleep 5
fi

echo "✅ PostgreSQL container is running"
echo ""

# Apply migrations
echo "=== Applying Migrations ==="

for file in V5__ai_features.sql V6__chat_features.sql V7__library_management.sql V8__sports_management.sql V9__transport_management.sql V10__website_and_features.sql; do
    echo ""
    echo "Applying: $file"
    docker exec -i lera_postgres psql -U lera -d lera < "$SCRIPT_DIR/$file"
    if [ $? -eq 0 ]; then
        echo "✅ Success: $file"
    else
        echo "❌ Failed: $file"
    fi
done

echo ""
echo "=== Migration Complete ==="
echo ""

# Show table count
echo "Total tables in database:"
docker exec lera_postgres psql -U lera -d lera -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"
