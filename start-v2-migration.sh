#!/bin/bash

# ===========================================================
# LERA V2 MIGRATION - QUICK START SCRIPT
# ===========================================================
# This script helps you start the V2 migration process
# ===========================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║       LERA ACADEMY V2 MIGRATION - QUICK START            ║"
echo "║       From 41 Tables → 107 Tables Multi-Tenant           ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ===========================================================
# Step 1: Check Prerequisites
# ===========================================================
echo -e "\n${YELLOW}Step 1: Checking Prerequisites...${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL not found. Please install PostgreSQL 15+${NC}"
    exit 1
else
    echo -e "${GREEN}✅ PostgreSQL found${NC}"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"
fi

# Check Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java not found. Please install Java 17+${NC}"
    exit 1
else
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo -e "${GREEN}✅ Java found: $JAVA_VERSION${NC}"
fi

# ===========================================================
# Step 2: Database Backup
# ===========================================================
echo -e "\n${YELLOW}Step 2: Creating Database Backup...${NC}"

BACKUP_FILE="backup_v1_$(date +%Y%m%d_%H%M%S).sql"
echo -e "Creating backup: ${BLUE}$BACKUP_FILE${NC}"

read -p "Database name [lera]: " DB_NAME
DB_NAME=${DB_NAME:-lera}

read -p "Database user [lera]: " DB_USER
DB_USER=${DB_USER:-lera}

read -p "Database host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo -e "${BLUE}Running: pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME > $BACKUP_FILE${NC}"

PGPASSWORD=lera123 pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h $BACKUP_FILE | cut -f1)
    echo -e "${GREEN}✅ Backup created successfully: $BACKUP_FILE ($BACKUP_SIZE)${NC}"
else
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
fi

# ===========================================================
# Step 3: Create Staging Database
# ===========================================================
echo -e "\n${YELLOW}Step 3: Setting Up Staging Environment...${NC}"

read -p "Create staging database? (y/n) [y]: " CREATE_STAGING
CREATE_STAGING=${CREATE_STAGING:-y}

if [ "$CREATE_STAGING" = "y" ]; then
    STAGING_DB="${DB_NAME}_v2_staging"
    echo -e "Creating staging database: ${BLUE}$STAGING_DB${NC}"
    
    # Drop if exists
    PGPASSWORD=lera123 psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "DROP DATABASE IF EXISTS $STAGING_DB;" 2>/dev/null || true
    
    # Create new database
    PGPASSWORD=lera123 psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $STAGING_DB;"
    
    # Restore backup to staging
    echo -e "${BLUE}Restoring backup to staging...${NC}"
    PGPASSWORD=lera123 psql -h $DB_HOST -p $DB_PORT -U $DB_USER $STAGING_DB < $BACKUP_FILE
    
    echo -e "${GREEN}✅ Staging database created: $STAGING_DB${NC}"
fi

# ===========================================================
# Step 4: Run Migration
# ===========================================================
echo -e "\n${YELLOW}Step 4: Running V2 Migration...${NC}"

if [ -f "database/init/migration_v1_to_v2.sql" ]; then
    echo -e "${BLUE}Found migration script: database/init/migration_v1_to_v2.sql${NC}"
    
    read -p "Run migration on staging database? (y/n) [y]: " RUN_MIGRATION
    RUN_MIGRATION=${RUN_MIGRATION:-y}
    
    if [ "$RUN_MIGRATION" = "y" ]; then
        echo -e "${BLUE}Running migration...${NC}"
        PGPASSWORD=lera123 psql -h $DB_HOST -p $DB_PORT -U $DB_USER $STAGING_DB < database/init/migration_v1_to_v2.sql
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Migration completed successfully${NC}"
        else
            echo -e "${RED}❌ Migration failed. Check errors above.${NC}"
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Migration script not found. Skipping...${NC}"
fi

# ===========================================================
# Step 5: Verify Migration
# ===========================================================
echo -e "\n${YELLOW}Step 5: Verifying Migration...${NC}"

if [ "$CREATE_STAGING" = "y" ] && [ "$RUN_MIGRATION" = "y" ]; then
    echo -e "${BLUE}Running verification queries...${NC}"
    
    # Check tenant table
    TENANT_COUNT=$(PGPASSWORD=lera123 psql -h $DB_HOST -p $DB_PORT -U $DB_USER $STAGING_DB -t -c "SELECT COUNT(*) FROM tenants;")
    echo -e "Tenants created: ${GREEN}$TENANT_COUNT${NC}"
    
    # Check users with tenant
    USER_COUNT=$(PGPASSWORD=lera123 psql -h $DB_HOST -p $DB_PORT -U $DB_USER $STAGING_DB -t -c "SELECT COUNT(*) FROM users WHERE tenant_id IS NOT NULL;")
    TOTAL_USERS=$(PGPASSWORD=lera123 psql -h $DB_HOST -p $DB_PORT -U $DB_USER $STAGING_DB -t -c "SELECT COUNT(*) FROM users;")
    echo -e "Users migrated: ${GREEN}$USER_COUNT / $TOTAL_USERS${NC}"
    
    # Check students with tenant
    STUDENT_COUNT=$(PGPASSWORD=lera123 psql -h $DB_HOST -p $DB_PORT -U $DB_USER $STAGING_DB -t -c "SELECT COUNT(*) FROM students WHERE tenant_id IS NOT NULL;")
    TOTAL_STUDENTS=$(PGPASSWORD=lera123 psql -h $DB_HOST -p $DB_PORT -U $DB_USER $STAGING_DB -t -c "SELECT COUNT(*) FROM students;")
    echo -e "Students migrated: ${GREEN}$STUDENT_COUNT / $TOTAL_STUDENTS${NC}"
    
    if [ "$USER_COUNT" = "$TOTAL_USERS" ] && [ "$STUDENT_COUNT" = "$TOTAL_STUDENTS" ]; then
        echo -e "\n${GREEN}✅ Migration verification PASSED${NC}"
    else
        echo -e "\n${YELLOW}⚠️  Migration verification INCOMPLETE${NC}"
    fi
fi

# ===========================================================
# Step 6: Next Steps
# ===========================================================
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Quick Start Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}📋 What's Been Done:${NC}"
echo -e "  ✅ Prerequisites checked"
echo -e "  ✅ Database backup created: ${BLUE}$BACKUP_FILE${NC}"
if [ "$CREATE_STAGING" = "y" ]; then
    echo -e "  ✅ Staging database created: ${BLUE}$STAGING_DB${NC}"
fi
if [ "$RUN_MIGRATION" = "y" ]; then
    echo -e "  ✅ Migration executed on staging"
fi

echo -e "\n${YELLOW}🎯 Next Steps:${NC}"
echo -e "  1. Review migration results:"
echo -e "     ${BLUE}psql -h $DB_HOST -U $DB_USER $STAGING_DB${NC}"
echo -e ""
echo -e "  2. Test application with staging database"
echo -e ""
echo -e "  3. Review implementation guide:"
echo -e "     ${BLUE}cat V2_IMPLEMENTATION_GUIDE.md${NC}"
echo -e ""
echo -e "  4. Update backend services (Week 2-4)"
echo -e ""
echo -e "  5. Update frontend (Week 5-6)"
echo -e ""
echo -e "  6. Run on production (Week 12)"

echo -e "\n${YELLOW}📞 Need Help?${NC}"
echo -e "  - Read: ${BLUE}V2_IMPLEMENTATION_GUIDE.md${NC}"
echo -e "  - Read: ${BLUE}V2_MULTI_TENANT_MIGRATION_GUIDE.md${NC}"
echo -e "  - Read: ${BLUE}V1_VS_V2_COMPARISON.md${NC}"

echo -e "\n${GREEN}🚀 Ready to build LERA Academy V2!${NC}\n"

# ===========================================================
# Save configuration
# ===========================================================
cat > .v2_config << EOF
# V2 Migration Configuration
# Generated: $(date)

DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_NAME=$DB_NAME
STAGING_DB=$STAGING_DB
BACKUP_FILE=$BACKUP_FILE
MIGRATION_DATE=$(date +%Y-%m-%d)
EOF

echo -e "${GREEN}Configuration saved to: .v2_config${NC}\n"
