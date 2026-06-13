# 🚀 LERA Academy Platform - All Services Running

**Date**: December 30, 2025

## ✅ Running Services

### Backend Services
| Service | Port | URL | Status |
|---------|------|-----|--------|
| Identity Service | 8080 | http://localhost:8080 | ✅ Running |
| Academy Service | 8081 | http://localhost:8081 | ✅ Running |
| Payment Service | 8082 | http://localhost:8082 | ✅ Running |
| Payroll Service | 8083 | http://localhost:8083 | ✅ Running |
| Attendance Service | 8084 | http://localhost:8084 | ✅ Running |
| Connect/CRM Service | 8085 | http://localhost:8085 | ✅ Running |
| AI Gateway | 8086 | http://localhost:8086 | ✅ Running |
| Rule Engine | 8087 | http://localhost:8087 | ✅ Running |

### Frontend
| Application | Port | URL | Status |
|-------------|------|-----|--------|
| Next.js Frontend | 3000 | http://localhost:3000 | ✅ Running |

---

## 🌐 Quick Access Links

### Public Website
- **Homepage**: http://localhost:3000
- **Courses**: http://localhost:3000/courses
- **About**: http://localhost:3000/about
- **Contact**: http://localhost:3000/contact

### Authentication
- **Login**: http://localhost:3000/auth/login
  - Chairman: `Chairman@Leraacademy.edu.vn` / `admin123`
  - CEO: `CEO@Leraacademy.edu.vn` / `admin123`
  - Super Admin: `admin@lera.com` / `admin123`

### Dashboards
- **Main Dashboard**: http://localhost:3000/dashboard
- **Chairman Dashboard**: http://localhost:3000/dashboard/superadmin
- **Academy Management**: http://localhost:3000/dashboard/academy
- **Finance**: http://localhost:3000/dashboard/finance
- **Attendance**: http://localhost:3000/dashboard/attendance
- **CRM/Leads**: http://localhost:3000/dashboard/crm/leads
- **Payroll**: http://localhost:3000/dashboard/superadmin/payroll

---

## 📊 Recent Updates & Features

### ✅ Completed Features

#### 1. **Roles & Permissions System**
- Full permission management for Chairman
- 15 feature toggles per user
- Custom permissions via localStorage
- Location: `/dashboard/superadmin/roles`

#### 2. **Public Website CMS Integration**
- Stats editing from Chairman panel
- Homepage Hero section management
- Courses section management
- Real-time updates from backend
- Location: `/dashboard/superadmin/public-website/home`

#### 3. **Lead Management System**
- Registration form submissions → CRM leads
- Contact form submissions → CRM leads
- Course registration → CRM leads
- Lead tracking and status management
- Location: `/dashboard/crm/leads`

#### 4. **Payment Service Enhancements**
- ✅ Student Discount Management (`/api/student-discounts`)
- ✅ Late Fee Rules (`/api/late-fee-rules`)
- ✅ Ledger Entry System (`/api/ledger`)
- ✅ Payment Processing (`/api/payments`)
- ✅ Invoice Management (`/api/invoices`)
- ✅ Refund Processing (`/api/refunds`)

#### 5. **Language Support**
- English/Vietnamese toggle
- Course names dynamically update
- Stats labels in both languages
- All public pages fully bilingual

#### 6. **Attendance System**
- Teacher attendance tracking
- Staff attendance tracking
- Center-specific views
- CEO dashboard with all centers
- Location: `/dashboard/superadmin/attendance`

#### 7. **Leave Management System** [NEW]
- ✅ Teacher/Staff leave requests (`/api/leaves`)
- ✅ Leave approval workflow (PENDING → APPROVED/REJECTED)
- ✅ Center-based leave management
- ✅ Leave balance tracking (12 days/year)
- ✅ 7 leave types (Sick, Casual, Annual, Emergency, etc.)
- ✅ Half-day leave support
- ✅ Document upload support
- Frontend: `/dashboard/teacher/leave` (Request leave)
- Frontend: `/dashboard/attendance/leave-approvals` (Approve leaves)

---

## 🔧 API Endpoints Reference

### Identity Service (8080)
```
GET    /api/users
GET    /api/users/{id}
POST   /api/auth/login
GET    /api/roles
GET    /api/centers
```

### Academy Service (8081)
```
GET    /api/students
GET    /api/teachers
GET    /api/courses
GET    /api/classes
GET    /api/enrollments
```

### Payment Service (8082)
```
GET    /api/payments
GET    /api/invoices
GET    /api/discounts
GET    /api/refunds
GET    /api/fee-rules
GET    /api/student-discounts     [NEW]
GET    /api/late-fee-rules         [NEW]
GET    /api/ledger                 [NEW]
```

### Payroll Service (8083)
```
GET    /api/salaries
GET    /api/payroll-periods
```

### Attendance Service (8084)
```
GET    /api/attendance
GET    /api/teacher-sessions

# Leave Management APIs [NEW]
POST   /api/leaves/apply                    - Apply for leave
GET    /api/leaves/{id}                     - Get leave by ID
GET    /api/leaves/user/{userId}            - Get user's leaves
GET    /api/leaves/center/{centerId}        - Get center's leaves
GET    /api/leaves/pending?centerId={id}    - Get pending leaves
PUT    /api/leaves/{id}/approve             - Approve leave
PUT    /api/leaves/{id}/reject              - Reject leave
DELETE /api/leaves/{id}?userId={id}         - Cancel leave
GET    /api/leaves/balance/{userId}         - Get leave balance
GET    /api/leaves/all                      - Get all leaves
```

### Connect/CRM Service (8085)
```
GET    /api/leads
POST   /api/leads
GET    /api/followups
```

---

## 🎯 Next Steps & Future Enhancements

### High Priority
- [ ] Complete payment gateway integration
- [ ] Add SMS notification system
- [ ] Implement email templates
- [ ] Add student portal
- [ ] Parent dashboard

### Medium Priority
- [ ] Advanced reporting module
- [ ] Data export (Excel/PDF)
- [ ] Bulk import functionality
- [ ] Calendar/scheduling system
- [ ] Document management

### Low Priority
- [ ] Mobile app development
- [ ] WhatsApp integration
- [ ] Social media integration
- [ ] Advanced analytics dashboard

---

## 🐛 Known Issues & Fixes

### ✅ Fixed Issues
1. ✅ Chairman menu visibility - Fixed with `checkPermission()` helper
2. ✅ Public website stats not updating - Fixed CMS integration
3. ✅ Registration forms not creating leads - Fixed all form submissions
4. ✅ Course language not switching - Fixed with `rawCourses` state
5. ✅ Payment service empty entities - Implemented all missing entities

### 🔍 To Monitor
- Performance with multiple concurrent users
- Database connection pooling under load
- Frontend bundle size optimization

---

## 📝 Development Notes

### Database
- **Host**: localhost:5432
- **Database**: lera_academy
- **User**: postgres

### Environment Variables
- All services configured in `application.properties`
- JWT secret configured
- CORS enabled for development

### Testing Credentials
```
Chairman:
  Email: Chairman@Leraacademy.edu.vn
  Password: admin123
  
CEO:
  Email: CEO@Leraacademy.edu.vn
  Password: admin123
  
Super Admin:
  Email: admin@lera.com
  Password: admin123
```

---

## 🚀 How to Restart Services

### All Services
```bash
# Backend services
cd /Users/rahulsharma/LERA_Group/backend/identity_service && mvn spring-boot:run -DskipTests &
cd /Users/rahulsharma/LERA_Group/backend/academy_service && mvn spring-boot:run -DskipTests &
cd /Users/rahulsharma/LERA_Group/backend/payment_service && mvn org.springframework.boot:spring-boot-maven-plugin:run -DskipTests &
cd /Users/rahulsharma/LERA_Group/backend/payroll_service && mvn spring-boot:run -DskipTests &
cd /Users/rahulsharma/LERA_Group/backend/attendance_service && mvn spring-boot:run -DskipTests &
cd /Users/rahulsharma/LERA_Group/backend/connect_service && mvn spring-boot:run -DskipTests &
cd /Users/rahulsharma/LERA_Group/backend/ai_gateway && mvn spring-boot:run -DskipTests &
cd /Users/rahulsharma/LERA_Group/backend/rule_engine && mvn spring-boot:run -DskipTests &

# Frontend
cd /Users/rahulsharma/LERA_Group/frontend && npm run dev
```

---

**System Status**: All services operational ✅  
**Last Updated**: December 30, 2025  
**Ready for**: Development, Testing, Demo
