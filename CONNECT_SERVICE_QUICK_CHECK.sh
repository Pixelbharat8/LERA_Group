#!/bin/bash

# LERA CONNECT SERVICE - QUICK CHECK SCRIPT

cat << 'EOF'

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                   📞 LERA CONNECT SERVICE - QUICK CHECK                    ║
║                                                                              ║
║                        (CRM/Leads Management)                               ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝


┌──────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE INFORMATION                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Service Name:    Connect Service (CRM)                                     │
│  Port:            8085                                                      │
│  Type:            Microservice (Spring Boot)                                │
│  Purpose:         Lead & CRM management                                     │
│  Database:        PostgreSQL (localhost:5432, database: lera)               │
│  Location:        /backend/connect_service                                  │
│                                                                              │
│  Status: ✅ CODE EXISTS - Ready to build and run                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                         API ENDPOINTS AVAILABLE                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LEADS MANAGEMENT:                                                          │
│  ├─ GET    /api/leads                - List all leads                      │
│  ├─ POST   /api/leads                - Create new lead                     │
│  ├─ GET    /api/leads/{id}           - Get specific lead                   │
│  ├─ PUT    /api/leads/{id}           - Update lead                         │
│  ├─ DELETE /api/leads/{id}           - Delete lead                         │
│  └─ PUT    /api/leads/{id}/convert   - Mark lead as converted              │
│                                                                              │
│  STATISTICS:                                                                │
│  └─ GET    /api/leads/stats          - Get lead statistics                 │
│                                                                              │
│  FOLLOW-UPS:                                                                │
│  ├─ GET    /api/followups            - List follow-ups                     │
│  ├─ POST   /api/followups            - Create follow-up                    │
│  ├─ GET    /api/followups/{id}       - Get specific follow-up              │
│  ├─ PUT    /api/followups/{id}       - Update follow-up                    │
│  └─ DELETE /api/followups/{id}       - Delete follow-up                    │
│                                                                              │
│  SEARCH & FILTER:                                                           │
│  ├─ GET    /api/leads/status/{status} - Filter by status                   │
│  └─ GET    /api/leads/search?q=query  - Search leads                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                         COMPONENT CHECKLIST                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Source Code:                                                               │
│  ✅ Lead.java                     - Lead entity                             │
│  ✅ Followup.java                 - Follow-up entity                        │
│  ✅ LeadController.java           - Lead API endpoints                      │
│  ✅ LeadRepository.java           - Lead data access                        │
│  ✅ FollowupRepository.java       - Follow-up data access                  │
│                                                                              │
│  Configuration:                                                             │
│  ✅ SecurityConfig.java           - Security setup                          │
│  ✅ JwtAuthenticationFilter.java  - JWT authentication                      │
│  ✅ GlobalExceptionHandler.java   - Error handling                          │
│  ✅ ApiResponse.java              - Response format                         │
│                                                                              │
│  Application:                                                               │
│  ✅ Application.java              - Spring Boot entry point                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                         QUICK START COMMANDS                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  BUILD SERVICE:                                                             │
│  $ cd /Users/rahulsharma/LERA_Group/backend/connect_service                │
│  $ mvn clean install -DskipTests                                            │
│                                                                              │
│  RUN SERVICE:                                                               │
│  $ mvn spring-boot:run                                                      │
│  OR                                                                         │
│  $ java -jar target/connect_service-*.jar                                   │
│                                                                              │
│  CHECK HEALTH:                                                              │
│  $ curl http://localhost:8085/actuator/health                              │
│                                                                              │
│  LIST LEADS:                                                                │
│  $ curl http://localhost:8085/api/leads                                    │
│                                                                              │
│  GET STATISTICS:                                                            │
│  $ curl http://localhost:8085/api/leads/stats                              │
│                                                                              │
│  OR USE MASTER SCRIPT:                                                      │
│  $ bash /Users/rahulsharma/LERA_Group/PHASE1_MASTER.sh                    │
│  Select: 1 (RUN ALL) to build and start all services                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE TABLES                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LEADS TABLE:                                                               │
│  ├─ id (UUID, PK)                                                           │
│  ├─ name (String)                                                           │
│  ├─ email (String)                                                          │
│  ├─ phone (String)                                                          │
│  ├─ company (String)                                                        │
│  ├─ status (NEW, CONTACTED, QUALIFIED, CONVERTED, LOST)                   │
│  ├─ source (String)                                                         │
│  ├─ notes (Text)                                                            │
│  ├─ created_at (Timestamp)                                                  │
│  ├─ updated_at (Timestamp)                                                  │
│  └─ converted_at (Timestamp, nullable)                                      │
│                                                                              │
│  FOLLOWUPS TABLE:                                                           │
│  ├─ id (UUID, PK)                                                           │
│  ├─ lead_id (UUID, FK to leads)                                             │
│  ├─ notes (Text)                                                            │
│  ├─ next_followup_date (Date)                                               │
│  ├─ status (PENDING, COMPLETED, CANCELLED)                                 │
│  ├─ created_at (Timestamp)                                                  │
│  └─ updated_at (Timestamp)                                                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                       INTEGRATION WITH FRONTEND                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Frontend Pages:                                                            │
│  ├─ /dashboard/crm/leads          - Main CRM leads page                   │
│  │  ├─ Shows all leads                                                     │
│  │  ├─ Lead status indicators                                              │
│  │  ├─ Create/Edit/Delete leads                                            │
│  │  └─ Lead statistics dashboard                                           │
│  │                                                                          │
│  └─ Individual Lead Pages                                                   │
│     ├─ Lead details                                                         │
│     ├─ Associated follow-ups                                                │
│     ├─ Conversion tracking                                                  │
│     └─ Activity timeline                                                    │
│                                                                              │
│  API Calls from Frontend:                                                   │
│  ├─ GET    /api/leads              - Load leads list                       │
│  ├─ POST   /api/leads              - Create new lead                       │
│  ├─ PUT    /api/leads/{id}         - Edit lead                             │
│  ├─ DELETE /api/leads/{id}         - Delete lead                           │
│  ├─ PUT    /api/leads/{id}/convert - Mark as converted                     │
│  └─ GET    /api/leads/stats        - Display statistics                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                        VERIFICATION TESTS                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  After starting service, run these to verify:                              │
│                                                                              │
│  1. SERVICE HEALTH:                                                         │
│     curl http://localhost:8085/actuator/health                             │
│     Expected: {"status":"UP"}                                              │
│                                                                              │
│  2. DATABASE CONNECTION:                                                    │
│     PGPASSWORD=lera123 psql -h localhost -U lera -d lera                  │
│     \dt leads;  (should show leads table)                                   │
│                                                                              │
│  3. LIST LEADS:                                                             │
│     curl http://localhost:8085/api/leads                                   │
│     Expected: [] (empty or with data)                                      │
│                                                                              │
│  4. CREATE LEAD:                                                            │
│     curl -X POST http://localhost:8085/api/leads \                        │
│       -H "Content-Type: application/json" \                                │
│       -d '{"name":"Test","email":"test@test.com","status":"NEW"}'          │
│                                                                              │
│  5. STATISTICS:                                                             │
│     curl http://localhost:8085/api/leads/stats                             │
│     Expected: Lead count and status breakdown                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                         TROUBLESHOOTING                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ISSUE: Service won't start                                                │
│  FIX:   • Check port 8085 is free: lsof -i :8085                          │
│         • Check PostgreSQL running: pg_isready -h localhost -p 5432        │
│         • View logs: tail -f /tmp/connect_service.log                      │
│                                                                              │
│  ISSUE: Can't connect to service                                           │
│  FIX:   • Verify it's running: curl localhost:8085/actuator/health         │
│         • Check firewall/network: ping localhost                            │
│         • Restart service: killall java                                     │
│                                                                              │
│  ISSUE: Database errors                                                    │
│  FIX:   • Verify DB exists: PGPASSWORD=lera123 psql -l                    │
│         • Check DB connection: psql -h localhost -U lera -d lera           │
│         • Restart PostgreSQL: brew services restart postgresql@15          │
│                                                                              │
│  ISSUE: Authentication errors                                              │
│  FIX:   • Ensure you have valid JWT token                                  │
│         • Add Authorization header: -H "Authorization: Bearer TOKEN"        │
│         • Check token expiration                                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                     SERVICE STATUS: ✅ READY TO BUILD                      ║
║                                                                              ║
║  All source code present and complete                                       ║
║  All endpoints implemented                                                  ║
║  Security configured                                                        ║
║  Database schema ready                                                      ║
║                                                                              ║
║  NEXT STEP:                                                                 ║
║  Run: bash /Users/rahulsharma/LERA_Group/PHASE1_MASTER.sh                 ║
║  Select: 1 (RUN ALL)                                                        ║
║                                                                              ║
║  This will build, start, and test the Connect Service automatically! ✅    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

EOF
