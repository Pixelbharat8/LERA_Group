# 📋 Leave and Attendance Approval System - Complete Guide

## 🏢 System Architecture Overview

### **Center-Based Organization Structure**

```
Chairman/CEO (Global Level)
    ↓
Centers (Multiple Locations)
    ↓
Center Manager/Admin (Per Center)
    ↓
Departments (Per Center)
    ↓
Teachers & Staff (Per Center)
```

---

## 🎯 Current System Structure

### **1. Center Entity**
Location: `backend/identity_service/entity/Center.java`

```
Center:
  - id (UUID)
  - code (unique)
  - name
  - address
  - city, district
  - phone, email
  - managerId (UUID) → Center Manager
  - status (ACTIVE/INACTIVE)
  - capacity
```

### **2. User Entity** 
Location: `backend/identity_service/entity/User.java`

```
User:
  - id (UUID)
  - email
  - fullname
  - phone
  - roleId → Role (TEACHER, STAFF, CENTER_ADMIN, etc.)
  - centerId → Center (Which center they belong to) ✅
  - status (ACTIVE/INACTIVE)
```

### **3. Attendance Exception Entity**
Location: `backend/attendance_service/entity/AttendanceException.java`

```
AttendanceException:
  - id (UUID)
  - studentId/teacherId/staffId
  - exceptionDate
  - exceptionType (LEAVE, SICK, EMERGENCY, LATE_ARRIVAL, EARLY_DEPARTURE)
  - reason
  - supportingDocuments
  - status (PENDING, APPROVED, REJECTED)
  - requestedBy (who requested)
  - approvedBy (who approved)
  - approvedAt
  - rejectionReason
```

---

## ✅ How Leave System Currently Works

### **Leave Request Flow:**

1. **Teacher/Staff Applies for Leave**
   - Submits leave request via dashboard
   - Provides: Date, Type, Reason, Supporting Documents
   - Status: PENDING

2. **Leave Goes to Approver**
   - **Center Admin** of their center sees the request
   - Reviews reason and documents
   - Can APPROVE or REJECT

3. **After Approval:**
   - Status changes to APPROVED
   - Marked as excused absence
   - Does not negatively impact attendance record

### **Attendance Marking Flow:**

1. **Daily Attendance**
   - Teacher/TA marks students present/absent
   - Teacher attendance tracked by Center Admin
   - Staff attendance tracked by Center Admin/HR

2. **Leave Exception Check**
   - System checks if person has approved leave for that date
   - If yes: Mark as "EXCUSED" instead of "ABSENT"
   - If no: Mark as "ABSENT" (affects record)

---

## 🔐 Approval Hierarchy

### **Who Approves What:**

| Leave Type | Requested By | Approved By |
|------------|--------------|-------------|
| **Teacher Leave** | Teacher | Center Admin of that center |
| **Staff Leave** | Staff | Center Admin of that center |
| **Center Admin Leave** | Center Admin | Director/CEO |
| **Student Leave** | Parent | Teacher → Center Admin |

### **Center-Based Permissions:**

✅ **CENTER_ADMIN** can approve:
- Teachers in their center
- Staff in their center
- Students in their center

✅ **DIRECTOR/CEO** can approve:
- Center Admins
- View all centers

❌ **CENTER_ADMIN** cannot approve:
- Teachers/Staff from other centers
- Other Center Admins

---

## 🏗️ Implementation Needed

### **Step 1: Add Center ID to Attendance Service**

The attendance service needs to track which center each attendance/leave belongs to.

**Update AttendanceException Entity:**
```java
// Add this field
@Column(name = "center_id")
private UUID centerId;
```

**Update AttendanceRecord Entity:**
```java
// Add this field
@Column(name = "center_id")
private UUID centerId;
```

### **Step 2: Create Leave Management Entity**

**New Entity: `TeacherStaffLeave.java`**
```java
@Entity
@Table(name = "teacher_staff_leaves")
public class TeacherStaffLeave {
    private UUID id;
    private UUID userId; // Teacher or Staff ID
    private UUID centerId; // Which center
    private String userType; // TEACHER, STAFF
    private LocalDate leaveDate;
    private LocalDate endDate; // for multi-day leave
    private String leaveType; // SICK_LEAVE, CASUAL_LEAVE, EMERGENCY
    private String reason;
    private String documents; // JSON array of document URLs
    private String status; // PENDING, APPROVED, REJECTED
    private UUID requestedBy; // Self
    private LocalDateTime requestedAt;
    private UUID approvedBy; // Center Admin
    private LocalDateTime approvedAt;
    private String rejectionReason;
    private Boolean isPaid; // Paid/Unpaid leave
    private Integer daysCount;
}
```

### **Step 3: Create Leave Request APIs**

**Location: `backend/attendance_service/controller/LeaveController.java`**

```java
// Apply for leave
POST /api/leaves/apply
Body: {
  "userId": "uuid",
  "centerId": "uuid",
  "userType": "TEACHER",
  "leaveDate": "2024-12-30",
  "endDate": "2024-12-31",
  "leaveType": "SICK_LEAVE",
  "reason": "Medical reason",
  "documents": ["url1", "url2"]
}

// Get pending leaves for Center Admin
GET /api/leaves/pending?centerId={centerId}

// Approve leave
PUT /api/leaves/{leaveId}/approve
Body: {
  "approvedBy": "uuid",
  "isPaid": true
}

// Reject leave
PUT /api/leaves/{leaveId}/reject
Body: {
  "rejectionReason": "Reason for rejection"
}

// Get leaves by center
GET /api/leaves/center/{centerId}

// Get leaves by user
GET /api/leaves/user/{userId}
```

### **Step 4: Update Attendance Dashboard**

**Add Center-Based Filtering:**

```typescript
// Frontend: Center selection first
1. Select Center → Shows departments in that center
2. Select Department → Shows teachers/staff in that department
3. View/Mark Attendance → Only for selected center
4. Approve Leaves → Only for selected center
```

---

## 📊 Frontend Dashboard Structure

### **Attendance Dashboard (Center Admin)**

Location: `/dashboard/attendance`

**Layout:**
```
┌──────────────────────────────────────────────┐
│ 🏢 Select Center: [Dropdown]                 │
├──────────────────────────────────────────────┤
│ Tabs: [Attendance] [Leaves] [Reports]        │
├──────────────────────────────────────────────┤
│                                               │
│ ✅ ATTENDANCE Tab:                            │
│   - Date picker                               │
│   - Department filter                         │
│   - Teacher/Staff list with status           │
│   - Mark Present/Absent/Leave                │
│                                               │
│ 📝 LEAVES Tab:                                │
│   - Pending Approvals (badge count)          │
│   - Leave History                            │
│   - Leave Balance                            │
│   - Approve/Reject actions                   │
│                                               │
│ 📊 REPORTS Tab:                               │
│   - Attendance summary by center             │
│   - Leave analytics                          │
│   - Export options                           │
└──────────────────────────────────────────────┘
```

### **Leave Request Flow (Teacher/Staff)**

Location: `/dashboard/teacher/leave` or `/dashboard/staff/leave`

**Features:**
- Apply for leave
- View leave history
- View leave balance
- Upload supporting documents
- Track approval status

---

## 🗄️ Database Schema

### **Required Tables:**

**1. centers** ✅ (Already exists in identity_service)
```sql
CREATE TABLE centers (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE,
  name VARCHAR(255),
  manager_id UUID,
  status VARCHAR(20),
  ...
);
```

**2. users** ✅ (Already exists with centerId)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  fullname VARCHAR(255),
  role_id UUID,
  center_id UUID, -- ✅ Already exists
  status VARCHAR(20),
  ...
);
```

**3. teacher_staff_leaves** ⚠️ (Needs to be created)
```sql
CREATE TABLE teacher_staff_leaves (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL, -- References users.id
  center_id UUID NOT NULL, -- References centers.id
  user_type VARCHAR(20), -- TEACHER, STAFF
  leave_date DATE NOT NULL,
  end_date DATE,
  leave_type VARCHAR(50),
  reason TEXT,
  documents TEXT, -- JSON
  status VARCHAR(20) DEFAULT 'PENDING',
  requested_by UUID,
  requested_at TIMESTAMP,
  approved_by UUID,
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  is_paid BOOLEAN DEFAULT true,
  days_count INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX idx_leaves_center ON teacher_staff_leaves(center_id);
CREATE INDEX idx_leaves_user ON teacher_staff_leaves(user_id);
CREATE INDEX idx_leaves_status ON teacher_staff_leaves(status);
CREATE INDEX idx_leaves_date ON teacher_staff_leaves(leave_date);
```

**4. attendance_records** (Add center_id)
```sql
ALTER TABLE attendance_records ADD COLUMN center_id UUID;
CREATE INDEX idx_attendance_center ON attendance_records(center_id);
```

**5. attendance_exceptions** (Add center_id)
```sql
ALTER TABLE attendance_exceptions ADD COLUMN center_id UUID;
CREATE INDEX idx_exceptions_center ON attendance_exceptions(center_id);
```

---

## 🚀 Implementation Steps

### **Phase 1: Backend Setup**

1. ✅ **Create LeaveManagement Entity** (teacher_staff_leaves table)
2. ✅ **Add centerId to AttendanceRecord and AttendanceException**
3. ✅ **Create LeaveRepository** (JPA interface)
4. ✅ **Create LeaveService** (Business logic)
5. ✅ **Create LeaveController** (REST APIs)

### **Phase 2: Frontend Setup**

1. ✅ **Create Leave Request Page** (`/dashboard/teacher/leave`)
2. ✅ **Create Leave Approval Page** (`/dashboard/attendance/leaves`)
3. ✅ **Add Center Filter** to Attendance Dashboard
4. ✅ **Update Attendance Marking** to show leave status
5. ✅ **Add Leave Balance Display**

### **Phase 3: Integration**

1. ✅ **Connect Leave System with Attendance**
2. ✅ **Auto-mark as EXCUSED if approved leave exists**
3. ✅ **Send notifications** (email/SMS)
4. ✅ **Generate reports**

---

## 📋 API Endpoints Summary

### **Leave Management APIs:**

```
POST   /api/leaves/apply          - Apply for leave
GET    /api/leaves/user/{userId}  - Get user's leaves
GET    /api/leaves/center/{centerId} - Get center's leaves
GET    /api/leaves/pending?centerId={id} - Pending approvals
PUT    /api/leaves/{id}/approve   - Approve leave
PUT    /api/leaves/{id}/reject    - Reject leave
DELETE /api/leaves/{id}            - Cancel leave request
GET    /api/leaves/balance/{userId} - Get leave balance
```

### **Attendance APIs (Updated):**

```
POST   /api/attendance/mark       - Mark attendance (with center check)
GET    /api/attendance/center/{centerId} - Get center attendance
GET    /api/attendance/teacher/{teacherId} - Get teacher attendance
GET    /api/attendance/staff/{staffId} - Get staff attendance
GET    /api/attendance/exceptions/{centerId} - Get exceptions by center
```

### **Center Management APIs:**

```
GET    /api/centers               - Get all centers
GET    /api/centers/{id}          - Get center details
GET    /api/users/center/{centerId} - Get users by center ✅ (Already exists)
```

---

## 🎯 User Stories

### **As a Teacher:**
- I can apply for leave through my dashboard
- I can see my leave history and balance
- I receive notification when leave is approved/rejected
- My attendance shows as "EXCUSED" on approved leave days

### **As a Center Admin:**
- I see only my center's teachers and staff
- I can approve/reject leave requests for my center
- I can view attendance reports for my center
- I cannot see or manage other centers' data

### **As a CEO/Director:**
- I can view all centers
- I can switch between centers
- I can see aggregated attendance reports
- I can approve center admin leaves

---

## 🔄 Workflow Example

### **Scenario: Teacher Requests Leave**

1. **Teacher (John at Center A):**
   - Goes to `/dashboard/teacher/leave`
   - Clicks "Request Leave"
   - Fills form: Date (Jan 5), Type (Sick Leave), Reason, Upload medical certificate
   - Submits → Status: PENDING

2. **System:**
   - Creates leave record with:
     - userId = John's ID
     - centerId = Center A ID
     - status = PENDING
   - Sends notification to Center A Admin

3. **Center A Admin (Sarah):**
   - Logs into `/dashboard/attendance/leaves`
   - Sees Center A filter (only her center)
   - Sees John's pending leave request
   - Reviews reason and documents
   - Clicks "Approve" → Marks as Paid Leave
   - System updates: status = APPROVED, approvedBy = Sarah's ID

4. **On January 5:**
   - Attendance marking happens
   - System checks: John has approved leave for Jan 5
   - Automatically marks John as "EXCUSED" (not ABSENT)
   - John's attendance rate not affected

---

## ⚠️ Important Notes

### **Center Isolation:**
- ✅ Each center operates independently
- ✅ Center Admins see only their center data
- ✅ Teachers/Staff belong to one center
- ✅ Attendance records tagged with centerId

### **Approval Rules:**
- Teachers → Approved by Center Admin
- Staff → Approved by Center Admin/HR
- Center Admin → Approved by Director
- Multi-day leaves count all days

### **Leave Balance:**
- Track annual leave quota (e.g., 12 days/year)
- Deduct from balance on approval
- Show remaining balance in dashboard

---

## 🎉 Benefits of This System

✅ **Center-based organization** - Clear separation of centers
✅ **Proper approval hierarchy** - Center Admin → Director → CEO
✅ **Leave tracking** - Know who's on leave in advance
✅ **Automated attendance** - Auto-mark excused absences
✅ **Reporting** - Generate center-wise reports
✅ **Audit trail** - Track who approved what and when
✅ **Scalability** - Easy to add new centers

---

## 📝 Next Actions Required

### **Immediate (High Priority):**

1. ✅ Create `TeacherStaffLeave` entity in attendance service
2. ✅ Add `centerId` column to attendance tables
3. ✅ Create leave management APIs
4. ✅ Create leave request frontend page
5. ✅ Create leave approval frontend page

### **Soon (Medium Priority):**

1. Add center filter to existing attendance pages
2. Implement leave balance tracking
3. Add notification system
4. Create attendance reports by center

### **Later (Nice to Have):**

1. SMS notifications for leave approval
2. Email reminders for pending approvals
3. Leave calendar view
4. Export reports to Excel/PDF

---

**System ready for:** Center-based leave and attendance management! 🚀

Would you like me to implement any of these features now?
