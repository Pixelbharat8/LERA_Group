# LERA Group - Quick Reference Guide

## 🎯 One Command to Rule Them All

```bash
cd /Users/rahulsharma/LERA_Group
docker compose up -d
```

That's it! Everything is now running.

---

## ✅ System Status - ALL SERVICES RUNNING

### 🗄️ Database
- ✅ PostgreSQL: localhost:5432
- ✅ PgAdmin: http://localhost:5050

### 🖥️ Frontend
- ✅ Next.js: http://localhost:3000
- ✅ Via Gateway: http://localhost

### ⚙️ Backend Microservices (All Running)
1. ✅ academy_service (Port: 55014)
2. ✅ attendance_service (Port: 55009)
3. ✅ connect_service (Port: 55012)
4. ✅ identity_service (Port: 55015)
5. ✅ payment_service (Port: 55013)
6. ✅ payroll_service (Port: 55008)
7. ✅ rule_engine (Port: 55011)
8. ✅ ai_gateway (Port: 55010)

### 🚪 API Gateway
- ✅ Nginx: Port 80

---

## 🔑 Login Credentials

### PgAdmin
- Email: `admin@lera.com`
- Password: `admin123`

### Database (from PgAdmin)
- Host: `postgres` (NOT localhost!)
- Port: `5432`
- Database: `lera`
- Username: `lera`
- Password: `lera123`

---

## 📋 Common Tasks

### Start Everything
```bash
docker compose up -d
```

### Check Status
```bash
docker compose ps
```

### Stop Everything
```bash
docker compose down
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f academy_service
docker compose logs -f frontend
```

### Restart a Service
```bash
docker compose restart academy_service
```

### Rebuild After Code Changes
```bash
docker compose up -d --build
```

---

## 🌐 Access URLs

| Service | URL |
|---------|-----|
| **Main App** | http://localhost:3000 |
| **Gateway** | http://localhost |
| **PgAdmin** | http://localhost:5050 |
| **API Academy** | http://localhost/api/academy/ |
| **API Attendance** | http://localhost/api/attendance/ |
| **API Connect** | http://localhost/api/connect/ |
| **API Identity** | http://localhost/api/identity/ |
| **API Payment** | http://localhost/api/payment/ |
| **API Payroll** | http://localhost/api/payroll/ |
| **API Rule** | http://localhost/api/rule/ |
| **API AI** | http://localhost/api/ai/ |

---

## 🛠️ Troubleshooting

### Problem: Services won't start
```bash
# Solution: Check Docker is running
docker ps
```

### Problem: Port already in use
```bash
# Solution: Find and kill the process
lsof -i :3000  # or :80, :5432
kill -9 <PID>
```

### Problem: Database connection failed
```bash
# Solution: Restart database
docker compose restart postgres
```

### Problem: Need to start fresh
```bash
# Nuclear option: Delete everything and rebuild
docker compose down -v --rmi all
docker compose up -d --build
```

---

## 📊 Service Health Check

Run this to verify everything:
```bash
docker compose ps
```

All services should show `STATUS: Up`.

---

## 🎓 Project Structure

```
LERA_Group/
├── backend/              # 8 Spring Boot microservices
│   ├── academy_service/
│   ├── attendance_service/
│   ├── connect_service/
│   ├── identity_service/
│   ├── payment_service/
│   ├── payroll_service/
│   ├── rule_engine/
│   └── ai_gateway/
├── frontend/             # Next.js 14 application
├── gateway/              # Nginx configuration
├── database/             # PostgreSQL init scripts
├── docker-compose.yml    # Main orchestration file
└── README.md            # Full documentation
```

---

## 💡 Pro Tips

1. **Always use `docker compose` (not `docker-compose`)**
   - The hyphenated version is deprecated

2. **View logs when debugging**
   ```bash
   docker compose logs -f <service_name>
   ```

3. **Connect to database from PgAdmin using service name**
   - Use `postgres`, not `localhost`

4. **Backend services auto-restart on failure**
   - Check `docker compose logs` if a service crashes

5. **Frontend hot-reloads during development**
   - Just save your code; changes appear automatically

---

## 🚀 All Fixed and Running!

Your entire LERA Group ecosystem is:
- ✅ Built successfully
- ✅ Running in Docker
- ✅ Database initialized
- ✅ Frontend accessible
- ✅ All microservices up
- ✅ API Gateway routing correctly

**You're ready to develop!**

Access your app: **http://localhost:3000**

---

**Questions? Check the full README.md or logs:**
```bash
docker compose logs -f
```
