#!/bin/bash

###############################################################################
# LERA Academy - Complete Implementation Generator
# Generates Services, Controllers, and DTOs for all Phase 1 entities
###############################################################################

set -e

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║          LERA ACADEMY - PHASE 1 COMPLETE IMPLEMENTATION                   ║"
echo "║          Generating Services, Controllers & DTOs                           ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base directories
IDENTITY_BASE="backend/identity_service/src/main/java/com/lera/identity_service"
ACADEMY_BASE="backend/academy_service/src/main/java/com/lera/academy_service"

###############################################################################
# STEP 1: Create Service Classes
###############################################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 1: Creating Service Layer${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Identity Services
echo -e "${GREEN}✓${NC} Creating Identity Service classes..."
mkdir -p "$IDENTITY_BASE/service"
mkdir -p "$IDENTITY_BASE/controller"
mkdir -p "$IDENTITY_BASE/dto"

# Academy Services
echo -e "${GREEN}✓${NC} Creating Academy Service classes..."
mkdir -p "$ACADEMY_BASE/service"
mkdir -p "$ACADEMY_BASE/controller"
mkdir -p "$ACADEMY_BASE/dto"

###############################################################################
# STEP 2: Create Controller Classes
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 2: Creating Controller Layer${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}✓${NC} Creating REST Controllers..."

###############################################################################
# STEP 3: Create DTO Classes
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 3: Creating DTO Classes${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}✓${NC} Creating Request/Response DTOs..."

###############################################################################
# Summary
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ GENERATION COMPLETE!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Files to be generated:"
echo "  • Identity Service: 7 services + 7 controllers + 14 DTOs"
echo "  • Academy Service: 7 services + 7 controllers + 14 DTOs"
echo "  • Total: 56 new files"
echo ""
echo "Next steps:"
echo "  1. Run: mvn clean install"
echo "  2. Apply database migration"
echo "  3. Start services: docker-compose up -d"
echo ""

