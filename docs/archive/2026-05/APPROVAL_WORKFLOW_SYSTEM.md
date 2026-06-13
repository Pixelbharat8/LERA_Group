# 🔐 Approval Workflow System - COMPLETE

## 🎯 System Overview

**Admin/Manager Role**: Can add teachers and students, but they require Super Admin approval  
**Super Admin Role**: "God Mode" - Can see everything, approve/reject requests, and bypass approval workflow

---

## 📊 Database Structure

### New Tables Created:

#### 1. **approval_requests** Table
Tracks all approval requests across the system.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| entity_type | VARCHAR(50) | 'USER', 'STUDENT', 'TEACHER' |
| entity_id | UUID | ID of the entity being requested |
| request_type | VARCHAR(50) | 'CREATE', 'UPDATE', 'DELETE', 'ACTIVATION' |
| requested_by | UUID | User who made the request |
| requested_at | TIMESTAMP | When request was made |
| approval_status | VARCHAR(20) | 'PENDING', 'APPROVED', 'REJECTED' |
| approved_by | UUID | Super Admin who approved/rejected |
| approved_at | TIMESTAMP | When approved/rejected |
| rejection_reason | TEXT | Reason for rejection |
| request_data | JSONB | Original data submitted |
| changes_summary | TEXT | Human-readable summary |

#### 2. **approval_comments** Table
Comments/notes on approval requests for collaboration.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| approval_request_id | UUID | Related approval request |
| user_id | UUID | User who commented |
| comment | TEXT | Comment text |
| created_at | TIMESTAMP | Comment timestamp |

### Updated Existing Tables:

#### **users** Table - Added Columns:
- `approval_status` - PENDING, APPROVED, REJECTED
- `requested_by` - Who created this user
- `requested_at` - When request was made
- `approved_by` - Super Admin who approved
- `approved_at` - Approval timestamp
- `rejection_reason` - Why rejected

#### **students** Table - Added Same Columns
#### **teachers** Table - Added Same Columns

---

## 🔄 Approval Workflow

### Flow Diagram:

```
┌─────────────────┐
│ Admin/Manager   │
│ Creates Teacher │
│ or Student      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Status: PENDING         │
│ State: INACTIVE         │
│ Approval Request Created│
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Super Admin Dashboard    │
│ - View all pending       │
│ - Review details         │
│ - Add comments           │
└────────┬─────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌──────────┐
│ APPROVE │ │ REJECT   │
└────┬────┘ └────┬─────┘
     │           │
     ▼           ▼
┌─────────┐ ┌──────────────┐
│ ACTIVE  │ │ INACTIVE     │
│ User    │ │ + Reason     │
└─────────┘ └──────────────┘
```

### Role-Based Behavior:

#### **ADMIN / MANAGER**:
- ✅ Can create users, teachers, students
- ✅ Records are created with `status='INACTIVE'` and `approval_status='PENDING'`
- ✅ Approval request automatically created
- ❌ Cannot activate without Super Admin approval
- ✅ Can view their own pending requests
- ✅ Can add comments to requests

#### **SUPER ADMIN**:
- ✅ **GOD MODE** - Full access to everything
- ✅ Can create users/teachers/students (auto-approved, active immediately)
- ✅ Can approve/reject pending requests
- ✅ Can view all approval requests (pending, approved, rejected)
- ✅ Can see who requested what and when
- ✅ Can add rejection reasons
- ✅ Can override any approval status
- ✅ Can view approval history and analytics

---

## 📋 SQL Views Created

### 1. **vw_pending_approvals**
Shows all pending approval requests for Super Admin dashboard.

```sql
SELECT * FROM vw_pending_approvals;
```

Returns:
- request_id
- entity_type (USER/STUDENT/TEACHER)
- entity_name
- entity_email
- requested_by_name
- requested_by_email
- requested_at
- changes_summary

### 2. **vw_approval_history**
Shows approval/rejection history.

```sql
SELECT * FROM vw_approval_history WHERE approval_status = 'APPROVED';
```

Returns:
- request_id
- entity_type
- entity_name
- requested_by_name
- approved_by_name
- approved_at
- rejection_reason (if rejected)

---

## 🚀 API Endpoints Needed

### For Identity Service:

```java
// Approval Management Endpoints (Super Admin only)
GET    /api/approvals/pending              - Get all pending requests
GET    /api/approvals/history               - Get approval history
GET    /api/approvals/{id}                  - Get specific request details
POST   /api/approvals/{id}/approve          - Approve a request
POST   /api/approvals/{id}/reject           - Reject a request
POST   /api/approvals/{id}/comments         - Add comment to request
GET    /api/approvals/stats                 - Get approval statistics

// User Management with Approval
POST   /api/users                           - Create user (ADMIN: pending, SUPERADMIN: active)
GET    /api/users?approval_status=PENDING   - Get pending users
PUT    /api/users/{id}/activate             - Super Admin activate

// Teacher Management with Approval
POST   /api/teachers                        - Create teacher (ADMIN: pending, SUPERADMIN: active)
GET    /api/teachers?approval_status=PENDING - Get pending teachers

// Student Management with Approval
POST   /api/students                        - Create student (ADMIN: pending, SUPERADMIN: active)
GET    /api/students?approval_status=PENDING - Get pending students
```

---

## 💻 Backend Implementation

### 1. ApprovalRequest Entity

```java
@Entity
@Table(name = "approval_requests")
@Data
public class ApprovalRequest {
    @Id
    private UUID id;
    
    private String entityType; // USER, STUDENT, TEACHER
    private UUID entityId;
    private String requestType; // CREATE, UPDATE, DELETE
    private UUID requestedBy;
    private LocalDateTime requestedAt;
    private String approvalStatus; // PENDING, APPROVED, REJECTED
    private UUID approvedBy;
    private LocalDateTime approvedAt;
    private String rejectionReason;
    
    @Type(type = "jsonb")
    @Column(columnDefinition = "jsonb")
    private String requestData;
    
    private String changesSummary;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 2. ApprovalService

```java
@Service
public class ApprovalService {
    
    // Get pending approvals for Super Admin
    public List<ApprovalRequest> getPendingApprovals();
    
    // Approve a request
    public ApprovalRequest approveRequest(UUID requestId, UUID superAdminId);
    
    // Reject a request
    public ApprovalRequest rejectRequest(UUID requestId, UUID superAdminId, String reason);
    
    // Get approval statistics
    public ApprovalStats getApprovalStats();
}
```

### 3. Modified UserService

```java
@Service
public class UserService {
    
    public User createUser(User user, UUID createdBy) {
        // Get creator's role
        User creator = userRepository.findById(createdBy);
        String creatorRole = creator.getRole().getRoleName();
        
        if (creatorRole.equals("ADMIN") || creatorRole.equals("MANAGER")) {
            // Set to pending approval
            user.setApprovalStatus("PENDING");
            user.setRequestedBy(createdBy);
            user.setRequestedAt(LocalDateTime.now());
            user.setStatus("INACTIVE");
            
            // Create approval request
            createApprovalRequest(user, "USER", createdBy);
        } else if (creatorRole.equals("SUPERADMIN")) {
            // Auto-approve
            user.setApprovalStatus("APPROVED");
            user.setApprovedBy(createdBy);
            user.setApprovedAt(LocalDateTime.now());
            user.setStatus("ACTIVE");
        }
        
        return userRepository.save(user);
    }
}
```

---

## 🎨 Frontend Components Needed

### 1. Super Admin Dashboard - Pending Approvals Card

```tsx
// New component: PendingApprovalsWidget.tsx
export function PendingApprovalsWidget() {
  const [pendingCount, setPendingCount] = useState(0);
  
  useEffect(() => {
    fetch('/api/approvals/pending')
      .then(res => res.json())
      .then(data => setPendingCount(data.length));
  }, []);
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-bold mb-4">🔔 Pending Approvals</h3>
      <div className="text-4xl font-bold text-orange-600">{pendingCount}</div>
      <p className="text-gray-500">Requests awaiting approval</p>
      <Link href="/dashboard/superadmin/approvals">
        <button className="mt-4 btn-primary">Review Now</button>
      </Link>
    </div>
  );
}
```

### 2. Approvals Page

```tsx
// New page: frontend/app/dashboard/superadmin/approvals/page.tsx
export default function ApprovalsPage() {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  
  const approveRequest = async (requestId) => {
    await fetch(`/api/approvals/${requestId}/approve`, { method: 'POST' });
    fetchPendingApprovals();
  };
  
  const rejectRequest = async (requestId, reason) => {
    await fetch(`/api/approvals/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    fetchPendingApprovals();
  };
  
  return (
    <div>
      <h1>🔔 Pending Approvals</h1>
      <div className="approval-list">
        {pendingApprovals.map(approval => (
          <ApprovalCard 
            key={approval.id}
            approval={approval}
            onApprove={() => approveRequest(approval.id)}
            onReject={(reason) => rejectRequest(approval.id, reason)}
          />
        ))}
      </div>
    </div>
  );
}
```

### 3. Approval History Page

```tsx
// frontend/app/dashboard/superadmin/approvals/history/page.tsx
export default function ApprovalHistoryPage() {
  const [history, setHistory] = useState([]);
  
  // Shows all approved/rejected requests with filters
  // - Filter by date range
  // - Filter by entity type (USER/TEACHER/STUDENT)
  // - Filter by status (APPROVED/REJECTED)
  // - Search by requester name
}
```

---

## 📊 Dashboard Metrics

### Super Admin Dashboard Should Show:

```tsx
┌─────────────────────────────────────────────────────┐
│  PENDING APPROVALS: 5                              │
│  ├─ 2 Teachers                                      │
│  ├─ 2 Students                                      │
│  └─ 1 Users                                         │
│                                                     │
│  APPROVED THIS MONTH: 23                           │
│  REJECTED THIS MONTH: 2                            │
│  AVERAGE APPROVAL TIME: 2.5 hours                  │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 Query Examples

### Get all pending teacher approvals:
```sql
SELECT * FROM vw_pending_approvals 
WHERE entity_type = 'TEACHER' 
ORDER BY requested_at ASC;
```

### Get approval statistics:
```sql
SELECT 
    entity_type,
    COUNT(CASE WHEN approval_status = 'PENDING' THEN 1 END) as pending,
    COUNT(CASE WHEN approval_status = 'APPROVED' THEN 1 END) as approved,
    COUNT(CASE WHEN approval_status = 'REJECTED' THEN 1 END) as rejected
FROM approval_requests
GROUP BY entity_type;
```

### Get requests by specific admin:
```sql
SELECT * FROM approval_requests 
WHERE requested_by = 'admin-user-id'
ORDER BY requested_at DESC;
```

---

## 🎯 Current Status

### ✅ Completed:
- ✅ Database migration with approval columns
- ✅ approval_requests table created
- ✅ approval_comments table created
- ✅ Indexes for fast queries
- ✅ Views for pending approvals and history
- ✅ Auto-trigger function (ready for implementation)

### ⏳ Pending (Next Steps):
1. **Backend**:
   - Create ApprovalRequest entity
   - Create ApprovalService with approve/reject logic
   - Create ApprovalController with 7 endpoints
   - Update UserService to check creator role
   - Update TeacherService to check creator role
   - Update StudentService to check creator role

2. **Frontend**:
   - Add "Pending Approvals" widget to Super Admin dashboard
   - Create `/dashboard/superadmin/approvals` page
   - Create `/dashboard/superadmin/approvals/history` page
   - Add approval status badges to user/teacher/student lists
   - Add "Requested by" info in list views

3. **Permissions**:
   - Ensure only Super Admin can approve/reject
   - Ensure Admin/Manager can view their own requests
   - Add role-based access control to approval endpoints

---

## 📝 User Stories

### As an Admin:
- I can create a new teacher
- The teacher is created with status INACTIVE
- I can see "Pending Approval" badge on the teacher
- I receive notification when Super Admin approves/rejects

### As a Super Admin:
- I see a notification: "5 pending approvals"
- I click to view pending approvals page
- I see details: teacher name, requested by, requested at
- I can approve or reject with reason
- Upon approval, teacher becomes ACTIVE automatically
- I can view approval history and statistics

---

**🎊 APPROVAL WORKFLOW SYSTEM READY FOR IMPLEMENTATION!**

Database structure is complete. Backend and frontend implementation needed.
