# 🎯 Reporting Manager Approval System - Complete Guide

**Date**: December 30, 2025  
**Status**: ✅ IMPLEMENTED & RUNNING

---

## 📋 System Overview

### ✅ Approval Hierarchy (UPDATED)

```
Teacher/Staff
    ↓
    Applies for Leave
    ↓
┌──────────────────────────────────────────────┐
│  NOTIFIED TO:                                │
│  1️⃣ Reporting Manager (APPROVER)             │
│  2️⃣ Center Manager (CC ONLY - Not Approver) │
│  3️⃣ CEO (Visibility)                         │
│  4️⃣ Chairman (Visibility & Can Assign)       │
└──────────────────────────────────────────────┘
    ↓
Reporting Manager Reviews & Approves/Rejects
    ↓
Center Manager can VIEW but CANNOT approve
CEO & Chairman can VIEW everything
```

---

## 🔑 Key Changes

### Before (Old System):
```
Teacher → CENTER ADMIN (approver) → Approved/Rejected
```

### After (New System):
```
Teacher → REPORTING MANAGER (approver) → Approved/Rejected
          + Center Manager (CC only)
          + CEO (visibility)
          + Chairman (visibility + assign)
```

---

## 👥 Role Definitions

### 1️⃣ Reporting Manager (APPROVER)
**Who**: Teacher's direct manager/supervisor
**Can**:
- ✅ View leaves of their reportees
- ✅ Approve leaves (Paid/Unpaid)
- ✅ Reject leaves (with reason)
- ✅ See leave history

**Cannot**:
- ❌ View leaves from other teams
- ❌ Assign approvers (only Chairman can)

**API Endpoint**: `GET /api/leaves/reporting-manager/{managerId}`

---

### 2️⃣ Center Manager (CC ONLY)
**Who**: Manager of the center/location
**Can**:
- ✅ VIEW all leaves from their center (READ ONLY)
- ✅ Track leave patterns
- ✅ See approval status
- ✅ Mark as viewed

**Cannot**:
- ❌ **APPROVE** leaves (Reporting Manager approves)
- ❌ **REJECT** leaves
- ❌ Modify leaves

**API Endpoint**: `GET /api/leaves/center-manager/{managerId}/cc`

---

### 3️⃣ CEO (VISIBILITY)
**Who**: Chief Executive Officer
**Can**:
- ✅ View ALL leaves from ALL centers
- ✅ Track organization-wide patterns
- ✅ See who approved what
- ✅ Mark as viewed

**Cannot**:
- ❌ Directly approve (unless assigned by Chairman)
- ❌ Assign approvers

**API Endpoint**: `GET /api/leaves/executive/pending`

---

### 4️⃣ Chairman (ULTIMATE CONTROL)
**Who**: Chairman of the organization
**Can**:
- ✅ View ALL leaves from ALL centers
- ✅ Assign ANY person as approver (override default)
- ✅ Approve any leave
- ✅ See everything

**API Endpoints**:
- `GET /api/leaves/executive/pending`
- `PUT /api/leaves/{id}/assign-approver?approverId={uuid}`

---

## 🔄 Complete Workflow

### Step 1: Teacher Applies for Leave

```typescript
POST /api/leaves/apply
{
  "userId": "teacher-uuid",
  "centerId": "center-uuid",
  "reportingManagerId": "manager-uuid",  // NEW: Required
  "centerManagerId": "cm-uuid",          // NEW: For CC
  "leaveDate": "2025-01-15",
  "leaveType": "SICK_LEAVE",
  "reason": "Medical appointment"
}

System automatically:
✅ notified_to_ceo = TRUE
✅ notified_to_chairman = TRUE
✅ center_manager_notified = TRUE (CC)
```

---

### Step 2: Notifications Sent

```
🔔 Reporting Manager → "New leave request from John Doe"
   → Action Required: APPROVE or REJECT

📧 Center Manager → "FYI: Leave request from John Doe"
   → No action required (CC only)

📊 CEO → "New leave request submitted"
   → Dashboard shows all leaves

👔 Chairman → "New leave request submitted"
   → Can assign different approver if needed
```

---

### Step 3: Reporting Manager Approves/Rejects

**Option A: APPROVE**
```typescript
PUT /api/leaves/{id}/approve?isPaid=true

Result:
✅ Status = APPROVED
✅ Leave balance deducted (1 day from monthly accrual)
✅ Teacher notified
✅ Center Manager sees approval (CC)
✅ CEO sees approval
✅ Chairman sees approval
```

**Option B: REJECT**
```typescript
PUT /api/leaves/{id}/reject

Body: {
  "reason": "Project deadline approaching"
}

Result:
❌ Status = REJECTED
❌ Balance NOT deducted
❌ Teacher sees rejection reason
📧 Center Manager sees rejection (CC)
```

---

### Step 4: Center Manager Views (CC Only)

```typescript
GET /api/leaves/center-manager/{cm-uuid}/cc

Response:
[
  {
    "id": "leave-123",
    "userId": "teacher-uuid",
    "status": "APPROVED",
    "leaveDate": "2025-01-15",
    "reportingManagerId": "manager-uuid",
    "centerManagerNotified": true,
    "centerManagerViewedAt": null  // Not viewed yet
  }
]

// Center Manager marks as viewed
PUT /api/leaves/leave-123/center-manager-viewed

✅ centerManagerViewedAt = "2025-12-30T10:00:00"
```

---

## 📊 Database Schema Updates

### New Columns Added

```sql
ALTER TABLE teacher_staff_leaves 
ADD COLUMN reporting_manager_id UUID;          -- Approver

ALTER TABLE teacher_staff_leaves 
ADD COLUMN center_manager_id UUID;             -- CC only

ALTER TABLE teacher_staff_leaves 
ADD COLUMN center_manager_notified BOOLEAN DEFAULT FALSE;

ALTER TABLE teacher_staff_leaves 
ADD COLUMN center_manager_viewed_at TIMESTAMP;
```

---

## 🔗 New API Endpoints

### For Reporting Managers (Approvers)

**1. Get Leaves to Approve**
```bash
GET /api/leaves/reporting-manager/{managerId}

Example:
GET http://localhost:8084/api/leaves/reporting-manager/john-uuid

Response: All leaves assigned to this reporting manager
```

**2. Get Pending Leaves Only**
```bash
GET /api/leaves/reporting-manager/{managerId}/pending

Response: Only PENDING leaves requiring action
```

---

### For Center Managers (CC Only)

**3. Get CC'd Leaves (View Only)**
```bash
GET /api/leaves/center-manager/{managerId}/cc

Example:
GET http://localhost:8084/api/leaves/center-manager/mary-uuid/cc

Response: All leaves from this center (read-only)
```

**4. Mark as Viewed**
```bash
PUT /api/leaves/{id}/center-manager-viewed

Example:
PUT http://localhost:8084/api/leaves/abc-123/center-manager-viewed

Response: { "message": "Marked as viewed by Center Manager" }
```

---

## 💻 Frontend Integration

### For Teacher (Leave Application)

```typescript
// When applying for leave, include reporting manager and center manager
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
      reportingManagerId: currentUser.reportingManagerId,  // NEW
      centerManagerId: currentUser.centerManagerId,        // NEW
      leaveDate: '2025-01-15',
      leaveType: 'SICK_LEAVE',
      reason: 'Medical appointment',
      requestedBy: currentUser.id
    })
  });
  
  if (response.ok) {
    alert('Leave applied! Reporting Manager notified for approval.');
  }
};
```

---

### For Reporting Manager (Approval Dashboard)

```typescript
// Fetch leaves to approve
const fetchLeavesToApprove = async () => {
  const response = await fetch(
    `http://localhost:8084/api/leaves/reporting-manager/${currentUser.id}`,
    { headers: { 'Authorization': `Bearer ${token}` }}
  );
  const leaves = await response.json();
  // Show approval interface
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
  alert('Leave approved! Balance deducted.');
};
```

---

### For Center Manager (View Only Dashboard)

```typescript
// Fetch CC'd leaves (read-only)
const fetchCCLeaves = async () => {
  const response = await fetch(
    `http://localhost:8084/api/leaves/center-manager/${currentUser.id}/cc`,
    { headers: { 'Authorization': `Bearer ${token}` }}
  );
  const leaves = await response.json();
  
  // Show read-only table (NO approve/reject buttons)
  // Just show status, dates, reporting manager who approved
};

// Mark as viewed
const markViewed = async (leaveId) => {
  await fetch(
    `http://localhost:8084/api/leaves/${leaveId}/center-manager-viewed`,
    {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
};
```

---

## 📋 Examples by Scenario

### Scenario 1: Normal Approval Flow

```
👨‍🏫 Teacher "John" (reports to Manager "Sarah")
    ↓
John applies for leave on Jan 15
    ↓
System notifies:
  - Sarah (Reporting Manager) → Must approve ✅
  - Mike (Center Manager) → FYI only (CC) 📧
  - CEO → Visibility 👁️
  - Chairman → Visibility 👔
    ↓
Sarah reviews and approves
    ↓
Status: APPROVED ✅
Balance: Deducted 1 day from January accrual
    ↓
Mike (Center Manager) sees approval (CC)
John gets notification
```

---

### Scenario 2: Chairman Overrides Approver

```
👨‍🏫 Teacher "Emma" (reports to Manager "Tom")
    ↓
Emma applies for leave on Jan 20
    ↓
Normally Tom would approve
BUT Chairman assigns Director "Lisa" to approve
    ↓
Chairman: PUT /api/leaves/leave-id/assign-approver?approverId=lisa-uuid
    ↓
Now Lisa (not Tom) must approve
    ↓
Lisa approves
    ↓
Status: APPROVED ✅
```

---

### Scenario 3: Center Manager Views Only

```
📧 Center Manager "Mike"
    ↓
Opens dashboard: GET /api/leaves/center-manager/mike-uuid/cc
    ↓
Sees all leaves from his center:
  - John's leave: APPROVED by Sarah ✅
  - Emma's leave: PENDING (Tom reviewing) ⏳
  - David's leave: REJECTED by Mary ❌
    ↓
Mike marks as viewed (tracking only)
    ↓
Cannot approve/reject (NOT his role)
```

---

## 🔐 Permissions Matrix

| Role | Apply | Approve | View Own | View Center | View All | Assign Approver | Mark CC Viewed |
|------|-------|---------|----------|-------------|----------|-----------------|----------------|
| **Teacher** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Reporting Manager** | ✅ | ✅ | ✅ | ✅ Team | ❌ | ❌ | ❌ |
| **Center Manager** | ✅ | ❌ | ✅ | ✅ READ | ❌ | ❌ | ✅ |
| **CEO** | ✅ | ❌* | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Chairman** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

*CEO can approve if Chairman assigns them

---

## ✅ Testing Checklist

### Test 1: Apply with Reporting Manager
```bash
POST /api/leaves/apply
{
  "userId": "teacher-1",
  "reportingManagerId": "manager-1",
  "centerManagerId": "cm-1",
  "centerId": "center-1",
  "leaveDate": "2025-01-15",
  "leaveType": "SICK_LEAVE",
  "reason": "Test"
}

✅ Verify: center_manager_notified = TRUE
✅ Verify: notified_to_ceo = TRUE
✅ Verify: notified_to_chairman = TRUE
```

### Test 2: Reporting Manager Approves
```bash
GET /api/leaves/reporting-manager/manager-1

PUT /api/leaves/leave-id/approve?isPaid=true

✅ Verify: Status = APPROVED
✅ Verify: Balance deducted
```

### Test 3: Center Manager Views Only
```bash
GET /api/leaves/center-manager/cm-1/cc

✅ Verify: Can see all center leaves
✅ Verify: No approve/reject capability in API
```

### Test 4: Chairman Assigns Approver
```bash
PUT /api/leaves/leave-id/assign-approver?approverId=new-manager-uuid

✅ Verify: assigned_approver_id updated
✅ Verify: New manager can now approve
```

---

## 🎯 Summary

### What Changed:
1. ✅ **Reporting Manager** is now the APPROVER (not Center Admin)
2. ✅ **Center Manager** receives CC only (VIEW only, no approval)
3. ✅ **CEO** gets visibility of all leaves
4. ✅ **Chairman** can assign any approver

### New Fields:
- `reporting_manager_id` - Who approves the leave
- `center_manager_id` - Who gets CC'd (view only)
- `center_manager_notified` - Tracking flag
- `center_manager_viewed_at` - When CM viewed

### New APIs:
- `GET /api/leaves/reporting-manager/{id}` - For approvers
- `GET /api/leaves/center-manager/{id}/cc` - For CC (view only)
- `PUT /api/leaves/{id}/center-manager-viewed` - Mark viewed

---

## 🚀 Service Status

```
✅ Service: Running on port 8084
✅ Process ID: 15662
✅ Database: Migration complete
✅ APIs: All endpoints working
✅ Build: Success
```

---

## 📞 Quick Reference

**Apply Leave** (include reporting manager):
```
POST /api/leaves/apply
+ reportingManagerId
+ centerManagerId
```

**Reporting Manager Dashboard**:
```
GET /api/leaves/reporting-manager/{id}
```

**Center Manager CC View**:
```
GET /api/leaves/center-manager/{id}/cc
```

**Chairman Assign**:
```
PUT /api/leaves/{id}/assign-approver?approverId={id}
```

---

🎉 **Reporting Manager Approval System Complete!**
