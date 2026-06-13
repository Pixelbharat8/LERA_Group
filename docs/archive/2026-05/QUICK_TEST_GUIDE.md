# 🧪 QUICK TEST GUIDE - SUPERADMIN FEATURES

## 🚀 QUICK START (2 minutes)

```bash
# Terminal 1: Start all services
cd /Users/rahulsharma/LERA_Group
bash start-all-services.sh
# Wait 60-90 seconds...

# Terminal 2: Start frontend
cd /Users/rahulsharma/LERA_Group/frontend
npm run dev

# Terminal 3: Monitor services
lsof -i :8080 -i :8081 -i :8082 -i :8083 -i :8084 -i :8085 -i :8086 | grep LISTEN
```

## 🔐 LOGIN

**URL:** http://localhost:3000/auth/login  
**Email:** admin@lera.com  
**Password:** admin123

## ✅ TEST CHECKLIST

### Page 1: Users Management
**URL:** http://localhost:3000/dashboard/superadmin/users
- [ ] Page loads without errors
- [ ] Shows at least 1 user (admin)
- [ ] User has role displayed
- [ ] Can add new user
- [ ] Can edit user
- [ ] Can delete user

### Page 2: Roles & Permissions
**URL:** http://localhost:3000/dashboard/superadmin/roles
- [ ] Shows 6 roles (SUPER_ADMIN, ADMIN, CENTER_MANAGER, TEACHER, STUDENT, PARENT)
- [ ] Each role shows permission count
- [ ] Can click to view permissions
- [ ] Status: ✅ SHOULD WORK

### Page 3: Centers
**URL:** http://localhost:3000/dashboard/superadmin/centers
- [ ] Shows main center
- [ ] Can add center
- [ ] Can edit center
- [ ] Can delete center
- [ ] Status: ✅ SHOULD WORK

### Page 4: Teachers
**URL:** http://localhost:3000/dashboard/academy/teachers
- [ ] Shows 3 teachers (TCH001, TCH002, TCH003)
- [ ] Displays: Code, Specialization, Qualification, Experience, Status
- [ ] Can add teacher
- [ ] Can edit teacher
- [ ] Can delete teacher
- [ ] Status: ⏳ SHOULD WORK AFTER REBUILD

### Page 5: Students
**URL:** http://localhost:3000/dashboard/academy/students
- [ ] Shows 4 students (STU001-004)
- [ ] Displays: Code, Name, Date of Birth, Grade, Status
- [ ] Can add student
- [ ] Can edit student
- [ ] Can delete student
- [ ] Status: ⏳ SHOULD WORK AFTER REBUILD

### Page 6: Classes
**URL:** http://localhost:3000/dashboard/academy/classes
- [ ] Shows 2 classes
- [ ] Displays: Name, Program, Teacher, Capacity, Status
- [ ] Can add class
- [ ] Can edit class
- [ ] Can delete class
- [ ] Status: ⏳ SHOULD WORK AFTER REBUILD

### Page 7: Enrollments
**URL:** http://localhost:3000/dashboard/academy/enrollments
- [ ] Shows enrollments
- [ ] Can add enrollment
- [ ] Can delete enrollment
- [ ] Status: ⏳ SHOULD WORK AFTER REBUILD

### Page 8: Courses
**URL:** http://localhost:3000/dashboard/academy/courses OR /dashboard/superadmin/public-website/courses
- [ ] Shows 3 courses (Starters, Explorers, Primary)
- [ ] Can add course
- [ ] Can edit course
- [ ] Can delete course
- [ ] Status: ✅ SHOULD WORK

### Page 9: Attendance
**URL:** http://localhost:3000/dashboard/attendance
- [ ] Shows attendance records
- [ ] Date filter works
- [ ] Shows stats (Present, Absent, Late)
- [ ] Can mark attendance
- [ ] Status: ⏳ SHOULD WORK AFTER REBUILD

### Page 10: Payments
**URL:** http://localhost:3000/dashboard/payments
- [ ] Shows 7 payment records
- [ ] Shows stats (Total Revenue, This Month, Pending, Overdue)
- [ ] "Record Payment" button visible
- [ ] Status: ⏳ PARTIALLY WORKING (data shows, button needs modal)

### Page 11: Payroll
**URL:** http://localhost:3000/dashboard/payroll
- [ ] Shows 8 payroll records
- [ ] Shows stats (Total Staff, Monthly Payroll, Pending, Processed)
- [ ] "Run Payroll" button visible
- [ ] Status: ⏳ PARTIALLY WORKING (data shows, button needs modal)

### Page 12: CRM Leads
**URL:** http://localhost:3000/dashboard/crm/leads
- [ ] Shows leads
- [ ] Shows stats (New, Contacted, Qualified, Converted, Lost)
- [ ] Can add lead
- [ ] Can edit lead
- [ ] Can convert lead
- [ ] Status: ✅ SHOULD WORK

### Page 13: Blog
**URL:** http://localhost:3000/dashboard/superadmin/public-website/blog
- [ ] Shows blog posts
- [ ] Can add blog post
- [ ] Can edit blog post
- [ ] Can publish/unpublish
- [ ] Can delete blog post
- [ ] Status: ✅ SHOULD WORK

### Page 14: Testimonials
**URL:** http://localhost:3000/dashboard/superadmin/public-website/testimonials
- [ ] Shows testimonials
- [ ] Can add testimonial
- [ ] Can edit testimonial
- [ ] Can delete testimonial
- [ ] Status: ✅ SHOULD WORK

### Page 15: Gamification
**URL:** http://localhost:3000/dashboard/superadmin/gamification
- [ ] Page loads
- [ ] Shows student points/leaderboard
- [ ] Status: ⚠️ PARTIALLY IMPLEMENTED

### Page 16: CMS - Home
**URL:** http://localhost:3000/dashboard/superadmin/public-website/home
- [ ] Can edit hero content
- [ ] Changes save
- [ ] Status: ✅ SHOULD WORK

### Page 17: CMS - Branding
**URL:** http://localhost:3000/dashboard/superadmin/public-website/branding
- [ ] Shows branding settings
- [ ] Can change colors/logo
- [ ] Status: ✅ SHOULD WORK

### Page 18: CMS - SEO
**URL:** http://localhost:3000/dashboard/superadmin/public-website/seo
- [ ] Shows SEO settings
- [ ] Can edit meta tags
- [ ] Status: ✅ SHOULD WORK

---

## 🔧 API ENDPOINT TESTS

### Test Teachers Endpoint
```bash
curl -X GET http://localhost:8081/api/teachers
# Should return array of 3 teachers
```

### Test Students Endpoint
```bash
curl -X GET http://localhost:8081/api/students
# Should return array of 4 students
```

### Test Classes Endpoint
```bash
curl -X GET http://localhost:8081/api/classes
# Should return array of 2 classes
```

### Test Attendance Endpoint
```bash
curl -X GET "http://localhost:8084/api/attendance?date=2024-12-17"
# Should return attendance records for that date
```

### Test Payments Endpoint
```bash
curl -X GET http://localhost:8082/api/payments
# Should return array of 7 payments
```

### Test Payroll Endpoint
```bash
curl -X GET http://localhost:8083/api/payroll
# Should return array of 8 payroll records
```

### Test Leads Endpoint
```bash
curl -X GET http://localhost:8085/api/leads
# Should return array of leads
```

### Test Roles Endpoint
```bash
curl -X GET http://localhost:8080/api/roles
# Should return array of roles
```

### Test Users Endpoint
```bash
curl -X GET http://localhost:8080/api/users
# Should return array of users (fix needed if fails)
```

---

## 📊 DATABASE CHECK

### Connect to Database
```bash
psql -h localhost -U lera -d lera
```

### Check Table Counts
```sql
SELECT 'Teachers' as table_name, COUNT(*) FROM teachers
UNION ALL
SELECT 'Students', COUNT(*) FROM students
UNION ALL
SELECT 'Classes', COUNT(*) FROM classes
UNION ALL
SELECT 'Enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'Attendance', COUNT(*) FROM attendance
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments
UNION ALL
SELECT 'Payroll Records', COUNT(*) FROM payroll_records
UNION ALL
SELECT 'Leads', COUNT(*) FROM leads;
```

### Expected Results:
- Teachers: 3
- Students: 4
- Classes: 2
- Enrollments: 6 (4 students × 2 classes with some duplicates removed)
- Attendance: 16 (8 today + 8 yesterday)
- Payments: 7 (4 + 3)
- Payroll Records: 8 (4 current month + 4 previous month)
- Leads: N/A (depends on manual entry)

---

## 🐛 TROUBLESHOOTING

### Issue: "Failed to fetch" on Users page
**Solution:** UserDTO mapping needs fix
```bash
# Check log for error
tail -50 /tmp/identity_service.log

# Fix UserDTO to include roleName mapping
# File: /backend/identity_service/.../service/UserService.java
```

### Issue: Teachers/Students/Classes not showing
**Solution:** Services need rebuild
```bash
cd /Users/rahulsharma/LERA_Group/backend/academy_service
mvn clean install
# Then restart services
```

### Issue: Attendance empty on date filter
**Solution:** Check date format
```bash
# Verify date in database
SELECT DISTINCT attendance_date FROM attendance;
```

### Issue: Payment/Payroll buttons not functional
**Solution:** Form modals need implementation
```bash
# Check if modal state exists in page
# If not, add: const [showModal, setShowModal] = useState(false)
```

---

## ✅ SUCCESS INDICATORS

After rebuilding and restarting, you should see:

✅ **Working:**
- 3 Teachers listed
- 4 Students listed
- 2 Classes listed
- 6 Enrollments listed
- 16 Attendance records
- 7 Payment records
- 8 Payroll records
- Roles with permission counts
- Main center listed
- 3 Courses listed
- Leads displayed
- Blog posts displayed
- Testimonials displayed

❌ **Still Needs Work:**
- Payment "Record Payment" button form
- Payroll "Run Payroll" button form
- Users page (UserDTO fix needed)
- Gamification frontend implementation
- Media management backend

---

## 📈 TRACKING PROGRESS

| Feature | Before | After Rebuild | Final |
|---------|--------|---------------|-------|
| Teachers | ❌ | ✅ | ✅ |
| Students | ❌ | ✅ | ✅ |
| Classes | ❌ | ✅ | ✅ |
| Enrollments | ❌ | ✅ | ✅ |
| Attendance | ⚠️ | ✅ | ✅ |
| Payments | ⚠️ | ✅ | ⏳ |
| Payroll | ⚠️ | ✅ | ⏳ |
| Users | ❌ | ❌ | ⏳ |
| CRM Leads | ✅ | ✅ | ✅ |
| Courses | ✅ | ✅ | ✅ |
| Roles | ✅ | ✅ | ✅ |
| Centers | ✅ | ✅ | ✅ |
| Blog | ✅ | ✅ | ✅ |
| Testimonials | ✅ | ✅ | ✅ |

---

## 🎯 NEXT ACTIONS

1. ✅ Rebuild services
2. ✅ Start all services
3. ✅ Login to admin dashboard
4. ✅ Test each page from checklist
5. ⏳ Document any failures
6. ⏳ Fix UserDTO issue
7. ⏳ Add Payment/Payroll modals
8. ⏳ Implement Gamification frontend

---

Happy Testing! 🚀

