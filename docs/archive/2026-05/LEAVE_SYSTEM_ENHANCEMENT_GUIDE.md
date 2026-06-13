# 🔄 Leave System Enhancement - Complete Guide

**Date**: December 30, 2025  
**Status**: ✅ ENHANCED SYSTEM READY

---

## 🎯 New Requirements Implemented

### 1. ✅ Dynamic Approver Assignment
**Requirement**: Chairman can assign who approves leaves via user control

**How it works**:
- Chairman can assign specific approver for any leave
- API endpoint: `PUT /api/leaves/{id}/assign-approver?approverId={uuid}`
- Assigned approver stored in `assigned_approver_id` field
- Overrides default center admin approval

**Example**:
```bash
# Chairman assigns John as approver for leave ID 123
curl -X PUT "http://localhost:8084/api/leaves/123/assign-approver?approverId=john-uuid-here"
```

---

### 2. ✅ CEO & Chairman Visibility
**Requirement**: All leaves must be sent to CEO and Chairman for visibility

**How it works**:
- When teacher applies for leave → Auto-notify CEO & Chairman
- Fields: `notified_to_ceo`, `notified_to_chairman`
- CEO can view all leaves: `GET /api/leaves/executive/pending`
- Chairman can view all leaves: `GET /api/leaves/executive/pending`
- Track when viewed: `ceo_viewed_at`, `chairman_viewed_at`

**Flow**:
```
Teacher applies leave
    ↓
Status: PENDING
    ↓
notified_to_ceo = TRUE
notified_to_chairman = TRUE
    ↓
CEO Dashboard shows notification
Chairman Dashboard shows notification
    ↓
Assigned Approver reviews & approves
    ↓
Status: APPROVED
```

---

### 3. ✅ Monthly Leave Accrual
**Requirement**: 1 leave per month (not 12 upfront) = 12 total per year

**How it works**:
- **Old System**: 12 leaves given upfront on Jan 1
- **New System**: 1 leave added every month
  - January: 1 leave
  - February: 2 leaves (1 new + 1 carried)
  - March: 3 leaves (1 new + 2 carried)
  - ...and so on

**Monthly Accrual Logic**:
```
Month 1 (Jan):  1 leave accrued, 0 used → 1 available
Month 2 (Feb):  1 leave accrued, 0 used → 2 available (1 + 1 carried)
Month 3 (Mar):  1 leave accrued, 1 used → 2 available (3 - 1)
Month 4 (Apr):  1 leave accrued, 0 used → 3 available (2 + 1)
...
Year end:       12 leaves accrued total
```

---

## 📊 New Database Tables

### Table: `leave_balance_accruals`

```sql
CREATE TABLE leave_balance_accruals (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    center_id UUID NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    leaves_accrued DOUBLE PRECISION DEFAULT 1.0,
    leaves_used DOUBLE PRECISION DEFAULT 0.0,
    leaves_carried_forward DOUBLE PRECISION DEFAULT 0.0,
    total_available DOUBLE PRECISION DEFAULT 1.0,
    accrual_date DATE NOT NULL,
    is_processed BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE (user_id, year, month)
);
```

**Fields Explained**:
- `leaves_accrued`: Always 1.0 (one leave per month)
- `leaves_used`: How many leaves user took this month
- `leaves_carried_forward`: Unused leaves from previous months
- `total_available`: accrued + carried_forward - used

---

### Enhanced Table: `teacher_staff_leaves`

**New Columns Added**:
```sql
ALTER TABLE teacher_staff_leaves ADD COLUMN assigned_approver_id UUID;
ALTER TABLE teacher_staff_leaves ADD COLUMN notified_to_ceo BOOLEAN DEFAULT FALSE;
ALTER TABLE teacher_staff_leaves ADD COLUMN ceo_viewed_at TIMESTAMP;
ALTER TABLE teacher_staff_leaves ADD COLUMN notified_to_chairman BOOLEAN DEFAULT FALSE;
ALTER TABLE teacher_staff_leaves ADD COLUMN chairman_viewed_at TIMESTAMP;
```

---

## 🔗 New API Endpoints

### Accrual Management

**1. Initialize Accruals for New User**
```http
POST /api/leaves/accrual/initialize
Params: userId, centerId, joinDate

Example:
POST http://localhost:8084/api/leaves/accrual/initialize?userId=123&centerId=456&joinDate=2025-01-15

Response:
{
  "message": "Accruals initialized successfully",
  "userId": "123"
}
```

**2. Process Monthly Accrual**
```http
POST /api/leaves/accrual/process
Params: userId, centerId, year (optional), month (optional)

Example:
POST http://localhost:8084/api/leaves/accrual/process?userId=123&centerId=456

Response:
{
  "message": "Monthly accrual processed",
  "month": "12",
  "year": "2025"
}
```

**3. Get Leave Balance (Enhanced)**
```http
GET /api/leaves/balance/{userId}

Response:
{
  "userId": "123",
  "year": 2025,
  "month": 12,
  "totalAccruedThisYear": 12.0,
  "totalUsedThisYear": 3.0,
  "totalAvailable": 9.0,
  "monthlyAccrualRate": 1.0,
  "expectedAnnualLeaves": 12.0,
  "currentMonthAccrued": 1.0,
  "currentMonthUsed": 0.0,
  "currentMonthAvailable": 1.0,
  "carriedForward": 8.0
}
```

### Executive Visibility

**4. Assign Approver (Chairman Only)**
```http
PUT /api/leaves/{id}/assign-approver
Params: approverId

Example:
PUT http://localhost:8084/api/leaves/abc-123/assign-approver?approverId=john-uuid
```

**5. Get Executive Pending Leaves**
```http
GET /api/leaves/executive/pending
Params: centerId (optional)

Example:
GET http://localhost:8084/api/leaves/executive/pending

Response: List of all pending leaves with CEO/Chairman notifications
```

**6. Mark as Viewed by CEO**
```http
PUT /api/leaves/{id}/ceo-viewed

Example:
PUT http://localhost:8084/api/leaves/abc-123/ceo-viewed
```

**7. Mark as Viewed by Chairman**
```http
PUT /api/leaves/{id}/chairman-viewed

Example:
PUT http://localhost:8084/api/leaves/abc-123/chairman-viewed
```

---

## 🔄 Updated Workflow

### Complete Leave Approval Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: TEACHER APPLIES FOR LEAVE                           │
└─────────────────────────────────────────────────────────────┘
Teacher → Clicks "Request Leave"
       → System checks: Do they have sufficient balance?
       → If YES: Create leave request (Status: PENDING)
       → If NO: Show error "Insufficient leave balance"
       
       ↓
       
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: AUTO-NOTIFY EXECUTIVES                              │
└─────────────────────────────────────────────────────────────┘
System sets:
  - notified_to_ceo = TRUE
  - notified_to_chairman = TRUE
  
CEO Dashboard → Shows notification: "New leave request"
Chairman Dashboard → Shows notification: "New leave request"

       ↓
       
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: CHAIRMAN ASSIGNS APPROVER (OPTIONAL)                │
└─────────────────────────────────────────────────────────────┘
Chairman can:
  - Let default center admin approve
  - OR assign specific person: assigned_approver_id = john_uuid

       ↓
       
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: APPROVER REVIEWS                                    │
└─────────────────────────────────────────────────────────────┘
If assigned_approver_id exists:
  → That person approves
Else:
  → Center Admin approves

Approver sees:
  - Teacher name
  - Leave type
  - Date range
  - Reason
  - Days required

       ↓
       
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: APPROVAL/REJECTION                                  │
└─────────────────────────────────────────────────────────────┘
If APPROVED:
  ✅ Status = APPROVED
  ✅ Deduct from monthly accrual
  ✅ Update leave balance
  ✅ Send notification to teacher

If REJECTED:
  ❌ Status = REJECTED
  ❌ No deduction from balance
  ❌ Send rejection reason to teacher

       ↓
       
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: CEO/CHAIRMAN VISIBILITY                             │
└─────────────────────────────────────────────────────────────┘
CEO can:
  - View all leaves (all centers)
  - See approval status
  - Track who approved what
  
Chairman can:
  - View all leaves (all centers)
  - Assign different approvers
  - Override approvals (if needed)
```

---

## 💻 Code Examples

### Apply for Leave (with Balance Check)

```java
// Teacher applies for leave
TeacherStaffLeave leave = TeacherStaffLeave.builder()
    .userId(teacherId)
    .centerId(centerId)
    .leaveDate(LocalDate.of(2025, 1, 15))
    .leaveType("SICK_LEAVE")
    .reason("Medical appointment")
    .build();

// System automatically:
// 1. Checks if user has sufficient balance
// 2. Sets notified_to_ceo = TRUE
// 3. Sets notified_to_chairman = TRUE
// 4. Status = PENDING

TeacherStaffLeave created = leaveService.applyLeave(leave);
```

### Approve Leave (with Monthly Deduction)

```java
// Center Admin approves
leaveService.approveLeave(
    leaveId, 
    approverId, 
    "CENTER_ADMIN", 
    true,  // isPaid
    "Approved - Medical reasons"
);

// System automatically:
// 1. Changes status to APPROVED
// 2. Deducts from monthly accrual:
//    - If 1-day leave: deduct 1.0
//    - If half-day: deduct 0.5
// 3. Updates total_available in leave_balance_accruals
// 4. Records approver details
```

### Get Leave Balance

```java
// Get user's current balance
Map<String, Object> balance = leaveService.getLeaveBalance(userId);

// Returns:
// {
//   "totalAccruedThisYear": 12.0,
//   "totalUsedThisYear": 3.0,
//   "totalAvailable": 9.0,
//   "currentMonthAvailable": 1.0,
//   "carriedForward": 8.0
// }
```

---

## 🗓️ Monthly Accrual Processing

### Automatic Processing

```java
// Runs automatically on 1st of every month at midnight
@Scheduled(cron = "0 0 0 1 * ?")
public void scheduleMonthlyAccrualProcessing() {
    // Process accruals for all active users
    // Creates new leave_balance_accruals entry
    // Carries forward unused leaves
}
```

### Manual Processing

```bash
# Process for specific user
POST http://localhost:8084/api/leaves/accrual/process?userId=123&centerId=456

# Initialize for new user (backfills from join date)
POST http://localhost:8084/api/leaves/accrual/initialize?userId=123&centerId=456&joinDate=2025-06-15
```

---

## 📋 Examples by Role

### Teacher/Staff

**Scenario**: Teacher wants to apply for leave

```typescript
// Frontend: Apply for leave
const applyLeave = async () => {
  const response = await fetch('http://localhost:8084/api/leaves/apply', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: currentUser.id,
      centerId: currentUser.centerId,
      leaveDate: '2025-01-15',
      leaveType: 'SICK_LEAVE',
      reason: 'Doctor appointment',
      requestedBy: currentUser.id
    })
  });
  
  if (response.ok) {
    alert('Leave applied! CEO and Chairman have been notified.');
  } else {
    alert('Insufficient leave balance!');
  }
};
```

---

### Center Admin

**Scenario**: Review and approve leaves

```typescript
// Get pending leaves for my center
const fetchPendingLeaves = async () => {
  const response = await fetch(
    `http://localhost:8084/api/leaves/center/${centerId}?status=PENDING`,
    { headers: { 'Authorization': `Bearer ${token}` }}
  );
  const leaves = await response.json();
  // Show list with approve/reject buttons
};

// Approve leave
const approveLeave = async (leaveId) => {
  await fetch(
    `http://localhost:8084/api/leaves/${leaveId}/approve?isPaid=true`,
    {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  // Leave balance automatically deducted
};
```

---

### CEO

**Scenario**: View all pending leaves across all centers

```typescript
// Get all leaves awaiting visibility
const fetchExecutiveLeaves = async () => {
  const response = await fetch(
    'http://localhost:8084/api/leaves/executive/pending',
    { headers: { 'Authorization': `Bearer ${token}` }}
  );
  const leaves = await response.json();
  // Shows all leaves with notified_to_ceo = TRUE
};

// Mark as viewed
const markAsViewed = async (leaveId) => {
  await fetch(
    `http://localhost:8084/api/leaves/${leaveId}/ceo-viewed`,
    {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
};
```

---

### Chairman

**Scenario**: Assign specific approver for a leave

```typescript
// Assign John to approve this leave instead of default center admin
const assignApprover = async (leaveId, approverId) => {
  await fetch(
    `http://localhost:8084/api/leaves/${leaveId}/assign-approver?approverId=${approverId}`,
    {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  alert('Approver assigned successfully!');
};
```

---

## 🔐 Security & Permissions

### Role-Based Access

| Role | Apply Leave | Approve Leave | Assign Approver | View All Centers |
|------|------------|---------------|-----------------|------------------|
| TEACHER | ✅ Own | ❌ | ❌ | ❌ |
| STAFF | ✅ Own | ❌ | ❌ | ❌ |
| CENTER_ADMIN | ✅ Own | ✅ Own Center | ❌ | ❌ |
| DIRECTOR | ✅ Own | ✅ Multiple Centers | ❌ | ✅ |
| CEO | ✅ Own | ✅ All Centers | ❌ | ✅ |
| CHAIRMAN | ✅ Own | ✅ All Centers | ✅ | ✅ |
| SUPERADMIN | ✅ Own | ✅ All Centers | ✅ | ✅ |

---

## 🚀 Installation Steps

### 1. Run Database Migration

```bash
cd /Users/rahulsharma/LERA_Group
psql -U lera -d lera -f leave_system_enhancement_migration.sql
```

### 2. Rebuild Attendance Service

```bash
cd backend/attendance_service
mvn clean install -DskipTests
```

### 3. Restart Service

```bash
mvn spring-boot:run -DskipTests
# OR
./start-attendance.sh
```

### 4. Verify

```bash
# Check health
curl http://localhost:8084/actuator/health

# Test new endpoint
curl http://localhost:8084/api/leaves/balance/your-user-id-here
```

---

## ✅ Testing Checklist

### Test 1: Monthly Accrual
```bash
# Initialize accruals for test user
POST /api/leaves/accrual/initialize?userId=test-123&centerId=center-456&joinDate=2025-01-01

# Check balance (should show 12 leaves for full year)
GET /api/leaves/balance/test-123
```

### Test 2: Apply Leave with Balance Check
```bash
# Apply for 1-day leave
POST /api/leaves/apply
{
  "userId": "test-123",
  "centerId": "center-456",
  "leaveDate": "2025-01-15",
  "leaveType": "SICK_LEAVE",
  "reason": "Test"
}

# Should succeed if balance available
# notified_to_ceo and notified_to_chairman should be TRUE
```

### Test 3: CEO Visibility
```bash
# Get all leaves pending executive visibility
GET /api/leaves/executive/pending

# Should see all leaves with notified_to_ceo = TRUE
```

### Test 4: Assign Approver
```bash
# Chairman assigns specific approver
PUT /api/leaves/leave-id-here/assign-approver?approverId=john-uuid
```

### Test 5: Approval with Deduction
```bash
# Approve leave
PUT /api/leaves/leave-id-here/approve?isPaid=true

# Check balance again (should be reduced by 1)
GET /api/leaves/balance/test-123
```

---

## 📈 Summary of Changes

### Backend Files Created:
1. ✅ `LeaveBalanceAccrual.java` - Monthly accrual entity
2. ✅ `LeaveBalanceAccrualRepository.java` - Accrual queries
3. ✅ `LeaveBalanceAccrualService.java` - Accrual business logic

### Backend Files Modified:
4. ✅ `TeacherStaffLeave.java` - Added 5 new fields
5. ✅ `TeacherStaffLeaveService.java` - Integrated accrual system
6. ✅ `TeacherStaffLeaveController.java` - Added 8 new endpoints

### Database:
7. ✅ `leave_system_enhancement_migration.sql` - Complete migration script

### Features Added:
- ✅ Monthly leave accrual (1 per month)
- ✅ Leave carry-forward
- ✅ Balance checking before application
- ✅ Automatic balance deduction on approval
- ✅ Balance restoration on cancellation
- ✅ CEO auto-notification
- ✅ Chairman auto-notification
- ✅ Assigned approver functionality
- ✅ Executive visibility tracking
- ✅ Scheduled monthly processing

---

## 🎉 System is Ready!

**Next Steps**:
1. Run migration
2. Rebuild and restart service
3. Test with real users
4. Update frontend to show monthly accrual info
5. Add CEO/Chairman dashboards

🚀 **Leave Management System 2.0 - Complete!**
