# LERA GROUP - Frontend & Backend Gap Analysis

## 📊 Executive Summary

This document analyzes the alignment between:
- **Frontend** (Next.js) pages and API calls
- **Backend** (Spring Boot) services and controllers
- **Database** (PostgreSQL) connectivity

---

## ✅ Services Status

| Service | Port | Backend | Frontend Proxy | Status |
|---------|------|---------|----------------|--------|
| Identity Service | 8081 | ✅ | ✅ | **ALIGNED** |
| Academy Service | 8082 | ✅ | ✅ | **ALIGNED** |
| Payment Service | 8083 | ✅ | ✅ | **ALIGNED** |
| Payroll Service | 8084 | ✅ | ✅ | **ALIGNED** |
| Attendance Service | 8085 | ✅ | ✅ | **ALIGNED** |
| Connect Service | 8086 | ✅ | ✅ | **ALIGNED** |
| AI Gateway | 8087 | ✅ | ✅ | **ALIGNED** |
| Rule Engine | 8088 | ✅ | ✅ | **ALIGNED** |
| Social Media Service | 8089 | ✅ | ❌ | **MISSING PROXY** |

---

## 🔴 CRITICAL GAPS

### 1. Missing API Proxies in `next.config.js`

The following APIs are called from frontend but **NOT proxied** in next.config.js:

```javascript
// MISSING - Social Media Service Routes (port 8089)
{ source: "/api/social-media", destination: `${socialMediaUrl}/api/social-media` },
{ source: "/api/social-media/:path*", destination: `${socialMediaUrl}/api/social-media/:path*` },

// MISSING - Additional Academy Routes
{ source: "/api/book-borrowings", destination: `${academyUrl}/api/book-borrowings` },
{ source: "/api/book-borrowings/:path*", destination: `${academyUrl}/api/book-borrowings/:path*` },
{ source: "/api/book-reservations", destination: `${academyUrl}/api/book-reservations` },
{ source: "/api/book-reservations/:path*", destination: `${academyUrl}/api/book-reservations/:path*` },
{ source: "/api/library-fines", destination: `${academyUrl}/api/library-fines` },
{ source: "/api/library-fines/:path*", destination: `${academyUrl}/api/library-fines/:path*` },
{ source: "/api/vehicles", destination: `${academyUrl}/api/vehicles` },
{ source: "/api/vehicles/:path*", destination: `${academyUrl}/api/vehicles/:path*` },
{ source: "/api/drivers", destination: `${academyUrl}/api/drivers` },
{ source: "/api/drivers/:path*", destination: `${academyUrl}/api/drivers/:path*` },

// MISSING - Connect Service Routes
{ source: "/api/polls", destination: `${connectUrl}/api/polls` },
{ source: "/api/polls/:path*", destination: `${connectUrl}/api/polls/:path*` },
{ source: "/api/stories", destination: `${connectUrl}/api/stories` },
{ source: "/api/stories/:path*", destination: `${connectUrl}/api/stories/:path*` },
{ source: "/api/meetings", destination: `${connectUrl}/api/meetings` },
{ source: "/api/meetings/:path*", destination: `${connectUrl}/api/meetings/:path*` },
{ source: "/api/followups", destination: `${connectUrl}/api/followups` },
{ source: "/api/followups/:path*", destination: `${connectUrl}/api/followups/:path*` },

// MISSING - Payment Service Routes
{ source: "/api/scholarships", destination: `${paymentUrl}/api/scholarships` },
{ source: "/api/scholarships/:path*", destination: `${paymentUrl}/api/scholarships/:path*` },
{ source: "/api/ledger", destination: `${paymentUrl}/api/ledger` },
{ source: "/api/ledger/:path*", destination: `${paymentUrl}/api/ledger/:path*` },
{ source: "/api/payment-methods", destination: `${paymentUrl}/api/payment-methods` },
{ source: "/api/payment-methods/:path*", destination: `${paymentUrl}/api/payment-methods/:path*` },

// MISSING - Payroll Service Routes
{ source: "/api/bonuses", destination: `${payrollUrl}/api/bonuses` },
{ source: "/api/bonuses/:path*", destination: `${payrollUrl}/api/bonuses/:path*` },
{ source: "/api/deductions", destination: `${payrollUrl}/api/deductions` },
{ source: "/api/deductions/:path*", destination: `${payrollUrl}/api/deductions/:path*` },
{ source: "/api/tax-settings", destination: `${payrollUrl}/api/tax-settings` },
{ source: "/api/tax-settings/:path*", destination: `${payrollUrl}/api/tax-settings/:path*` },

// MISSING - Identity Service Routes
{ source: "/api/staff", destination: `${identityUrl}/api/staff` },
{ source: "/api/staff/:path*", destination: `${identityUrl}/api/staff/:path*` },
{ source: "/api/tenants", destination: `${identityUrl}/api/tenants` },
{ source: "/api/tenants/:path*", destination: `${identityUrl}/api/tenants/:path*` },
{ source: "/api/permissions", destination: `${identityUrl}/api/permissions` },
{ source: "/api/permissions/:path*", destination: `${identityUrl}/api/permissions/:path*` },
{ source: "/api/feature-flags", destination: `${identityUrl}/api/feature-flags` },
{ source: "/api/feature-flags/:path*", destination: `${identityUrl}/api/feature-flags/:path*` },
{ source: "/api/website-settings", destination: `${identityUrl}/api/website-settings` },
{ source: "/api/website-settings/:path*", destination: `${identityUrl}/api/website-settings/:path*` },
{ source: "/api/login-history", destination: `${identityUrl}/api/login-history` },
{ source: "/api/login-history/:path*", destination: `${identityUrl}/api/login-history/:path*` },
```

---

### 2. Backend Controllers Not Exposed in Frontend

#### Academy Service (8082)
| Controller | API Path | Frontend Page | Status |
|------------|----------|---------------|--------|
| BookBorrowingController | /api/book-borrowings | Library Page | ⚠️ No Proxy |
| BookReservationController | /api/book-reservations | Library Page | ⚠️ No Proxy |
| LibraryFineController | /api/library-fines | Library Page | ⚠️ No Proxy |
| LibraryInventoryController | /api/library-inventory | Library Page | ⚠️ No Proxy |
| VehicleController | /api/vehicles | Transport Page | ⚠️ No Proxy |
| VehicleMaintenanceController | /api/vehicle-maintenance | Transport Page | ⚠️ No Proxy |
| TransportDriverController | /api/drivers | Transport Page | ⚠️ No Proxy |
| RouteStopController | /api/route-stops | Transport Page | ⚠️ No Proxy |
| GpsTrackingController | /api/gps-tracking | Transport Page | ⚠️ No Proxy |
| SportTypeController | /api/sports | Sports Page | ❌ Missing Page |
| SportTeamController | /api/sport-teams | Sports Page | ❌ Missing Page |
| SportMatchController | /api/sport-matches | Sports Page | ❌ Missing Page |
| TournamentController | /api/tournaments | Sports Page | ❌ Missing Page |

#### Connect Service (8086)
| Controller | API Path | Frontend Page | Status |
|------------|----------|---------------|--------|
| PollController | /api/polls | Connect Page | ⚠️ No Proxy |
| StoryController | /api/stories | Connect Page | ✅ Used |
| MeetingController | /api/meetings | Connect Page | ⚠️ No Proxy |
| FollowupController | /api/followups | CRM Page | ⚠️ No Proxy |
| LeadNoteController | /api/lead-notes | CRM Page | ⚠️ No Proxy |
| LeadActivityController | /api/lead-activities | CRM Page | ⚠️ No Proxy |
| AiTutorController | /api/ai-tutor | AI Tutor Page | ⚠️ No Proxy |
| ContentModerationController | /api/content-moderation | Admin Page | ⚠️ No Proxy |
| ParentTeacherMeetingController | /api/parent-teacher-meetings | Parent Page | ⚠️ No Proxy |
| AdAccountController | /api/ad-accounts | Marketing Page | ⚠️ No Proxy |

#### Payment Service (8083)
| Controller | API Path | Frontend Page | Status |
|------------|----------|---------------|--------|
| ScholarshipController | /api/scholarships | Finance Page | ⚠️ No Proxy |
| StudentScholarshipController | /api/student-scholarships | Finance Page | ⚠️ No Proxy |
| LedgerEntryController | /api/ledger | Finance Page | ⚠️ No Proxy |
| PaymentMethodController | /api/payment-methods | Payments Page | ⚠️ No Proxy |
| LateFeeRuleController | /api/late-fee-rules | Fee Rules Page | ⚠️ No Proxy |
| FeeReceiptController | /api/fee-receipts | Invoices Page | ⚠️ No Proxy |

#### Payroll Service (8084)
| Controller | API Path | Frontend Page | Status |
|------------|----------|---------------|--------|
| BonusController | /api/bonuses | Payroll Page | ⚠️ No Proxy |
| DeductionController | /api/deductions | Payroll Page | ⚠️ No Proxy |
| TaxSettingsController | /api/tax-settings | Payroll Page | ⚠️ No Proxy |
| SalaryComponentController | /api/salary-components | Payroll Page | ⚠️ No Proxy |
| PayrollCycleController | /api/payroll-cycles | Payroll Page | ⚠️ No Proxy |
| SalaryPayoutController | /api/salary-payouts | Payroll Page | ⚠️ No Proxy |
| TeacherOvertimeController | /api/teacher-overtime | Payroll Page | ⚠️ No Proxy |

#### Identity Service (8081)
| Controller | API Path | Frontend Page | Status |
|------------|----------|---------------|--------|
| StaffController | /api/staff | Staff Page | ⚠️ No Proxy |
| TenantController | /api/tenants | Admin Page | ⚠️ No Proxy |
| PermissionController | /api/permissions | Roles Page | ⚠️ No Proxy |
| FeatureFlagController | /api/feature-flags | Settings Page | ⚠️ No Proxy |
| WebsiteSettingsController | /api/website-settings | Website Settings | ⚠️ No Proxy |
| LoginHistoryController | /api/login-history | Audit Page | ⚠️ No Proxy |
| TenantSettingsController | /api/tenant-settings | Settings Page | ⚠️ No Proxy |

---

### 3. Frontend Pages Without Backend Implementation

| Frontend Page | Expected API | Backend Status |
|---------------|--------------|----------------|
| /dashboard/superadmin/data-import | /api/import/* | ⚠️ Partial |
| /dashboard/chairman/marketing | /api/marketing/* | ⚠️ Partial |
| /dashboard/chairman/support | /api/support/* | ❌ Missing |

---

### 4. Incomplete Service Configurations

#### Services Missing from Backend:
- `bookstore_service` - Has folder but no `pom.xml` or config
- `hostel_service` - Has folder but no `pom.xml` or config
- `library_service` - Has folder but no `pom.xml` or config  
- `transport_service` - Has folder but no `pom.xml` or config

**Note:** Library and Transport features ARE implemented in `academy_service`

---

## 🟡 WARNINGS

### Hardcoded URLs in Frontend

Found hardcoded localhost URLs that bypass the proxy:

```typescript
// frontend/app/dashboard/users/[id]/page.tsx
const userRes = await fetch(`http://localhost:8081/api/users/${userId}`);
const activityRes = await fetch(`http://localhost:8082/api/user-activity/user/${userId}/filter/${dateFilter}`);

// frontend/hooks/useWebsiteSettings.tsx
const API_BASE = process.env.NEXT_PUBLIC_IDENTITY_API_URL || 'http://localhost:8081';

// frontend/hooks/useFormConfig.ts
const API_BASE_URL = 'http://localhost:8082/api/form-configs';
```

**Fix:** Use `apiFetch()` instead of direct `fetch()` with hardcoded URLs.

---

## 🔧 FIXES REQUIRED

### Fix 1: Update `next.config.js` with missing proxies

### Fix 2: Fix hardcoded URLs to use `apiFetch()`

### Fix 3: Add Social Media Service to frontend proxy

### Fix 4: Create missing frontend pages for sports management

---

## 📋 Service-to-Frontend Mapping

### Identity Service (8081) → Frontend
```
✅ /api/auth → Login/Register
✅ /api/users → User Management
✅ /api/roles → Role Management
✅ /api/centers → Center Management
✅ /api/departments → Department Management
✅ /api/impersonation → Admin Impersonation
✅ /api/user-permissions → Permission Management
✅ /api/activity-logs → Activity Logs
✅ /api/system-settings → System Settings
⚠️ /api/staff → Staff Management (no proxy)
⚠️ /api/tenants → Multi-tenancy (no proxy)
⚠️ /api/permissions → Permissions (no proxy)
⚠️ /api/feature-flags → Feature Flags (no proxy)
⚠️ /api/website-settings → Website Settings (no proxy)
```

### Academy Service (8082) → Frontend
```
✅ /api/students → Student Management
✅ /api/teachers → Teacher Management
✅ /api/courses → Course Management
✅ /api/classes → Class Management
✅ /api/enrollments → Enrollment Management
✅ /api/assignments → Assignment Management
✅ /api/exams → Exam Management
✅ /api/grades → Grade Management
✅ /api/curriculum → Curriculum Management
✅ /api/books → Library Books
✅ /api/certificates → Certificate Management
✅ /api/transport → Transport Routes
✅ /api/gamification → Gamification
⚠️ /api/book-borrowings → Library (no proxy)
⚠️ /api/vehicles → Transport (no proxy)
⚠️ /api/drivers → Transport (no proxy)
❌ /api/sports → Sports (no page)
```

### Payment Service (8083) → Frontend
```
✅ /api/payments → Payment Management
✅ /api/invoices → Invoice Management
✅ /api/fee-rules → Fee Rules
✅ /api/discounts → Discounts
✅ /api/refunds → Refunds
✅ /api/student-fee-plans → Fee Plans
✅ /api/finance → Finance Dashboard
⚠️ /api/scholarships → Scholarships (no proxy)
⚠️ /api/ledger → Ledger (no proxy)
⚠️ /api/payment-methods → Payment Methods (no proxy)
```

### Payroll Service (8084) → Frontend
```
✅ /api/payroll → Payroll Management
✅ /api/teacher-salaries → Teacher Salaries
⚠️ /api/bonuses → Bonuses (no proxy)
⚠️ /api/deductions → Deductions (no proxy)
⚠️ /api/tax-settings → Tax Settings (no proxy)
⚠️ /api/salary-components → Salary Components (no proxy)
```

### Attendance Service (8085) → Frontend
```
✅ /api/attendance → Attendance Tracking
✅ /api/teacher-sessions → Teacher Sessions
✅ /api/leaves → Leave Management
✅ /api/leave-balance → Leave Balance
✅ /api/leave-requests → Leave Requests
```

### Connect Service (8086) → Frontend
```
✅ /api/leads → Lead Management
✅ /api/marketing-campaigns → Marketing
✅ /api/social-media-posts → Social Media
✅ /api/notifications → Notifications
✅ /api/messages → Messaging
✅ /api/tasks → Task Management
✅ /api/chat → Chat
✅ /api/groups → Groups
⚠️ /api/polls → Polls (no proxy)
⚠️ /api/stories → Stories (no proxy)
⚠️ /api/meetings → Meetings (no proxy)
⚠️ /api/followups → Followups (no proxy)
⚠️ /api/ai-tutor → AI Tutor (no proxy)
```

### AI Gateway (8087) → Frontend
```
✅ /api/ai → AI Services
✅ /api/tutor → AI Tutor
```

### Rule Engine (8088) → Frontend
```
✅ /api/rules → Rule Management
```

---

## 📝 Action Items

1. **HIGH PRIORITY**: Add missing API proxies to `next.config.js`
2. **HIGH PRIORITY**: Fix hardcoded URLs in frontend components
3. **MEDIUM PRIORITY**: Add Social Media Service (8089) to proxy config
4. **LOW PRIORITY**: Create Sports Management frontend pages
5. **LOW PRIORITY**: Remove unused service folders (bookstore, hostel, library, transport)

---

*Generated: January 31, 2026*
