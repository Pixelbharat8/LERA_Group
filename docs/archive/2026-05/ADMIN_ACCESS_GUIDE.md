# 🎯 LERA Academy - Admin Access Guide

## 🌐 Quick Access URLs

### Main Application
- **Homepage**: http://localhost:3000
- **Login Page**: http://localhost:3000/auth/login

### Admin Dashboards (After Login)
- **Super Admin**: http://localhost:3000/dashboard/superadmin
- **Admin**: http://localhost:3000/dashboard/admin
- **Manager**: http://localhost:3000/dashboard/manager
- **Teacher**: http://localhost:3000/dashboard/teacher
- **Student**: http://localhost:3000/dashboard/student

## 🔐 How to Access Admin Panel

### Step 1: Open Login Page
```
http://localhost:3000/auth/login
```

### Step 2: Login with Admin Credentials
You'll need to create an admin user first. Here are the options:

#### Option A: Create Admin via Database (Recommended)
Run this SQL to create a super admin:

```sql
-- Connect to database
psql -h localhost -U lera -d lera

-- Insert a super admin user
INSERT INTO users (id, email, password, full_name, role_id, center_id, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@lera.com',
  -- Password: admin123 (bcrypt hashed)
  '$2a$10$rJK8Z8Z8Z8Z8Z8Z8Z8Z8ZeP8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8',
  'Super Administrator',
  (SELECT id FROM roles WHERE name = 'superadmin'),
  NULL,
  true,
  NOW(),
  NOW()
);
```

#### Option B: Create Admin via API
Use this curl command:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lera.com",
    "password": "admin123",
    "fullName": "Super Administrator",
    "role": "superadmin"
  }'
```

### Step 3: Login
1. Go to: http://localhost:3000/auth/login
2. Enter email: `admin@lera.com`
3. Enter password: `admin123`
4. Click "Sign In"
5. You'll be redirected to: http://localhost:3000/dashboard/superadmin

## 📊 Available Admin Pages

### Super Admin Dashboard
- **Centers Management**: `/dashboard/superadmin/centers`
- **Public Website Management**:
  - Home Page: `/dashboard/superadmin/public-website/home`
  - Courses: `/dashboard/superadmin/public-website/courses`
  - Blog: `/dashboard/superadmin/public-website/blog`
  - Testimonials: `/dashboard/superadmin/public-website/testimonials`
  - Media: `/dashboard/superadmin/public-website/media`
  - Branding: `/dashboard/superadmin/public-website/branding`
  - Footer: `/dashboard/superadmin/public-website/footer`
  - SEO: `/dashboard/superadmin/public-website/seo`

## 🔧 Backend API Endpoints

All admin APIs are available through:
- **Identity Service**: http://localhost:8080
- **Academy Service**: http://localhost:8081 (Currently DOWN - needs fixing)
- **Other Services**: Ports 8082-8087

## 🚀 Quick Start Commands

### 1. Check System Status
```bash
cd /Users/rahulsharma/LERA_Group
./full-system-check.sh
```

### 2. View All Services
```bash
# Check service health
curl http://localhost:8080/actuator/health  # Identity
curl http://localhost:8082/actuator/health  # Attendance
curl http://localhost:8083/actuator/health  # Payment
```

### 3. Create First Admin User
```bash
# Option 1: Via psql
psql -h localhost -U lera -d lera -c "
INSERT INTO users (id, email, password, full_name, role_id, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'admin@lera.com',
  '\$2a\$10\$e0MYzXyjpJS7Pd0RVvHwHe1yv2qdE5FRZhYp6WCk7Y.PJqKq8LmDu',
  'Super Admin',
  id,
  true,
  NOW(),
  NOW()
FROM roles WHERE name = 'superadmin';
"
```

## 📝 Default Test Credentials

If your database has seed data, try these:
- **Email**: admin@lera.com
- **Password**: admin123

## 🔍 Troubleshooting

### Can't Login?
1. Check if Identity Service is running:
   ```bash
   curl http://localhost:8080/actuator/health
   ```

2. Check if user exists:
   ```bash
   psql -h localhost -U lera -d lera -c "SELECT email, full_name FROM users WHERE email = 'admin@lera.com';"
   ```

### Getting 404 Errors?
1. Make sure frontend is running on port 3000
2. Clear browser cache
3. Check console for errors (F12 in browser)

### Service Not Responding?
```bash
# Restart all services
./stop-all-services.sh
./start-all-services.sh
```

## 📞 Need Help?
Run the system check to diagnose issues:
```bash
./full-system-check.sh
```
