# Center-Based Data Filtering Implementation

## Overview
This document summarizes the implementation of center-based data filtering for CENTER_MANAGER and CENTER_ADMIN roles. Users with these roles will now only see data from their assigned center.

## Implementation Date: January 18, 2026

---

## 1. Backend Changes

### Controllers Updated (with `?centerId=xxx` query parameter support)

| Controller | File | Endpoint |
|------------|------|----------|
| StudentController | `academy_service/controller/StudentController.java` | `GET /api/students?centerId=xxx` |
| TeacherController | `academy_service/controller/TeacherController.java` | `GET /api/teachers?centerId=xxx` |
| ClassController | `academy_service/controller/ClassController.java` | `GET /api/classes?centerId=xxx` |
| UserController | `identity_service/controller/UserController.java` | `GET /api/users?centerId=xxx` |
| PaymentController | `payment_service/controller/PaymentController.java` | `GET /api/payments?centerId=xxx` |
| AttendanceController | `attendance_service/controller/AttendanceController.java` | `GET /api/attendance?centerId=xxx` |

### Entity Updates

| Entity | File | Changes |
|--------|------|---------|
| Payment | `payment_service/entity/Payment.java` | Added `centerId` and `studentId` fields |
| AttendanceRecord | `attendance_service/entity/AttendanceRecord.java` | Added `centerId` field |

### Repository Updates

| Repository | New Methods |
|------------|-------------|
| PaymentRepository | `findByCenterId(UUID)`, `findByStudentId(UUID)` |
| AttendanceRepository | `findByCenterId(UUID)` |

### Service Updates

| Service | Changes |
|---------|---------|
| UserService | Added CenterRepository injection, fetches `centerName` on login |

### Database Migration
- File: `/database/migrations/V20260118__add_center_id_for_filtering.sql`
- Adds `center_id` column to `payments` and `attendance_records` tables

---

## 2. Frontend Changes

### New Hook Created
**File:** `/frontend/app/hooks/useUserCenter.ts`

```typescript
export function useUserCenter() {
  // Returns: { centerId, role, shouldFilterByCenter, isCenterManager, isCenterAdmin, loading }
}

export function buildCenterFilterUrl(baseUrl: string, centerId?: string | null) {
  // Appends ?centerId=xxx to URL if centerId is provided
}
```

### Pages Updated with Center Filtering

| Page | Path | Status |
|------|------|--------|
| Center Manager Dashboard | `/centermanager/page.tsx` | ✅ Updated |
| Superadmin Students | `/superadmin/students/page.tsx` | ✅ Updated |
| Superadmin Teachers | `/superadmin/teachers/page.tsx` | ✅ Updated |
| Superadmin Classes | `/superadmin/classes/page.tsx` | ✅ Updated |
| Superadmin Users | `/superadmin/users/page.tsx` | ✅ Updated |
| Academy Students | `/academy/students/page.tsx` | ✅ Updated |
| Academy Classes | `/academy/classes/page.tsx` | ✅ Updated |
| Academy Courses | `/academy/courses/page.tsx` | ✅ Updated |
| Academy Enrollments | `/academy/enrollments/page.tsx` | ✅ Updated |
| Payments | `/payments/page.tsx` | ✅ Updated |
| Attendance | `/attendance/page.tsx` | ✅ Updated |
| CRM Dashboard | `/crm/page.tsx` | ✅ Updated |
| Finance Dashboard | `/finance/page.tsx` | ✅ Updated |
| Finance Invoices | `/finance/invoices/page.tsx` | ✅ Updated |
| Finance Payments | `/finance/payments/page.tsx` | ✅ Updated |
| Finance Refunds | `/finance/refunds/page.tsx` | ✅ Updated |
| Finance Student Plans | `/finance/student-plans/page.tsx` | ✅ Updated |
| Payroll | `/payroll/page.tsx` | ✅ Updated |
| Exams | `/exams/page.tsx` | ✅ Updated |
| Progress | `/progress/page.tsx` | ✅ Updated |
| Organization Departments | `/organization/departments/page.tsx` | ✅ Updated |

### Pages That Already Had Center Filtering
| Page | Path | Notes |
|------|------|-------|
| Center Admin Dashboard | `/center-admin/page.tsx` | Already filters by centerId from userData |

### Pages That Don't Need Center Filtering
| Page | Reason |
|------|--------|
| Teacher Dashboard | Filters by teacherId (teacher sees own classes) |
| TA Dashboard | Filters by taId (TA sees own assigned classes) |
| Staff Dashboard | Filters by staffId (staff sees own tasks) |
| Student Dashboard | Student sees own data |
| Parent Dashboard | Parent sees own child's data |
| Chairman Dashboard | Organization-wide view (should see all) |
| Director Dashboard | Organization-wide view (should see all) |
| CEO Dashboard | Organization-wide view (should see all) |

---

## 3. How It Works

### Login Flow
1. User logs in
2. Backend `UserService` now fetches `centerName` from `CenterRepository`
3. Login response includes: `centerId`, `centerName`, `role`
4. Frontend stores this in cookies as `userData`

### Page Load Flow
1. Page calls `useUserCenter()` hook
2. Hook reads `userData` from cookies
3. Hook determines `shouldFilterByCenter` based on role (true for CENTER_MANAGER, CENTER_ADMIN)
4. Page uses `buildCenterFilterUrl()` to construct API URL with `?centerId=xxx` if needed
5. Backend controller checks for `centerId` query param and filters results

### Role-Based Filtering Logic
```typescript
const shouldFilterByCenter = 
  role === 'CENTER_MANAGER' || 
  role === 'CENTER_ADMIN';
```

---

## 4. Testing Checklist

### Backend Tests
- [ ] StudentController returns only center students when `?centerId=xxx` provided
- [ ] TeacherController returns only center teachers when `?centerId=xxx` provided
- [ ] ClassController returns only center classes when `?centerId=xxx` provided
- [ ] UserController returns only center users when `?centerId=xxx` provided
- [ ] PaymentController returns only center payments when `?centerId=xxx` provided
- [ ] AttendanceController returns only center attendance when `?centerId=xxx` provided

### Frontend Tests
- [ ] Login as CENTER_MANAGER - verify `centerId` and `centerName` in userData
- [ ] Visit each updated page - verify only center data shown
- [ ] Center Manager Dashboard shows center badge
- [ ] Login as SUPERADMIN - verify all data shown (no filtering)

### Database Tests
- [ ] Run migration V20260118__add_center_id_for_filtering.sql
- [ ] Verify center_id columns added to payments and attendance_records

---

## 5. Future Improvements

1. **More Controllers**: Add `?centerId` support to:
   - EnrollmentController
   - ExamController
   - LeadController (CRM)
   - DepartmentController
   - InvoiceController
   - RefundController
   - StudentFeePlanController

2. **Backend Security**: Add server-side validation to ensure CENTER_MANAGER can only access their assigned center's data (don't just trust frontend)

3. **Audit Trail**: Log when CENTER_MANAGER accesses data to ensure compliance

4. **Center Selector**: For SUPERADMIN, add ability to filter by center from dropdown (optional)

---

## 6. Files Changed Summary

### Backend (6 files)
1. `backend/academy_service/controller/StudentController.java`
2. `backend/academy_service/controller/TeacherController.java`
3. `backend/academy_service/controller/ClassController.java`
4. `backend/identity_service/controller/UserController.java`
5. `backend/payment_service/controller/PaymentController.java`
6. `backend/attendance_service/controller/AttendanceController.java`

### Entities (2 files)
1. `backend/payment_service/entity/Payment.java`
2. `backend/attendance_service/entity/AttendanceRecord.java`

### Repositories (2 files)
1. `backend/payment_service/repository/PaymentRepository.java`
2. `backend/attendance_service/repository/AttendanceRepository.java`

### Services (1 file)
1. `backend/identity_service/service/UserService.java`

### Frontend (21+ files)
1. `frontend/app/hooks/useUserCenter.ts` (NEW)
2. `frontend/app/dashboard/centermanager/page.tsx`
3. `frontend/app/dashboard/superadmin/students/page.tsx`
4. `frontend/app/dashboard/superadmin/teachers/page.tsx`
5. `frontend/app/dashboard/superadmin/classes/page.tsx`
6. `frontend/app/dashboard/superadmin/users/page.tsx`
7. `frontend/app/dashboard/academy/students/page.tsx`
8. `frontend/app/dashboard/academy/classes/page.tsx`
9. `frontend/app/dashboard/academy/courses/page.tsx`
10. `frontend/app/dashboard/academy/enrollments/page.tsx`
11. `frontend/app/dashboard/payments/page.tsx`
12. `frontend/app/dashboard/attendance/page.tsx`
13. `frontend/app/dashboard/crm/page.tsx`
14. `frontend/app/dashboard/finance/page.tsx`
15. `frontend/app/dashboard/finance/invoices/page.tsx`
16. `frontend/app/dashboard/finance/payments/page.tsx`
17. `frontend/app/dashboard/finance/refunds/page.tsx`
18. `frontend/app/dashboard/finance/student-plans/page.tsx`
19. `frontend/app/dashboard/payroll/page.tsx`
20. `frontend/app/dashboard/exams/page.tsx`
21. `frontend/app/dashboard/progress/page.tsx`
22. `frontend/app/dashboard/organization/departments/page.tsx`

### Database (1 file)
1. `database/migrations/V20260118__add_center_id_for_filtering.sql`
