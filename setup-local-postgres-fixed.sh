#!/usr/bin/env bash
set -euo pipefail
# ===========================================================
# LERA Academy - Local Development Setup for macOS
# ===========================================================
# This script sets up PostgreSQL locally on your Mac
# ===========================================================

echo "🚀 LERA Academy - Local PostgreSQL Setup"
echo "========================================="

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install PostgreSQL if not installed
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL..."
    brew install postgresql@15
    
    # Add to PATH
    echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
    export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
fi

# Start PostgreSQL service
echo "🔄 Starting PostgreSQL service..."
brew services start postgresql@15

# Wait for PostgreSQL to start
sleep 3

# Create database and user
echo "📊 Creating LERA database and user..."
createuser -s lera 2>/dev/null || echo "User 'lera' already exists"
psql postgres -c "ALTER USER lera WITH PASSWORD 'lera123';" 2>/dev/null
createdb -O lera lera 2>/dev/null || echo "Database 'lera' already exists"

# Run database initialization and migrations
echo ""
echo "🗄️  Running database schema initialization..."

# Run init.sql
if [ -f "database/init/init.sql" ]; then
    echo "   → Applying init.sql..."
    PGPASSWORD=lera123 psql -h localhost -U lera -d lera -f database/init/init.sql -q 2>&1 | grep -v "NOTICE" || true
    echo "   ✓ Base schema applied"
else
    echo "   ⚠️  Warning: database/init/init.sql not found"
fi

# Run migration
if [ -f "database/migrations/V2__add_missing_66_tables.sql" ]; then
    echo "   → Applying V2 migration (66 missing tables)..."
    PGPASSWORD=lera123 psql -h localhost -U lera -d lera -f database/migrations/V2__add_missing_66_tables.sql -q 2>&1 | grep -v "NOTICE" || true
    echo "   ✓ Migration applied"
else
    echo "   ⚠️  Warning: database/migrations/V2__add_missing_66_tables.sql not found"
fi

# Count tables
echo ""
echo "📊 Verifying database schema..."
TABLE_COUNT=$(PGPASSWORD=lera123 psql -h localhost -U lera -d lera -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tr -d ' ')

echo ""
echo "✅ PostgreSQL is now running locally on localhost!"
echo ""
echo "📋 Connection Details:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: lera"
echo "   Username: lera"
echo "   Password: lera123"
echo ""
echo "📊 Database Status:"
echo "   Tables: ${TABLE_COUNT}/107"
if [ "$TABLE_COUNT" = "107" ]; then
    echo "   Status: ✅ All 107 tables created successfully!"
else
    echo "   Status: ⚠️  Expected 107 tables, found ${TABLE_COUNT}"
fi
echo ""
echo "🔧 Useful Commands:"
echo "   Connect: psql -h localhost -U lera -d lera"
echo "   Stop:    brew services stop postgresql@15"
echo "   Start:   brew services start postgresql@15"
echo "   Status:  brew services list"
echo "   Tables:  psql -h localhost -U lera -d lera -c '\\dt'"
echo ""
