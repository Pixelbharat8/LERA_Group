# 🚨 LERA Group - Critical Gaps & TODO List
**Priority Action Items - January 7, 2026**

---

## 🔴 CRITICAL - Must Fix Immediately

### 1. Rule Engine Service (0% Complete)
**Location:** `/backend/rule_engine/`
**Issue:** Only has HelloController, no actual implementation

**Required:**
```
- RuleController.java
- Rule.java (entity)
- RuleCondition.java (entity)
- RuleAction.java (entity)
- RuleRepository.java
- RuleService.java
```

---

### 2. Student Attendance APIs Missing
**Location:** `/backend/attendance_service/`
**Issue:** Only teacher attendance exists, no student attendance!

**Required Endpoints:**
```
POST /api/attendance/students              # Mark student attendance
GET  /api/attendance/students/{id}         # Get student attendance
GET  /api/attendance/class/{classId}       # Get class attendance
GET  /api/attendance/students/{id}/report  # Attendance report
```

---

### 3. Library Service (0% Complete)
**Location:** `/backend/library_service/`
**Issue:** Empty service, but entities exist in Academy

**Required Controllers:**
- BookController (move from Academy or duplicate)
- BookBorrowingController
- BookReservationController
- LibraryFineController
- LibraryInventoryController

---

### 4. Transport Service (5% Complete)
**Location:** `/backend/transport_service/`
**Issue:** Only Vehicle entity exists

**Required Controllers:**
- RouteController
- RouteStopController
- DriverController
- ScheduleController
- StudentTransportController
- TransportAttendanceController
- GpsTrackingController

---

### 5. Empty Entity Files
**Files with 0 bytes:**
```
/backend/academy_service/.../entity/CmsPage.java (EMPTY!)
/backend/payment_service/.../entity/FeeReceipt.java (EMPTY!)
```

---

## 🟡 HIGH PRIORITY - Next Sprint

### 6. Academy Service Missing Controllers (20+)

**Parent Management:**
```bash
# Create these controllers:
- ParentProfileController.java
- StudentParentController.java
```

**Class Schedule Management:**
```bash
- ClassScheduleController.java
- ClassSessionController.java
- SessionAttendanceController.java
```

**Course Content Management:**
```bash
- CourseLessonController.java
- CourseModuleController.java
- CourseMaterialController.java
```

**Document Management:**
```bash
- StudentDocumentController.java
- TeacherDocumentController.java
```

**Transport (in Academy):**
```bash
- VehicleController.java
- TransportDriverController.java
- TransportScheduleController.java
- StudentTransportController.java
```

---

### 7. Payroll Service Missing Controllers

```bash
# Required:
- BonusController.java
- DeductionController.java
- PayrollCycleController.java
- SalaryComponentController.java
- SalaryPayoutController.java
- TaxSettingsController.java
- TeacherOvertimeController.java
```

---

### 8. Payment Gateway Integration

**Current State:** No real payment gateway
**Required:**
- Razorpay SDK integration
- Webhook handlers
- Payment status tracking
- Refund processing

---

### 9. Identity Service Missing Features

```bash
# Required Controllers:
- LoginHistoryController.java
- FeatureFlagController.java
- TenantSettingsController.java
```

---

### 10. AI Gateway Incomplete

**Missing:**
- Actual OpenAI/Claude integration (currently returns mock data)
- Assessment generation APIs
- Learning path APIs

---

## 📊 Service Completion Status

| Service | Completion | Status |
|---------|------------|--------|
| Identity Service | 85% | ✅ Good |
| Academy Service | 55% | ⚠️ Many gaps |
| Payment Service | 80% | ✅ Good |
| Payroll Service | 50% | ⚠️ Incomplete |
| Attendance Service | 60% | ⚠️ Missing student |
| Connect Service | 90% | ✅ Excellent |
| AI Gateway | 40% | ⚠️ Incomplete |
| Rule Engine | 0% | 🔴 Not started |
| Library Service | 0% | 🔴 Not started |
| Transport Service | 5% | 🔴 Almost nothing |
| Hostel Service | 0% | 🔴 Not started |
| Bookstore Service | 0% | 🔴 Not started |

---

## 🛠️ Quick Commands to Check

```bash
# Check which services are running
curl http://localhost:8081/hello  # Identity
curl http://localhost:8082/hello  # Academy
curl http://localhost:8083/hello  # Payment
curl http://localhost:8084/hello  # Payroll
curl http://localhost:8085/hello  # Attendance
curl http://localhost:8086/hello  # Connect
curl http://localhost:8087/hello  # AI Gateway
curl http://localhost:8088/hello  # Rule Engine

# Count entities vs controllers
ls backend/academy_service/src/main/java/com/lera/academy_service/entity/ | wc -l
ls backend/academy_service/src/main/java/com/lera/academy_service/controller/ | wc -l
```

---

## 📝 Database Tables Without APIs

These tables exist but have no REST endpoints:

1. `audit_logs` - Should have read-only API
2. `badges` - Gamification badges
3. `student_badges` - Badge assignments
4. `fee_structures` - Fee structure definitions
5. `lead_followups` - CRM followups
6. `lead_sources` - Lead source tracking
7. `leaderboard` - Gamification leaderboard
8. `makeup_sessions` - Makeup class scheduling
9. `student_progress` - Progress tracking
10. `trial_classes` - Trial class bookings
11. `user_sessions` - Active session tracking

---

## 🎯 Recommended Priority Order

1. **Student Attendance** - Core functionality missing
2. **Parent Profile/StudentParent** - Parent portal won't work
3. **ClassSchedule/ClassSession** - Timetable features broken
4. **Rule Engine basics** - For business rules
5. **Library Service** - Commonly requested
6. **Payroll Controllers** - HR module incomplete
7. **Transport Service** - Transport features broken

---

**Full Analysis:** See `SERVICE_GAP_ANALYSIS.md`
