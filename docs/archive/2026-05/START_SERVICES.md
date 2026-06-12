# LERA Academy - Complete Startup Guide

## Prerequisites Check

### 1. Database (PostgreSQL) - ✅ Already Running
```bash
brew services list | grep postgresql
# Should show postgresql@15 running
```

### 2. Install Maven (Required for building services)
```bash
brew install maven
```

### 3. Install Java 17+ (Required)
```bash
java -version
# If not installed:
brew install openjdk@17
```

## Start Backend Services

### Option A: Start All Services (Recommended)

Open 6 terminal tabs/windows and run each service:

**Terminal 1 - Identity Service (Port 8080)**
```bash
cd /Users/rahulsharma/LERA_Group/backend/identity_service
mvn spring-boot:run
```

**Terminal 2 - Academy Service (Port 8081)**
```bash
cd /Users/rahulsharma/LERA_Group/backend/academy_service
mvn spring-boot:run
```

**Terminal 3 - Payment Service (Port 8082)**
```bash
cd /Users/rahulsharma/LERA_Group/backend/payment_service
mvn spring-boot:run
```

**Terminal 4 - Payroll Service (Port 8083)**
```bash
cd /Users/rahulsharma/LERA_Group/backend/payroll_service
mvn spring-boot:run
```

**Terminal 5 - Attendance Service (Port 8084)**
```bash
cd /Users/rahulsharma/LERA_Group/backend/attendance_service
mvn spring-boot:run
```

**Terminal 6 - Connect Service (Port 8085)**
```bash
cd /Users/rahulsharma/LERA_Group/backend/connect_service
mvn spring-boot:run
```

### Option B: Using Pre-built JARs (Faster, but may need rebuild)

If services are already built:

```bash
# Identity Service
java -jar /Users/rahulsharma/LERA_Group/backend/identity_service/target/identity_service-1.0.0.jar

# Payment Service
java -jar /Users/rahulsharma/LERA_Group/backend/payment_service/target/payment_service-1.0.0.jar

# Payroll Service
java -jar /Users/rahulsharma/LERA_Group/backend/payroll_service/target/payroll_service-1.0.0.jar

# Attendance Service
java -jar /Users/rahulsharma/LERA_Group/backend/attendance_service/target/attendance_service-1.0.0.jar

# Connect Service
java -jar /Users/rahulsharma/LERA_Group/backend/connect_service/target/connect_service-1.0.0.jar
```

Note: Academy service needs to be rebuilt: `cd /Users/rahulsharma/LERA_Group/backend/academy_service && mvn clean package -DskipTests`

## Start Frontend

**Terminal 7 - Frontend (Port 3000)**
```bash
cd /Users/rahulsharma/LERA_Group/frontend
npm install
npm run dev
```

## Test the System

1. **Check Backend Health:**
```bash
curl http://localhost:8080/api/auth/health
# Should return: Identity Service is running
```

2. **Test Login:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@lera.com", "password": "admin123"}'
```

3. **Open Frontend:**
- Navigate to http://localhost:3000
- Login with: admin@lera.com / admin123

## Service Port Summary

| Service | Port | API Base |
|---------|------|----------|
| Identity Service | 8080 | /api/auth, /api/users, /api/roles, /api/centers |
| Academy Service | 8081 | /api/students, /api/teachers, /api/courses, /api/classes |
| Payment Service | 8082 | /api/payments |
| Payroll Service | 8083 | /api/payroll |
| Attendance Service | 8084 | /api/attendance |
| Connect Service | 8085 | /api/leads |
| Frontend | 3000 | - |

## Database Connection

All services connect to:
- Host: localhost:5432
- Database: lera
- Username: lera
- Password: lera123

## Troubleshooting

### Error: Port already in use
```bash
lsof -i :8080  # Check what's using port 8080
kill -9 <PID>  # Kill the process
```

### Error: Database connection refused
```bash
brew services start postgresql@15
```

### Error: Java not found
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH=$JAVA_HOME/bin:$PATH
```
