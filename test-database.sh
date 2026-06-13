#!/usr/bin/env bash
# ===========================================================
# LERA Academy - Quick Database Test
# ===========================================================

echo "🔍 Testing LERA Database Setup"
echo "================================"
echo ""

# Check if PostgreSQL is installed
echo "1️⃣  Checking PostgreSQL installation..."
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    echo "   ✅ PostgreSQL found: $PSQL_VERSION"
else
    echo "   ❌ PostgreSQL not found. Please run ./setup-local-postgres.sh"
    exit 1
fi

# Check if PostgreSQL is running
echo ""
echo "2️⃣  Checking PostgreSQL service..."
if brew services list | grep -q "postgresql@15.*started"; then
    echo "   ✅ PostgreSQL service is running"
elif ps aux | grep -q "[p]ostgres"; then
    echo "   ✅ PostgreSQL process is running"
else
    echo "   ⚠️  PostgreSQL may not be running"
    echo "   Starting service..."
    brew services start postgresql@15
    sleep 3
fi

# Test database connection
echo ""
echo "3️⃣  Testing database connection..."
if PGPASSWORD=lera123 psql -h localhost -U lera -d lera -c "SELECT 1;" &> /dev/null; then
    echo "   ✅ Successfully connected to database"
else
    echo "   ❌ Cannot connect to database"
    echo "   Please run: ./setup-local-postgres.sh"
    exit 1
fi

# Count tables
echo ""
echo "4️⃣  Counting tables..."
TABLE_COUNT=$(PGPASSWORD=lera123 psql -h localhost -U lera -d lera -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tr -d ' ')

if [ -z "$TABLE_COUNT" ]; then
    echo "   ❌ Could not count tables"
    exit 1
fi

echo "   📊 Found: $TABLE_COUNT tables"
echo ""

if [ "$TABLE_COUNT" = "107" ]; then
    echo "✅ SUCCESS! All 107 tables are present!"
elif [ "$TABLE_COUNT" -eq "0" ]; then
    echo "⚠️  No tables found. Running setup..."
    ./setup-local-postgres.sh
else
    echo "⚠️  Expected 107 tables, found $TABLE_COUNT"
    echo "   Missing: $((107 - TABLE_COUNT)) tables"
fi

echo ""
echo "📋 Connection Details:"
echo "   Host:     localhost"
echo "   Port:     5432"
echo "   Database: lera"
echo "   Username: lera"
echo "   Password: lera123"
echo ""
echo "💡 Quick commands:"
echo "   psql -h localhost -U lera -d lera    # Connect"
echo "   \\dt                                  # List tables"
echo "   \\q                                   # Exit"
echo ""
