# 📊 Leave System - Quick Reference Card

## 🎯 Three Main Features

### 1️⃣ DYNAMIC APPROVER ASSIGNMENT
```
Chairman → Picks anyone to approve a leave
Default: Center Admin
Override: Chairman can assign specific person

API: PUT /api/leaves/{id}/assign-approver?approverId={uuid}
```

### 2️⃣ CEO & CHAIRMAN AUTO-NOTIFICATION
```
Teacher applies → System automatically:
  ✅ notified_to_ceo = TRUE
  ✅ notified_to_chairman = TRUE
  
CEO Dashboard → Shows all leaves
Chairman Dashboard → Shows all leaves

API: GET /api/leaves/executive/pending
```

### 3️⃣ MONTHLY LEAVE ACCRUAL (1 per month)
```
OLD SYSTEM: 12 leaves on Jan 1
NEW SYSTEM: 1 leave added each month

Jan: 1 leave  → Total: 1
Feb: 1 leave  → Total: 2 (1 new + 1 carried)
Mar: 1 leave  → Total: 3 (1 new + 2 carried)
...
Dec: 1 leave  → Total: 12

Unused leaves carry forward!
```

---

## 🔄 Complete Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    STEP 1: APPLY                            │
└─────────────────────────────────────────────────────────────┘
Teacher → "I need leave on Jan 15"
          
System → Checks monthly accrual balance
       → Do they have 1 leave available?
       
✅ YES: Create leave (Status: PENDING)
❌ NO:  Error "Insufficient balance"

┌─────────────────────────────────────────────────────────────┐
│                    STEP 2: AUTO-NOTIFY                      │
└─────────────────────────────────────────────────────────────┘
System → Sets notified_to_ceo = TRUE
       → Sets notified_to_chairman = TRUE
       
CEO Dashboard → 🔔 "New leave request from John"
Chairman Dashboard → 🔔 "New leave request from John"

┌─────────────────────────────────────────────────────────────┐
│                    STEP 3: ASSIGN (Optional)                │
└─────────────────────────────────────────────────────────────┘
Chairman → Can assign specific approver
         → "Let Mary approve this instead of center admin"
         → assigned_approver_id = mary_uuid

┌─────────────────────────────────────────────────────────────┐
│                    STEP 4: APPROVE/REJECT                   │
└─────────────────────────────────────────────────────────────┘
If assigned_approver_id exists:
  → Mary approves/rejects
Else:
  → Center Admin approves/rejects

✅ APPROVED:
   - Status = APPROVED
   - Deduct 1 leave from January accrual
   - January: 1 available → 0 available
   
❌ REJECTED:
   - Status = REJECTED
   - Balance NOT touched
   - January: 1 available (still)

┌─────────────────────────────────────────────────────────────┐
│                    STEP 5: VISIBILITY                       │
└─────────────────────────────────────────────────────────────┘
CEO → Can view all leaves from all centers
    → Can see approval status
    → Can mark as viewed
    
Chairman → Can view all leaves from all centers
         → Can assign approvers
         → Can mark as viewed
```

---

## 📊 Monthly Accrual Example

**User: John (joined Jan 1, 2025)**

```
┌───────┬─────────┬──────────┬───────────────┬──────────────┬─────────────┐
│ Month │ Accrued │ Used     │ Carried Fwd   │ Available    │ Event       │
├───────┼─────────┼──────────┼───────────────┼──────────────┼─────────────┤
│ Jan   │ 1.0     │ 0.0      │ 0.0           │ 1.0          │ -           │
│ Feb   │ 1.0     │ 0.0      │ 1.0           │ 2.0          │ -           │
│ Mar   │ 1.0     │ 1.0      │ 2.0           │ 2.0          │ Took leave  │
│ Apr   │ 1.0     │ 0.0      │ 2.0           │ 3.0          │ -           │
│ May   │ 1.0     │ 0.5      │ 3.0           │ 3.5          │ Half day    │
│ Jun   │ 1.0     │ 0.0      │ 3.5           │ 4.5          │ -           │
│ Jul   │ 1.0     │ 1.0      │ 4.5           │ 4.5          │ Took leave  │
│ Aug   │ 1.0     │ 0.0      │ 4.5           │ 5.5          │ -           │
│ Sep   │ 1.0     │ 0.0      │ 5.5           │ 6.5          │ -           │
│ Oct   │ 1.0     │ 0.0      │ 6.5           │ 7.5          │ -           │
│ Nov   │ 1.0     │ 0.0      │ 7.5           │ 8.5          │ -           │
│ Dec   │ 1.0     │ 0.0      │ 8.5           │ 9.5          │ -           │
├───────┼─────────┼──────────┼───────────────┼──────────────┼─────────────┤
│ TOTAL │ 12.0    │ 2.5      │ -             │ 9.5          │ Year end    │
└───────┴─────────┴──────────┴───────────────┴──────────────┴─────────────┘

Summary:
✅ Accrued: 12 leaves (1 per month)
✅ Used: 2.5 leaves (1 full + 1 half + 1 full)
✅ Available: 9.5 leaves remaining
✅ Carry forward to next year: 9.5 leaves
```

---

## 🔗 Quick API Reference

### Apply for Leave
```bash
POST /api/leaves/apply
{
  "userId": "abc",
  "centerId": "xyz",
  "leaveDate": "2025-01-15",
  "leaveType": "SICK_LEAVE",
  "reason": "Medical",
  "requestedBy": "abc"
}
```

### Check Balance
```bash
GET /api/leaves/balance/{userId}

Response:
{
  "totalAvailable": 9.5,
  "currentMonthAvailable": 1.0,
  "carriedForward": 8.5
}
```

### Assign Approver (Chairman)
```bash
PUT /api/leaves/{id}/assign-approver?approverId={uuid}
```

### CEO/Chairman View All
```bash
GET /api/leaves/executive/pending
```

### Approve Leave
```bash
PUT /api/leaves/{id}/approve?isPaid=true
```

### Mark as Viewed
```bash
PUT /api/leaves/{id}/ceo-viewed
PUT /api/leaves/{id}/chairman-viewed
```

---

## ✅ Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Monthly Accrual Table | ✅ | leave_balance_accruals created |
| Auto-notify CEO | ✅ | notified_to_ceo field added |
| Auto-notify Chairman | ✅ | notified_to_chairman field added |
| Assign Approver | ✅ | assigned_approver_id field added |
| Balance Checking | ✅ | Checks before applying |
| Balance Deduction | ✅ | Auto-deduct on approval |
| Balance Restoration | ✅ | Auto-restore on cancellation |
| Carry Forward | ✅ | Month to month |
| API Endpoints | ✅ | All 8 new endpoints added |
| Service Running | ✅ | Port 8084, PID 9249 |

---

## 🎯 Role-Based Access

```
TEACHER/STAFF:
  ✅ Apply for leave (if balance available)
  ✅ View own leaves
  ✅ Check own balance
  ✅ Cancel own leaves
  ❌ Cannot approve
  ❌ Cannot see others' leaves

CENTER_ADMIN:
  ✅ Apply for own leave
  ✅ View own leaves
  ✅ Approve leaves for their center
  ✅ View center's leaves
  ❌ Cannot assign approvers
  ❌ Cannot see other centers

CEO:
  ✅ View ALL leaves (all centers)
  ✅ Approve ANY leave
  ✅ See all balances
  ✅ Track who approved what
  ❌ Cannot assign approvers (only Chairman)

CHAIRMAN:
  ✅ View ALL leaves (all centers)
  ✅ Approve ANY leave
  ✅ Assign ANY approver to ANY leave ⭐
  ✅ Override default approvals
  ✅ See everything
```

---

## 🚀 Service Info

```
Service: attendance_service
Port: 8084
Status: 🟢 RUNNING
Process ID: 9249

Health Check:
curl http://localhost:8084/api/leaves/all

Test API:
curl http://localhost:8084/api/leaves/balance/your-user-id
```

---

## 📝 Quick Notes

**For Teachers**:
- Check your balance before applying
- You get 1 leave per month
- Unused leaves carry forward
- CEO and Chairman see all your requests

**For Center Admins**:
- Approve/reject leaves as usual
- Chairman might assign someone else to approve

**For Chairman**:
- You can assign anyone to approve any leave
- Use: PUT /api/leaves/{id}/assign-approver?approverId={uuid}
- You see everything from all centers

**For CEO**:
- You see everything from all centers
- All leaves automatically notify you
- Use: GET /api/leaves/executive/pending

---

## 🎉 DONE!

All three requirements fully implemented and tested! ✅
