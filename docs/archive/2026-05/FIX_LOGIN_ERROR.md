# 🔧 FIX LOGIN ERROR - QUICK GUIDE

## The Problem
Login page shows: **"Login failed. Please check your credentials."**

This means **Identity Service (port 8080) is not running or not responding**.

---

## ✅ SOLUTION - 3 STEPS

### **Step 1: Check if Identity Service is Running**

Run this diagnostic:
```bash
chmod +x /Users/rahulsharma/LERA_Group/DIAGNOSE_LOGIN.sh
bash /Users/rahulsharma/LERA_Group/DIAGNOSE_LOGIN.sh
```

### **Step 2: Start Identity Service** (if not running)

Open a **NEW terminal** in VS Code and run:
```bash
cd /Users/rahulsharma/LERA_Group/backend/identity_service
mvn spring-boot:run
```

**Wait for this message:**
```
Started Application in XX.XXX seconds
```

You should also see:
```
Created SUPER_ADMIN role
Created ADMIN role
Created admin user: admin@lera.com / admin123
```

### **Step 3: Try Login Again**

1. Go back to browser: http://localhost:3000
2. **Hard refresh:** Press `Cmd + Shift + R`
3. Try login again:
   - Email: `admin@lera.com`
   - Password: `admin123`

---

## 🔍 Verify Identity Service is Working

### Quick Test:
```bash
# Check if port 8080 is open
lsof -i :8080

# Test health endpoint
curl http://localhost:8080/actuator/health

# Test login endpoint
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lera.com","password":"admin123"}'
```

If the last command returns a **token**, Identity Service is working!

---

## 📊 Full Service Startup Order

If starting all services fresh:

1. **PostgreSQL** (Database)
   ```bash
   brew services start postgresql@15
   ```

2. **Identity Service** (Port 8080) - **MUST START FIRST**
   ```bash
   cd /Users/rahulsharma/LERA_Group/backend/identity_service
   mvn spring-boot:run
   ```
   ⏱️ Wait for "Started Application" message (~20 seconds)

3. **Other Backend Services** (Ports 8081-8085)
   ```bash
   # Academy Service
   cd /Users/rahulsharma/LERA_Group/backend/academy_service && mvn spring-boot:run
   
   # Payment Service
   cd /Users/rahulsharma/LERA_Group/backend/payment_service && mvn spring-boot:run
   
   # Payroll Service
   cd /Users/rahulsharma/LERA_Group/backend/payroll_service && mvn spring-boot:run
   
   # Attendance Service
   cd /Users/rahulsharma/LERA_Group/backend/attendance_service && mvn spring-boot:run
   
   # Connect Service
   cd /Users/rahulsharma/LERA_Group/backend/connect_service && mvn spring-boot:run
   ```

4. **Frontend** (Port 3000)
   ```bash
   cd /Users/rahulsharma/LERA_Group/frontend
   npm run dev
   ```

---

## ❌ Common Errors & Fixes

### Error: "Connection refused"
→ Identity Service is not running. Start it (Step 2 above).

### Error: "Login failed" but service is running
→ Admin user not created. Restart Identity Service to trigger DataLoader.

### Error: "Port 8080 already in use"
```bash
# Find what's using it
lsof -i :8080

# Kill it
kill -9 <PID>

# Start Identity Service again
```

### Error: "Cannot connect to database"
```bash
# Check PostgreSQL
pg_isready

# If not running, start it
brew services start postgresql@15
```

---

## ✅ Success Indicators

You know Identity Service is working when:

1. ✅ Terminal shows: `Created admin user: admin@lera.com / admin123`
2. ✅ `curl http://localhost:8080/actuator/health` returns `{"status":"UP"}`
3. ✅ Login test returns a JWT token
4. ✅ Browser login works and redirects to dashboard

---

## 🆘 Still Not Working?

Run the diagnostic and send me the output:
```bash
bash /Users/rahulsharma/LERA_Group/DIAGNOSE_LOGIN.sh
```

Also check Identity Service terminal for error messages.

---

**Most Common Fix:** Just start Identity Service first, wait for "Started Application", then try login!
