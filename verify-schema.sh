#!/usr/bin/env bash
# ===========================================================
# LERA Academy - Verify 107 Tables Script
# ===========================================================
# Run this to verify all 107 tables exist in your local database
# ===========================================================

set -euo pipefail

echo "🔍 LERA Academy - Schema Verification"
echo "======================================"
echo ""

# Check if PostgreSQL is running
if ! brew services list | grep -q "postgresql@15.*started"; then
    echo "❌ PostgreSQL is not running. Please run ./setup-local-postgres.sh first."
    exit 1
fi

# Check database connection
if ! PGPASSWORD=lera123 psql -h localhost -U lera -d lera -c "SELECT 1" > /dev/null 2>&1; then
    echo "❌ Cannot connect to database. Please check your connection settings."
    exit 1
fi

echo "✅ Connected to database successfully"
echo ""

# Count tables
TABLE_COUNT=$(PGPASSWORD=lera123 psql -h localhost -U lera -d lera -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | tr -d ' ')

echo "📊 Database Statistics:"
echo "   Tables found: ${TABLE_COUNT}"
echo "   Expected:     107"
echo ""

if [ "$TABLE_COUNT" = "107" ]; then
    echo "✅ SUCCESS! All 107 tables are present!"
else
    echo "⚠️  WARNING: Expected 107 tables, found ${TABLE_COUNT}"
    
    if [ "$TABLE_COUNT" -lt "107" ]; then
        MISSING=$((107 - TABLE_COUNT))
        echo "   Missing ${MISSING} table(s)"
    else
        EXTRA=$((TABLE_COUNT - 107))
        echo "   Found ${EXTRA} extra table(s)"
    fi
fi

echo ""
echo "📋 Running detailed verification..."
echo ""

# Run detailed verification
PGPASSWORD=lera123 psql -h localhost -U lera -d lera -f database/verify-107-tables.sql

echo ""
echo "✅ Verification complete!"
echo ""
echo "💡 Tip: To see all tables, run:"
echo "   psql -h localhost -U lera -d lera -c '\\dt'"
