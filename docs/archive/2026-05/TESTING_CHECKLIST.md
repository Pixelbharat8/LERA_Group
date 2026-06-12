# 🧪 LERA Platform - Pre-Deployment Deep Testing Checklist

## 👑 CHAIRMAN = GOD (Highest Authority)

The Chairman has **FULL ACCESS** to:
- ✅ All SuperAdmin features
- ✅ All CEO features
- ✅ All Director features
- ✅ All Center Admin features
- ✅ Can approve/reject anything
- ✅ Can override any decision
- ✅ Can access all data across all centers
- ✅ System settings & configurations

---

## 🔐 Role Hierarchy

```
Level 0: CHAIRMAN (GOD) ─── Full control, can override everything
    │
Level 1: CEO ─── Executive control, needs Chairman approval for sensitive ops
    │
Level 2: DIRECTOR ─── Operational control over assigned areas
    │
Level 3: SUPER_ADMIN ─── Technical admin, system management
    │
Level 4: CENTER_ADMIN ─── Center-specific management
    │
Level 5: TEACHER / STAFF ─── Daily operations
    │
Level 6: PARENT ─── View student data
    │
Level 7: STUDENT ─── Limited self-access
```

---

## 📋 Testing Checklist

### Phase 1: Authentication & Authorization

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 1.1 | Login as Chairman | ⬜ | Email: Chairman@Leraacademy.edu.vn |
| 1.2 | Verify Chairman sees ALL menu items | ⬜ | Check sidebar navigation |
| 1.3 | Login as CEO | ⬜ | Verify restricted from Chairman-only features |
| 1.4 | Login as Director | ⬜ | Verify role-appropriate access |
| 1.5 | Login as Center Admin | ⬜ | Verify center-specific access only |
| 1.6 | Login as Teacher | ⬜ | Verify teaching dashboard |
| 1.7 | Login as Parent | ⬜ | Verify student view access |
| 1.8 | Login as Student | ⬜ | Verify limited access |
| 1.9 | Test JWT token expiry | ⬜ | Token should expire and require re-login |
| 1.10 | Test invalid credentials | ⬜ | Should show error message |

---

### Phase 2: Chairman Panel (GOD Mode)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 2.1 | **Control Center Dashboard** | ⬜ | /dashboard/chairman |
| 2.2 | View all users across centers | ⬜ | /dashboard/chairman/users |
| 2.3 | Create/Edit/Delete any user | ⬜ | Test CRUD operations |
| 2.4 | **Staff Management** | ⬜ | /dashboard/chairman/staff |
| 2.5 | **Board of Directors** | ⬜ | /dashboard/chairman/board |
| 2.6 | **Directors Management** | ⬜ | /dashboard/chairman/directors |
| 2.7 | **Org Structure** | ⬜ | /dashboard/chairman/org-structure |
| 2.8 | **Roles & Permissions** | ⬜ | /dashboard/chairman/roles |
| 2.9 | Assign permissions to roles | ⬜ | Test permission matrix |
| 2.10 | **Centers Management** | ⬜ | /dashboard/chairman/centers |
| 2.11 | Create new center | ⬜ | Test center creation |
| 2.12 | **Departments** | ⬜ | /dashboard/chairman/departments |
| 2.13 | **Courses Overview** | ⬜ | /dashboard/chairman/courses |
| 2.14 | **System Settings** | ⬜ | /dashboard/chairman/settings |
| 2.15 | **Dropdown Options** | ⬜ | /dashboard/chairman/dropdown-options |
| 2.16 | View all pending approvals | ⬜ | /dashboard/superadmin/approvals |
| 2.17 | View audit logs | ⬜ | /dashboard/superadmin/audit |
| 2.18 | **Data Import (Excel)** | ⬜ | /dashboard/superadmin/data-import |

---

### Phase 3: SuperAdmin Panel

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 3.1 | Dashboard with real stats | ⬜ | Verify counts from DB |
| 3.2 | **Users CRUD** | ⬜ | Create, Read, Update, Delete |
| 3.3 | **Students CRUD** | ⬜ | Create, Read, Update, Delete |
| 3.4 | **Teachers CRUD** | ⬜ | Create, Read, Update, Delete |
| 3.5 | **Centers CRUD** | ⬜ | Create, Read, Update, Delete |
| 3.6 | **Departments CRUD** | ⬜ | Create, Read, Update, Delete |
| 3.7 | **Courses CRUD** | ⬜ | Create, Read, Update, Delete |
| 3.8 | **Classes CRUD** | ⬜ | Create, Read, Update, Delete |
| 3.9 | **Attendance Overview** | ⬜ | View all attendance data |
| 3.10 | **Payroll Management** | ⬜ | View/process payroll |
| 3.11 | **Reports Generation** | ⬜ | Generate various reports |
| 3.12 | **Approvals Workflow** | ⬜ | Approve/reject requests |

---

### Phase 4: Academy Features

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 4.1 | Student enrollment | ⬜ | Enroll student in course |
| 4.2 | Class scheduling | ⬜ | Create class schedule |
| 4.3 | Teacher assignment | ⬜ | Assign teacher to class |
| 4.4 | Attendance marking | ⬜ | Mark attendance |
| 4.5 | Grade entry | ⬜ | Enter student grades |
| 4.6 | Certificate generation | ⬜ | Generate completion cert |
| 4.7 | Course materials | ⬜ | Upload/view materials |
| 4.8 | Lesson management | ⬜ | Create course lessons |

---

### Phase 5: Public Website Management

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 5.1 | Home page editor | ⬜ | Edit hero section |
| 5.2 | About page | ⬜ | Update about content |
| 5.3 | Courses display | ⬜ | Public courses listing |
| 5.4 | Centers page | ⬜ | Show all centers |
| 5.5 | Testimonials | ⬜ | Add/edit testimonials |
| 5.6 | Blog/Posts | ⬜ | Create blog posts |
| 5.7 | FAQ management | ⬜ | Add/edit FAQs |
| 5.8 | Contact page | ⬜ | Contact form works |
| 5.9 | SEO settings | ⬜ | Update meta tags |
| 5.10 | Branding | ⬜ | Logo, colors, fonts |

---

### Phase 6: Communication Features

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 6.1 | Announcements | ⬜ | Create/send announcements |
| 6.2 | Notifications | ⬜ | Push notifications |
| 6.3 | Messages | ⬜ | Send/receive messages |
| 6.4 | Email notifications | ⬜ | Email sending works |

---

### Phase 7: Integration Tests

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 7.1 | Chairman creates user → appears in system | ⬜ | |
| 7.2 | Center Admin creates class → Chairman sees it | ⬜ | |
| 7.3 | Teacher marks attendance → Reports update | ⬜ | |
| 7.4 | Student enrolls → Teacher sees in roster | ⬜ | |
| 7.5 | Leave request → Goes through approval chain | ⬜ | |
| 7.6 | Data import → All entities created | ⬜ | |

---

### Phase 8: Data Validation (No Static Data)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 8.1 | Dashboard counts from API | ⬜ | Not hardcoded |
| 8.2 | User list from database | ⬜ | Real users |
| 8.3 | Student list from database | ⬜ | Real students |
| 8.4 | Teacher list from database | ⬜ | Real teachers |
| 8.5 | Centers from database | ⬜ | Real centers |
| 8.6 | Courses from database | ⬜ | Real courses |
| 8.7 | Dropdown options from database | ⬜ | Dynamic options |
| 8.8 | Reports generated from real data | ⬜ | Actual analytics |

---

## 🧪 How to Run Tests

### Step 1: Start Services
```bash
# Kill existing processes
pkill -9 -f java

# Restart PostgreSQL
brew services restart postgresql

# Wait 5 seconds
sleep 5

# Start Identity Service
cd /Users/rahulsharma/LERA_Group/backend/identity_service
mvn spring-boot:run -DskipTests &

# Start Frontend
cd /Users/rahulsharma/LERA_Group/frontend
npm run dev
```

### Step 2: Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Chairman | Chairman@Leraacademy.edu.vn | chairman123 |
| CEO | ceo@leraacademy.edu.vn | ceo123 |
| SuperAdmin | superadmin@lera.com | admin123 |
| Center Admin | center.admin@lera.com | admin123 |
| Teacher | teacher@lera.com | teacher123 |
| Parent | parent@lera.com | parent123 |
| Student | student@lera.com | student123 |

### Step 3: Test Each Feature
1. Login as Chairman first
2. Navigate to each menu item
3. Test CRUD operations
4. Verify data persists after refresh
5. Check other roles can see appropriate data

---

## 🚨 Known Issues to Fix Before Production

| Issue | Priority | Status |
|-------|----------|--------|
| Department/ReportsTo not showing in Users | HIGH | 🔧 Fixed |
| Too many DB connections | HIGH | ⚠️ Limit services |
| Some dropdowns empty | MEDIUM | Need data |
| Email service not configured | MEDIUM | Set up SMTP |

---

## ✅ Definition of Done

Before going live:
- [ ] All test cases pass
- [ ] No static/dummy data visible
- [ ] All roles can access their panels
- [ ] Chairman can access everything
- [ ] Data persists after refresh
- [ ] No console errors
- [ ] Forms validate properly
- [ ] API calls work correctly
