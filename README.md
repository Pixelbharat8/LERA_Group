# 🌍 LERA Group Monorepo (v192-final)

[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)
[![Java](https://img.shields.io/badge/Java-17-orange)](https://openjdk.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

> **Full multi-tenant education, CRM, sports-management, and automation ecosystem**

A **modular, microservice-based, cloud-ready platform** built with Next.js 14, Spring Boot, PostgreSQL 15, NGINX Gateway, Docker, and AI integration for education centers, sports academies, CRM teams, and HR/Finance operations.

### Local development (canonical scripts)

- Start: [`start-lera.sh`](start-lera.sh) — loads `.env.development`, starts core backends and the Next.js app. Add **`--include-ai`** for **ai_gateway (8087)** and **rule_engine (8088)**. Add **`--include-social`** for **social_media_service (8089)** (all optional to save RAM/ports).
- Same launcher (compat): [`START_SERVICES_SIMPLE.sh`](START_SERVICES_SIMPLE.sh) — runs `start-lera.sh`.
- Stop: [`STOP_ALL_SERVICES.sh`](STOP_ALL_SERVICES.sh) — frees backend ports **8081–8089** and Next **3000–3002**, stops Spring Boot and Next processes.
- Details: [`LOCAL_STARTUP_README.md`](LOCAL_STARTUP_README.md). Older entrypoints live under [`scripts/legacy/`](scripts/legacy/).
- **Platform overview (features, workflows, current status):** [`docs/LERA_PLATFORM_OVERVIEW.md`](docs/LERA_PLATFORM_OVERVIEW.md)
- **LMS audit & enterprise gap analysis (AI, scale, roadmap):** [`docs/LERA_LMS_GAP_ANALYSIS.md`](docs/LERA_LMS_GAP_ANALYSIS.md)

---

## 🚀 **NEW: Quick Start with Localhost Database (107 Tables)**

**One command to set up everything on localhost:**

```bash
./setup-local-postgres.sh
```

This will:
- ✅ Install PostgreSQL 15 on your Mac
- ✅ Create the `lera` database with all **107 tables**
- ✅ Set up on `localhost:5432` (no Docker needed for development)
- ✅ Verify the schema automatically

**Verify it worked:**
```bash
./verify-schema.sh
```

**📖 Complete Database Documentation:**
- **Quick Start**: See [`docs/archive/2026-05/DOCUMENTATION_INDEX.md`](docs/archive/2026-05/DOCUMENTATION_INDEX.md)
- **Visual Guide**: See [`VISUAL_SETUP_GUIDE.txt`](VISUAL_SETUP_GUIDE.txt)
- **Full Guide**: See [`docs/archive/2026-05/DATABASE_LOCALHOST_SETUP.md`](docs/archive/2026-05/DATABASE_LOCALHOST_SETUP.md)

**Connection Details:**
```
Host:     localhost
Port:     5432
Database: lera
Username: lera
Password: lera123
```

---

## 🚀 System Overview

**LERA Group v192-final** is a comprehensive enterprise platform featuring:

### Core Systems
- **🎓 LERA Academy** - Complete Learning Management System (LMS)
- **💼 LERA Connect** - CRM & Lead Management Platform
- **⚽ PlayCircle Sports** - Sports Academy Management
- **🔐 Identity Service** - Centralized Authentication & Authorization
- **🤖 AI Gateway** - AI-powered automation (ChatGPT, exam generation)
- **⚙️ Rule Engine** - Dynamic fee calculation & business rules
- **💰 Payment Service** - Tuition fees, invoicing, receipts
- **💵 Payroll Service** - Employee salary & payslip management
- **📊 Attendance Service** - Student/staff attendance tracking

### Platform Components
- **8 Backend Microservices** (Spring Boot 3.2)
- **1 Unified Frontend** (Next.js 14 with App Router)
- **PostgreSQL Database** (Multi-tenant schema)
- **NGINX API Gateway** (Reverse proxy & load balancing)
- **CI/CD Pipeline** (GitHub Actions)
- **Docker Orchestration** (Full containerized deployment)
- **AI Integration** (OpenAI GPT for automation)

---

## 🏗️ System Architecture

```
           ┌────────────────────────┐
           │   Next.js Frontend     │
           │   (Port 3000)          │
           └──────────┬─────────────┘
                      │
                      ▼
              ┌──────────────┐
              │ NGINX Gateway│
              │  (Port 80)   │
              └──────┬───────┘
      ┌──────────────┼────────────────────────┐
      ▼              ▼                        ▼
┌─────────────┐ ┌──────────────┐  ┌────────────────┐
│  identity   │ │   academy    │  │  attendance    │
│  _service   │ │   _service   │  │   _service     │
└─────────────┘ └──────────────┘  └────────────────┘
      ▼              ▼                        ▼
┌─────────────┐ ┌──────────────┐  ┌────────────────┐
│  payment    │ │   payroll    │  │   connect      │
│  _service   │ │   _service   │  │   _service     │
└─────────────┘ └──────────────┘  └────────────────┘
      ▼              ▼                        
┌─────────────┐ ┌──────────────┐  
│    rule     │ │      ai      │  
│   _engine   │ │   _gateway   │  
└─────────────┘ └──────────────┘  
      │              │              
      └──────┬───────┘              
             ▼                      
      ┌──────────────┐
      │ PostgreSQL   │
      │   Database   │
      │  (Port 5432) │
      └──────────────┘
```

---

## 📁 Repository Structure

```
LERA_Group/
│
├── backend/                    # 🔧 8 Spring Boot Microservices
│   ├── academy_service/        # LMS core - students, courses, classes
│   ├── attendance_service/     # Attendance tracking & reports
│   ├── connect_service/        # CRM - leads, follow-ups, pipeline
│   ├── identity_service/       # Auth - JWT, roles, permissions
│   ├── payment_service/        # Tuition fees, invoices, receipts
│   ├── payroll_service/        # Staff salaries & payslips
│   ├── rule_engine/            # Fee calculation automation
│   └── ai_gateway/             # AI integration (OpenAI)
│
├── frontend/                   # 🎨 Next.js 14 Application
│   ├── app/                    # App Router pages
│   │   ├── page.tsx            # Public homepage (CMS-driven)
│   │   ├── auth/login/         # Login page
│   │   └── dashboard/          # Role-based dashboards
│   ├── components/             # Reusable UI components
│   ├── public/                 # Static assets
│   └── package.json
│
├── database/                   # 🗄️ Database Configuration
│   ├── init/                   # Database initialization scripts
│   │   └── init.sql            # Schema creation
│   └── docker-compose.yml      # Standalone DB setup
│
├── gateway/                    # 🚪 NGINX API Gateway
│   ├── Dockerfile
│   └── nginx/
│       └── nginx.conf          # Route configuration
│
├── docs/                       # 📚 Documentation
│   ├── required_github_secrets.txt
│   └── ops/
│       └── connect-academy-placement.md   # Connect ↔ Academy env (CRM placement sync)
│
├── .github/                    # ⚙️ CI/CD Pipeline
│   └── workflows/
│       └── lera-ci.yml         # GitHub Actions workflow
│
├── docker-compose.yml          # 🐳 Main orchestration file
├── .env.example                # Environment variables template
├── .gitignore
├── README.md                   # This file
└── QUICKSTART.md              # Quick reference guide
```

---

## 🔧 Prerequisites

| Component | Version | Purpose |
|-----------|---------|---------|
| **Docker Desktop** | Latest | Container orchestration |
| **Docker Compose** | v2+ | Multi-container deployment |
| **Git** | Latest | Version control |
| **Node.js** | 18+ | Frontend development (optional) |
| **Java** | 17 (Temurin) | Backend development (optional) |
| **Maven** | 3.9+ | Backend build (optional) |

---

## 🚀 Quick Start (Recommended: Docker)

### Step 1: Clone the Repository
```bash
git clone https://github.com/Pixelbharat8/LERA_Group.git
cd LERA_Group
```

### Step 2: Configure Environment (Optional)
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configurations (optional for local dev)
# nano .env
```

### Step 3: Start All Services
```bash
# Build and start everything
docker compose up --build -d
```

**This single command will:**
- ✅ Build all 8 Spring Boot microservices
- ✅ Build Next.js frontend  
- ✅ Start PostgreSQL database (with initialization)
- ✅ Start PgAdmin database GUI
- ✅ Start NGINX API gateway
- ✅ Create Docker network for inter-service communication

### Step 4: Verify Services
```bash
# Check all services are running
docker compose ps

# You should see all services with STATUS: Up
```

### Step 5: Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend (Direct)** | http://localhost:3000 | Main application UI |
| **Frontend (via Gateway)** | http://localhost | Through reverse proxy |
| **PgAdmin** | http://localhost:5050 | Database management interface |
| **API Gateway** | http://localhost/api | Backend services endpoint |

#### 🔑 Default Credentials

**PgAdmin Login:**
- Email: `admin@lera.com`
- Password: `admin123`

**Database Connection (from PgAdmin):**
- Host: `postgres` ⚠️ (use service name, NOT localhost)
- Port: `5432`
- Database: `lera`
- Username: `lera`
- Password: `lera123`

---

## 🎯 Backend Microservices Details

| Service | Port | Description | Key Features |
|---------|------|-------------|--------------|
| **identity_service** | 55015 | Authentication & Authorization | JWT tokens, RBAC, Multi-center access |
| **academy_service** | 55014 | Learning Management | Students, Courses, Classes, Teachers, CMS |
| **attendance_service** | 55009 | Attendance Tracking | Daily attendance, Monthly reports, Percentage calculation |
| **connect_service** | 55012 | CRM System | Leads, Follow-ups, Pipeline stages, Counselor assignment |
| **payment_service** | 55013 | Financial Transactions | Invoices, Receipts, Fee schedules, Payment history |
| **payroll_service** | 55008 | HR & Payroll | Salary calculation, Payslips, Attendance-based pay |
| **rule_engine** | 55011 | Business Rules | Dynamic fee calculation, Conditional logic, Multi-rule evaluation |
| **ai_gateway** | 55010 | AI Integration | Exam generation, Content summarization, Lead qualification |

### Service Communication
All services communicate via:
- **REST APIs** through NGINX gateway
- **JWT Authentication** validated by identity_service
- **Shared PostgreSQL Database** with schema isolation

### API Gateway Routing

```nginx
http://localhost/api/identity/     → identity_service:8080
http://localhost/api/academy/      → academy_service:8080
http://localhost/api/attendance/   → attendance_service:8080
http://localhost/api/connect/      → connect_service:8080
http://localhost/api/payment/      → payment_service:8080
http://localhost/api/payroll/      → payroll_service:8080
http://localhost/api/rule/         → rule_engine:8080
http://localhost/api/ai/           → ai_gateway:8080
```

### CRM lead placement sync (Connect ↔ Academy)

When staff convert a CRM lead and optionally link a student, **connect_service** calls **academy_service** at  
`POST /api/internal/student-skill-levels/placement-record` with header `X-Internal-Key`. The HTTP **200** convert response includes `placementSync` (`attempted`, `success`, `reason`, `detail`, `leadId`, `studentId`, and on success `updatedExisting` when Academy upserts the same lead’s row) so the dashboard can show whether informal placement notes were imported and support can correlate logs. Runbook: [`docs/ops/connect-academy-placement.md`](docs/ops/connect-academy-placement.md), [`backend/connect_service/PLACEMENT_SYNC_ENV.md`](backend/connect_service/PLACEMENT_SYNC_ENV.md).

**Idempotency:** Academy stores `source_lead_id` on `student_skill_levels`. Re-converting the same lead with the same student updates that row instead of inserting duplicates (legacy rows that only had a `[lead-import:{uuid}]` marker in notes are also reconciled).

Configure these in **every** deployment where that flow must work (Docker Compose / Kubernetes use **service DNS names**, not `localhost`):

| Variable | Service | Purpose |
|----------|---------|---------|
| `LERA_ACADEMY_URL` | **connect_service** | Base URL of academy_service (no trailing slash), e.g. `http://academy-service:8082` |
| `LERA_INTERNAL_API_KEY` | **connect_service** and **academy_service** | Same shared secret; maps to `lera.internal.api-key` / `${LERA_INTERNAL_API_KEY:…}` in both apps |
| `ACADEMY_SERVICE_URL` | **Next.js** (`frontend/next.config.js`) | Where browser/API rewrites send `/api/students/*` and other academy routes; defaults to `http://localhost:8082` |

If `LERA_ACADEMY_URL` is wrong or the key mismatches, the lead still converts to **CONVERTED**, but `placementSync` reports `ACADEMY_UNREACHABLE`, `ACADEMY_HTTP_ERROR`, or `INTERNAL_KEY_MISSING` (see connect_service logs: `placement_sync leadId=…`).

---

## 🎨 Frontend Architecture (Next.js 14)

### Public Pages (No Authentication)
- **Homepage** (`/`) - Dynamic CMS-driven marketing page
- **Courses** (`/courses`) - Course catalog display
- **Contact** (`/contact`) - Lead capture form
- **Login** (`/auth/login`) - User authentication

### Private Dashboards (Role-Based Access)

#### 1. SuperAdmin Dashboard
- **Center Management** - Add/edit education centers
- **User Roles Matrix** - Assign permissions system-wide
- **Global Fee Rules** - Default rules for all centers
- **CMS Editor** - Update homepage content
- **System Settings** - API keys, integrations

#### 2. Center Admin Dashboard  
- **Dashboard** - KPIs (attendance, revenue, enrollments)
- **Students** - CRUD operations, enrollment management
- **Teachers** - Staff management, class assignments
- **Classes/Schedules** - Course scheduling
- **Attendance** - View attendance reports
- **Payments** - Invoice management, payment tracking
- **Payroll** - Staff salary processing
- **Leads** - CRM lead management
- **Reports** - Export CSV/PDF reports

#### 3. Teacher Panel
- **My Classes** - View assigned classes
- **Mark Attendance** - Quick attendance interface
- **Homework Upload** - Task assignment
- **Student Progress** - Performance tracking

#### 4. Student Panel
- **My Courses** - Enrolled subjects
- **Attendance Report** - Monthly charts & percentages
- **Homework** - View/download assignments
- **Notifications** - Class updates

#### 5. Parent Panel
- **Child Overview** - All children's profiles
- **Attendance** - Combined attendance tracking
- **Payments** - Tuition fee history

### Frontend Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Authentication**: JWT (stored in httpOnly cookies)

---

## 🗄️ Database Schema

### PostgreSQL 15 - Multi-Tenant Architecture

#### Core Tables

**Identity & Access Control**
```sql
users              -- All system users (students, teachers, admins)
roles              -- System roles (superadmin, admin, teacher, student, parent)
permissions        -- Granular permissions
role_permissions   -- Role-permission mapping
centers            -- Education centers/branches
```

**Academy (LMS)**
```sql
courses            -- Course catalog
classes            -- Class schedules
students           -- Student profiles
teachers           -- Teacher information
consultations      -- Counseling sessions
homework           -- Assignments
cms_content        -- Homepage dynamic content
```

**CRM (Connect)**
```sql
leads              -- Prospective students
follow_ups         -- Counselor interaction logs
pipeline_stages    -- Sales funnel stages
counsellors        -- CRM staff
```

**Attendance**
```sql
attendance         -- Daily attendance records
attendance_summary -- Pre-calculated monthly percentages
```

**Financial (Payment & Payroll)**
```sql
invoices           -- Fee invoices
receipts           -- Payment receipts
transactions       -- Payment history
fee_rules          -- Dynamic fee calculation rules
salary             -- Staff salary records
payslips           -- Generated payslips
```

#### Database Initialization
- All tables created automatically via `database/init/init.sql`
- Runs on first container startup
- Includes sample data for testing

---

## 🛠️ Management Commands

### View Service Status
```bash
docker compose ps
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f academy_service
docker compose logs -f frontend
docker compose logs -f postgres

# Last 50 lines
docker compose logs --tail=50 academy_service
```

### Restart Services
```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart academy_service
docker compose restart frontend
```

### Stop Services
```bash
# Stop all (containers remain)
docker compose stop

# Stop and remove containers
docker compose down

# Stop and remove everything (containers, networks, volumes)
docker compose down -v

# Stop and remove everything including images
docker compose down -v --rmi all
```

### Rebuild After Code Changes
```bash
# Rebuild all services
docker compose build

# Rebuild and restart
docker compose up -d --build

# Rebuild specific service
docker compose build academy_service
docker compose up -d academy_service

# Force rebuild (no cache)
docker compose build --no-cache
```

### Database Operations
```bash
# Access PostgreSQL CLI
docker compose exec postgres psql -U lera -d lera

# Backup database
docker compose exec postgres pg_dump -U lera lera > backup.sql

# Restore database
docker compose exec -T postgres psql -U lera lera < backup.sql

# Reset database (warning: deletes all data)
docker compose down -v
docker compose up -d
```

---

## � Development Workflow

### Backend Development

Each microservice can be run independently:

```bash
# Navigate to service
cd backend/academy_service

# Build
mvn clean package

# Run locally (requires local PostgreSQL)
mvn spring-boot:run

# Run with Docker only
docker compose up academy_service
```

**Hot Reload**: Use Spring Boot DevTools (already included in pom.xml)

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Run development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

**Environment Variables**: Create `.env.local` for frontend-specific configs

---

## ⚙️ Environment Variables

### Backend Services (.env or docker-compose.yml)
```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=lera
DB_USER=lera
DB_PASSWORD=lera123

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=86400000

# AI Integration
OPENAI_API_KEY=sk-your-key-here

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Application
SPRING_PROFILES_ACTIVE=docker
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_BASE=http://localhost/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Environment variables for **Connect → Academy** placement sync (`LERA_ACADEMY_URL`, `LERA_INTERNAL_API_KEY`) are documented under [CRM lead placement sync (Connect ↔ Academy)](#crm-lead-placement-sync-connect--academy) and in `backend/connect_service/src/main/resources/application.properties`.

---

## � CI/CD Pipeline (GitHub Actions)

### Pipeline Configuration
File: `.github/workflows/lera-ci.yml`

### Pipeline Stages
1. **Build** - Compile all Spring Boot services
2. **Test** - Run unit tests (mvn test)
3. **Docker Build** - Create container images
4. **Push** - Upload to Docker Hub/Registry
5. **Deploy** - SSH to server and restart containers

### Trigger Events
- Push to `main` branch
- Pull request to `main`
- Manual workflow dispatch

### Required Secrets
Configure in GitHub Settings → Secrets:
```
DOCKER_USERNAME
DOCKER_PASSWORD
VPS_HOST
VPS_USERNAME
VPS_SSH_KEY
```

See `docs/required_github_secrets.txt` for details.

---

## 📊 Service Ports Reference

| Service | Internal Port | External Port (Host) | Protocol |
|---------|--------------|---------------------|----------|
| Frontend | 3000 | 3000 | HTTP |
| Gateway | 80 | 80 | HTTP |
| PostgreSQL | 5432 | 5432 | TCP |
| PgAdmin | 80 | 5050 | HTTP |
| academy_service | 8080 | Random (55xxx) | HTTP |
| attendance_service | 8080 | Random (55xxx) | HTTP |
| connect_service | 8080 | Random (55xxx) | HTTP |
| identity_service | 8080 | Random (55xxx) | HTTP |
| payment_service | 8080 | Random (55xxx) | HTTP |
| payroll_service | 8080 | Random (55xxx) | HTTP |
| rule_engine | 8080 | Random (55xxx) | HTTP |
| ai_gateway | 8080 | Random (55xxx) | HTTP |

**Note**: Backend services use random port mapping (`0:8080`) for horizontal scalability. Access them via the API gateway.

---

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens** - Secure, stateless authentication
- **RBAC** - Role-based access control
- **Multi-tenant** - Data isolation per center
- **Password Hashing** - BCrypt encryption

### Network Security
- **Docker Network Isolation** - Services communicate on private network
- **NGINX Gateway** - Single entry point with CORS protection
- **Environment Variables** - Sensitive data not in code
- **HTTPS Ready** - SSL/TLS support in production

### API Security
- **Token Validation** - All requests authenticated via identity_service
- **Rate Limiting** - NGINX configuration (production)
- **SQL Injection Prevention** - JPA/Hibernate prepared statements
- **XSS Protection** - React auto-escaping, CSP headers

---

## 🐛 Troubleshooting

### Services Won't Start
```bash
# Check Docker is running
docker --version
docker ps

# Check logs for errors
docker compose logs

# Remove old containers and restart
docker compose down
docker compose up -d --build
```

### Database Connection Issues
```bash
# Verify PostgreSQL is running
docker compose exec postgres pg_isready

# Restart database
docker compose restart postgres

# Check database logs
docker compose logs postgres
```

### Port Already in Use
```bash
# Find process using port (macOS/Linux)
lsof -i :3000
lsof -i :5432

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Frontend Build Fails
```bash
# Clear Next.js cache
cd frontend
rm -rf .next node_modules
npm install --legacy-peer-deps
npm run build
```

### Backend Service Crashes
```bash
# Check service logs
docker compose logs -f academy_service

# Common issues:
# - Database connection refused → Wait for postgres to fully start
# - Port already in use → Change port or kill conflicting process
# - Out of memory → Increase Docker memory limit
```

### Reset Everything (Nuclear Option)
```bash
# Stop and remove EVERYTHING
docker compose down -v --rmi all

# Rebuild from scratch
docker compose up -d --build
```

---

## 📦 Tech Stack Summary

### Backend
- **Language**: Java 17 (Eclipse Temurin)
- **Framework**: Spring Boot 3.2.x
- **Build Tool**: Maven 3.9+
- **ORM**: Spring Data JPA + Hibernate
- **Database**: PostgreSQL 15
- **Authentication**: JWT (JSON Web Tokens)
- **API Documentation**: SpringDoc OpenAPI (Swagger)

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4
- **UI Components**: shadcn/ui
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **API Gateway**: NGINX
- **Database GUI**: PgAdmin 4
- **CI/CD**: GitHub Actions
- **Cloud Ready**: AWS, GCP, Azure, DigitalOcean

### AI & Integrations
- **AI**: OpenAI GPT-4 API
- **Email**: SMTP (configurable)
- **File Storage**: Local (S3-ready)

---

## 🚦 System Health Check

Run this to verify your installation:

```bash
# Check all services
docker compose ps

# Test frontend
curl http://localhost:3000

# Test gateway
curl http://localhost

# Test database
docker compose exec postgres pg_isready
```

**Expected Result**: All services showing `STATUS: Up`, all URLs returning HTTP 200.

---

## 📝 Key Features Summary

### LERA Academy (LMS)
✅ Student enrollment & management  
✅ Course catalog & class scheduling  
✅ Teacher assignment & management  
✅ Homework & assignment tracking  
✅ Consultation booking system  
✅ Attendance integration  
✅ Progress reports & analytics  
✅ CMS-driven public website  

### LERA Connect (CRM)
✅ Lead capture & management  
✅ Sales pipeline visualization  
✅ Follow-up reminders  
✅ Counselor assignment  
✅ Conversion tracking  
✅ Multi-stage workflow  

### Payment Management
✅ Automated fee calculation  
✅ Invoice generation  
✅ Payment receipt printing  
✅ Dynamic fee rules engine  
✅ Payment history tracking  
✅ Multi-payment method support  

### Payroll Management
✅ Employee salary calculation  
✅ Attendance-based pay  
✅ Payslip generation & printing  
✅ Tax calculation support  
✅ Batch processing  

### AI Features (Gateway)
✅ Automated exam generation  
✅ Content summarization  
✅ Student performance recommendations  
✅ Lead qualification scoring  
✅ Chatbot integration  

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 1. Fork the Repository
```bash
# Click "Fork" on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/LERA_Group.git
cd LERA_Group
```

### 2. Create a Feature Branch
```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. Make Changes
- Follow existing code style
- Add tests for new features
- Update documentation if needed

### 4. Commit & Push
```bash
git add .
git commit -m "feat: add new feature description"
git push origin feat/your-feature-name
```

### 5. Create Pull Request
- Go to GitHub and create a PR
- Describe your changes
- Link any related issues

### Branch Naming Convention
- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions
- `chore/` - Maintenance tasks

---

## 📞 Support & Contact

### Issues & Bugs
- **GitHub Issues**: https://github.com/Pixelbharat8/LERA_Group/issues
- **Discussions**: https://github.com/Pixelbharat8/LERA_Group/discussions

### Documentation
- **README.md** - This file (overview)
- **QUICKSTART.md** - Quick reference guide
- **docs/** - Additional documentation

### Repository
- **URL**: https://github.com/Pixelbharat8/LERA_Group
- **Owner**: Pixelbharat8
- **License**: Proprietary (See LICENSE file)

---

## 📄 License

This project is **proprietary** and owned by **LERA Group**.  
Unauthorized distribution, modification, or commercial use is prohibited.

For licensing inquiries, please contact the repository owner.

---

## 🙏 Acknowledgments

### Built With
- [Spring Boot](https://spring.io/projects/spring-boot) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Docker](https://www.docker.com/) - Containerization
- [NGINX](https://nginx.org/) - API Gateway
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [OpenAI](https://openai.com/) - AI integration

### Maintained By
**LERA Group Development Team**  
Lead Developer: Rahul Sharma

---

## 🎉 Quick Links

| Resource | Link |
|----------|------|
| **Live Demo** | [Coming Soon] |
| **Documentation** | [README.md](README.md) |
| **Quick Start** | [QUICKSTART.md](QUICKSTART.md) |
| **GitHub Repo** | [https://github.com/Pixelbharat8/LERA_Group](https://github.com/Pixelbharat8/LERA_Group) |
| **Issues** | [Report Bug](https://github.com/Pixelbharat8/LERA_Group/issues) |
| **Pull Requests** | [Contribute](https://github.com/Pixelbharat8/LERA_Group/pulls) |

---

<div align="center">

**⭐ Star this repo if you find it helpful!**


