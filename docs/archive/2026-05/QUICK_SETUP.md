# LERA Academy - Quick Setup Guide

## 🔴 Issue Detected
Docker Compose is not installed on your system.

## ✅ Solution Options

### Option A: Install Docker Desktop (Recommended)

1. **Download Docker Desktop for Mac:**
   - Go to: https://www.docker.com/products/docker-desktop/
   - Download and install Docker Desktop for Mac
   - Start Docker Desktop from Applications

2. **After Docker is running, start the database:**
   ```bash
   cd /Users/rahulsharma/LERA_Group/database
   docker compose up -d
   ```
   
   Note: On newer Docker versions, use `docker compose` (no hyphen) instead of `docker-compose`

---

### Option B: Install PostgreSQL Locally via Homebrew

1. **Install PostgreSQL:**
   ```bash
   brew install postgresql@15
   brew services start postgresql@15
   ```

2. **Add to PATH:**
   ```bash
   echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

3. **Create the database and user:**
   ```bash
   createdb lera
   psql -d lera -c "CREATE USER lera WITH PASSWORD 'lera123';"
   psql -d lera -c "GRANT ALL PRIVILEGES ON DATABASE lera TO lera;"
   psql -d lera -c "ALTER USER lera WITH SUPERUSER;"
   ```

4. **Initialize the database:**
   ```bash
   psql -d lera -f /Users/rahulsharma/LERA_Group/database/init/init.sql
   ```

---

## 🚀 After Database is Running

### Start Backend Services (each in a new terminal tab):

```bash
# Terminal 1 - Identity Service (Port 8080)
cd /Users/rahulsharma/LERA_Group/backend/identity_service && mvn spring-boot:run

# Terminal 2 - Academy Service (Port 8081)
cd /Users/rahulsharma/LERA_Group/backend/academy_service && mvn spring-boot:run

# Terminal 3 - Payment Service (Port 8082)
cd /Users/rahulsharma/LERA_Group/backend/payment_service && mvn spring-boot:run

# Terminal 4 - Payroll Service (Port 8083)
cd /Users/rahulsharma/LERA_Group/backend/payroll_service && mvn spring-boot:run

# Terminal 5 - Attendance Service (Port 8084)
cd /Users/rahulsharma/LERA_Group/backend/attendance_service && mvn spring-boot:run

# Terminal 6 - Connect Service (Port 8085)
cd /Users/rahulsharma/LERA_Group/backend/connect_service && mvn spring-boot:run
```

### Start Frontend:
```bash
cd /Users/rahulsharma/LERA_Group/frontend && npm run dev
```

---

## 🔐 Login Credentials
- **URL:** http://localhost:3000/auth/login
- **Email:** admin@lera.com
- **Password:** admin123
