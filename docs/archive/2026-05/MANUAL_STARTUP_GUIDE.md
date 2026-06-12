# 🚀 LERA GROUP - MANUAL SERVICE STARTUP GUIDE

## ⚡ Quick Start (Copy & Paste Each Command)

### Terminal 1: PostgreSQL
```bash
brew services start postgresql@15
```

### Terminal 2: Identity Service (Port 8080)
```bash
cd /Users/rahulsharma/LERA_Group/backend/identity_service && mvn spring-boot:run
```

### Terminal 3: Academy Service (Port 8081)
```bash
cd /Users/rahulsharma/LERA_Group/backend/academy_service && mvn spring-boot:run
```

### Terminal 4: Payment Service (Port 8082)
```bash
cd /Users/rahulsharma/LERA_Group/backend/payment_service && mvn spring-boot:run
```

### Terminal 5: Payroll Service (Port 8083)
```bash
cd /Users/rahulsharma/LERA_Group/backend/payroll_service && mvn spring-boot:run
```

### Terminal 6: Attendance Service (Port 8084)
```bash
cd /Users/rahulsharma/LERA_Group/backend/attendance_service && mvn spring-boot:run
```

### Terminal 7: Connect Service (Port 8085)
```bash
cd /Users/rahulsharma/LERA_Group/backend/connect_service && mvn spring-boot:run
```

### Terminal 8: Frontend (Port 3000)
```bash
cd /Users/rahulsharma/LERA_Group/frontend && npm run dev
```

---

## 📋 Expected Output

### Backend Services Should Show:
```
... Tomcat started on port(s): 8080-8085 with context path ''
... Started Application in XX.XXX seconds
```

### Frontend Should Show:
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

## ✅ Verification

### Test Services:
```bash
# Identity Service
curl http://localhost:8080/actuator/health

# Academy Service  
curl http://localhost:8081/actuator/health

# Frontend
curl http://localhost:3000
```

### Open in Browser:
```
http://localhost:3000
Login: admin@lera.com / admin123
```

---

## 🔍 Troubleshooting

### If a service won't start:
```bash
# Check if port is in use
lsof -i :8080
lsof -i :3000

# Check database connection
PGPASSWORD=lera123 psql -h localhost -U lera -d lera -c "SELECT 1;"
```

### If you get build errors:
```bash
# Clean and rebuild
cd /path/to/service
mvn clean install -DskipTests
mvn spring-boot:run
```

### To stop all services:
```bash
killall java
killall node
```

---

## ⏱️ Startup Timeline

- PostgreSQL: 2 seconds
- Each Backend Service: 15-20 seconds
- Frontend: 5 seconds
- **Total: ~150 seconds (2.5 minutes)**

Once all services are running:
1. Open http://localhost:3000
2. Login with admin@lera.com / admin123
3. Navigate to SuperAdmin Dashboard
4. Verify all pages load with data
