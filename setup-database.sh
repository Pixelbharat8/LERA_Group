#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           LERA GROUP - Database Setup Script               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed!${NC}"
    echo ""
    echo "Please install PostgreSQL first:"
    echo "   brew install postgresql@14"
    echo "   brew services start postgresql@14"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is installed${NC}"

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not running. Starting...${NC}"
    
    # Try to start PostgreSQL
    if command -v brew &> /dev/null; then
        brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null
    else
        echo -e "${RED}❌ Cannot start PostgreSQL. Please start it manually.${NC}"
        exit 1
    fi
    
    sleep 3
    
    if ! pg_isready -q 2>/dev/null; then
        echo -e "${RED}❌ Failed to start PostgreSQL${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"

# Database configuration
DB_NAME="lera"
DB_USER="lera"
DB_PASSWORD="lera123"
DB_HOST="localhost"
DB_PORT="5432"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Setting up database: $DB_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create user (ignore error if exists)
echo "   Creating user '$DB_USER'..."
psql postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null
psql postgres -c "ALTER USER $DB_USER CREATEDB;" 2>/dev/null

# Create database (ignore error if exists)
echo "   Creating database '$DB_NAME'..."
psql postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null

# Grant privileges
echo "   Granting privileges..."
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null

# Test connection
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Testing database connection..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

export PGPASSWORD=$DB_PASSWORD
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful!${NC}"
else
    echo -e "${RED}❌ Database connection failed!${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check if PostgreSQL is running: pg_isready"
    echo "2. Check pg_hba.conf for authentication settings"
    echo "3. Try: psql -h localhost -U postgres -d postgres"
    exit 1
fi

# Ask to initialize schema
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Database Schema Initialization"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

INIT_SQL="/Users/rahulsharma/LERA_Group/database/init/init.sql"

if [ -f "$INIT_SQL" ]; then
    read -p "Do you want to initialize the database schema? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   Initializing schema from init.sql..."
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$INIT_SQL" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Schema initialized successfully!${NC}"
        else
            echo -e "${YELLOW}⚠️  Some schema statements may have failed (this is normal for updates)${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  init.sql not found at $INIT_SQL${NC}"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                 🎉 DATABASE SETUP COMPLETE!                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Database Details:"
echo "   • Host:     $DB_HOST"
echo "   • Port:     $DB_PORT"
echo "   • Database: $DB_NAME"
echo "   • User:     $DB_USER"
echo "   • Password: $DB_PASSWORD"
echo ""
echo "Connection String:"
echo "   jdbc:postgresql://$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "Next Step: Run ./start-lera.sh to start all services"
echo ""
