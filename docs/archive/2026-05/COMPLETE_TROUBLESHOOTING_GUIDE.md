# 🔧 LERA GROUP - COMPLETE TROUBLESHOOTING & FIX GUIDE

## 🎯 THE ISSUE

Services are timing out or not starting properly. The error "Request Failed: 408" means services aren't responding in time.

---

## ✅ COMPLETE FIX - STEP BY STEP

### **Step 1: Clean Everything**
```bash
# Stop all services
killall java
killall node

# Wait 5 seconds
sleep 5
```

### **Step 2: Start PostgreSQL**
```bash
brew services start postgresql@15

# Verify it's running
pg_isready
```

You should see: `localhost:5432 - accepting connections`

### **Step 3: Open VS Code Terminal Panel**

In VS Code:
1. Press `` Ctrl + ` `` (backtick) to open terminal
2. Click the **"+"** button 7 times to create 7 terminal tabs
3. Label them: Identity, Academy, Payment, Payroll, Attendance, Connect, Frontend

### **Step 4: Start Each Service in Its Own Terminal**

**Terminal 1 - Identity (8080):**
```bash
cd /Users/rahulsharma/LERA_Group/backend/identity_service
mvn spring-boot:run
```
✅ Wait for: `Started Application in XX.XXX seconds`

**Terminal 2 - Academy (8081):**
```bash
cd /Users/rahulsharma/LERA_Group/backend/academy_service
mvn spring-boot:run
```
✅ Wait for: `Started Application in XX.XXX seconds`

**Terminal 3 - Payment (8082):**
```bash
cd /Users/rahulsharma/LERA_Group/backend/payment_service
mvn spring-boot:run
```
✅ Wait for: `Started Application in XX.XXX seconds`

**Terminal 4 - Payroll (8083):**
```bash
cd /Users/rahulsharma/LERA_Group/backend/payroll_service
mvn spring-boot:run
```
✅ Wait for: `Started Application in XX.XXX seconds`

**Terminal 5 - Attendance (8084):**
```bash
cd /Users/rahulsharma/LERA_Group/backend/attendance_service
mvn spring-boot:run
```
✅ Wait for: `Started Application in XX.XXX seconds`

**Terminal 6 - Connect (8085):**
```bash
cd /Users/rahulsharma/LERA_Group/backend/connect_service
mvn spring-boot:run
```
✅ Wait for: `Started Application in XX.XXX seconds`

**Terminal 7 - Frontend (3000):**
```bash
cd /Users/rahulsharma/LERA_Group/frontend
npm run dev
```
✅ Wait for: `ready started server on 0.0.0.0:3000`

---

## 🔍 VERIFICATION

### Check All Services Are Running:
```bash
bash /Users/rahulsharma/LERA_Group/CHECK_STATUS.sh
```

### Manual Port Check:
```bash
lsof -i :8080  # Identity
lsof -i :8081  # Academy
lsof -i :8082  # Payment
lsof -i :8083  # Payroll
lsof -i :8084  # Attendance
lsof -i :8085  # Connect
lsof -i :3000  # Frontend
```

### Test API Endpoints:
```bash
# Identity Service
curl http://localhost:8080/actuator/health

# Academy Service (Teachers)
curl http://localhost:8081/api/teachers

# Frontend
curl http://localhost:3000
```

---

## 🌐 OPEN THE APPLICATION

Once all services show "Started":

1. Open browser: **http://localhost:3000**
2. Login:
   - Email: `admin@lera.com`
   - Password: `admin123`
3. Navigate to **SuperAdmin Dashboard**
4. Check each page:
   - ✅ Teachers (should show 3 teachers)
   - ✅ Students (should show 4 students)
   - ✅ Classes (should show 2 classes)
   - ✅ Payments (should show 7 payments)
   - ✅ Payroll (should show 8 payroll records)
   - ✅ Attendance (should show 16 attendance records)
   - ✅ Leads (CRM - should show data)

---

## ❌ COMMON ERRORS & FIXES

### Error: "Port already in use"
```bash
# Find what's using the port
lsof -i :8080

# Kill it
kill -9 <PID>
```

### Error: "Connection refused" to PostgreSQL
```bash
# Check PostgreSQL status
brew services list

# Restart if needed
brew services restart postgresql@15

# Test connection
psql -h localhost -U lera -d lera
# Password: lera123
```

### Error: "Failed to fetch" in browser
This means:
1. Backend service not running → Start the service
2. Wrong port in frontend → Check `/frontend/app/dashboard/*/page.tsx`
3. CORS issue → Should be configured correctly already

### Error: Maven build fails
```bash
# Clean and rebuild
cd /path/to/service
mvn clean install -DskipTests

# Then try again
mvn spring-boot:run
```

### Error: Frontend shows "Module not found"
```bash
cd /Users/rahulsharma/LERA_Group/frontend
rm -rf node_modules
npm install
npm run dev
```

---

## 📊 EXPECTED STARTUP TIMELINE

| Service | Time | What to See |
|---------|------|-------------|
| PostgreSQL | 3 sec | `pg_isready` shows success |
| Identity Service | 20 sec | `Started Application` |
| Academy Service | 25 sec | `Started Application` + DataLoader logs |
| Payment Service | 20 sec | `Started Application` + DataLoader logs |
| Payroll Service | 20 sec | `Started Application` + DataLoader logs |
| Attendance Service | 20 sec | `Started Application` + DataLoader logs |
| Connect Service | 20 sec | `Started Application` |
| Frontend | 10 sec | `ready started server` |

**Total: ~3 minutes for everything to be fully operational**

---

## 🚀 QUICK COMMANDS REFERENCE

```bash
# Run the fix script
bash /Users/rahulsharma/LERA_Group/FINAL_FIX_START.sh

# Check status
bash /Users/rahulsharma/LERA_Group/CHECK_STATUS.sh

# Stop everything
killall java && killall node

# View logs (if using background processes)
tail -f /tmp/identity.log
tail -f /tmp/academy.log
tail -f /tmp/frontend.log
```

---

## 💡 PRO TIPS

1. **Start services in order**: Identity → Academy → Others → Frontend
2. **Wait for each to fully start** before starting the next
3. **Watch the terminal output** - look for "Started Application"
4. **If a service fails**, read the error carefully - it usually tells you exactly what's wrong
5. **Database issues?** Check PostgreSQL is running first
6. **Port conflicts?** Make sure nothing else is using ports 8080-8085 or 3000

---

## 📞 SUPPORT CHECKLIST

If still having issues, provide:
1. Output of `CHECK_STATUS.sh`
2. Any error messages from terminals
3. Output of `brew services list`
4. Screenshot of browser error (if any)

---

## ✅ SUCCESS INDICATORS

You know everything is working when:
- ✅ All 7 terminals show "Started" messages
- ✅ `CHECK_STATUS.sh` shows all services running
- ✅ Browser loads http://localhost:3000
- ✅ Login works
- ✅ All dashboard pages show data (not "Failed to fetch")

---

**Last Updated:** December 19, 2025  
**Status:** All fixes applied, ready to start
