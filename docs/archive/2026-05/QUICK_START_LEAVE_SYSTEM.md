# 🚀 Quick Start - Leave Management System

**Status**: ✅ READY TO USE  
**Last Updated**: December 30, 2025

---

## ⚡ Quick Access

### 🌐 URLs:
- **Teacher Leave Page**: http://localhost:3000/dashboard/teacher/leave
- **Admin Approval Page**: http://localhost:3000/dashboard/attendance/leave-approvals
- **API Base**: http://localhost:8084/api/leaves

### 🔑 Test Login:
```
Email: Chairman@Leraacademy.edu.vn
Password: admin123
```

---

## 📝 For Teachers - Apply for Leave

1. **Go to**: http://localhost:3000/dashboard/teacher/leave
2. Click **"+ Request Leave"**
3. Fill the form:
   - **Leave Type**: Choose (Sick, Casual, Annual, etc.)
   - **Start Date**: Select date
   - **End Date**: (Optional for multi-day)
   - **Half Day**: Check if needed
   - **Reason**: Write your reason
   - **Documents**: Add URLs (optional)
4. Click **"Submit Leave Request"**
5. ✅ Done! Your leave is now **PENDING**

---

## ✅ For Admins - Approve Leave

1. **Go to**: http://localhost:3000/dashboard/attendance/leave-approvals
2. See **pending count** badge
3. Click **"Details"** on any leave request
4. Review the information
5. Choose action:
   - **Approve (Paid)** - Approve as paid leave
   - **Approve (Unpaid)** - Approve as unpaid leave
   - **Reject** - Reject with reason
6. ✅ Done! Status updated immediately

---

## 🧪 Test the API

### Check Service:
```bash
curl http://localhost:8084/api/leaves/all
# Should return: []
```

### Apply for Leave:
```bash
curl -X POST http://localhost:8084/api/leaves/apply \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "centerId": "YOUR_CENTER_ID",
    "userType": "TEACHER",
    "leaveDate": "2025-01-05",
    "leaveType": "SICK_LEAVE",
    "reason": "Medical appointment",
    "requestedBy": "YOUR_USER_ID"
  }'
```

### Check Leave Balance:
```bash
curl http://localhost:8084/api/leaves/balance/YOUR_USER_ID
# Returns: {"remainingLeaves":12,"totalLeaves":12,"usedLeaves":0}
```

---

## 🎯 Leave Types

1. **SICK_LEAVE** - For illness
2. **CASUAL_LEAVE** - Personal reasons
3. **ANNUAL_LEAVE** - Vacation
4. **EMERGENCY** - Urgent matters
5. **MATERNITY** - Maternity leave
6. **PATERNITY** - Paternity leave  
7. **BEREAVEMENT** - Family loss

---

## 📊 Leave Balance

- **Total**: 12 days per year
- **Used**: Approved leaves count
- **Remaining**: Total - Used
- **Reset**: Annually

---

## 🔄 Workflow

```
Teacher Applies → PENDING → Admin Reviews → APPROVED/REJECTED
                    ↓
              Can Cancel Here
```

---

## 🐛 Troubleshooting

### Service not running?
```bash
./start-attendance.sh
```

### Frontend not connecting?
```bash
# Check service
curl http://localhost:8084/api/leaves/all

# Check frontend
cd frontend && npm run dev
```

### Database issues?
```bash
psql -U lera -d lera -f leave_management_migration.sql
```

---

## 📚 Full Documentation

- **System Guide**: `LEAVE_ATTENDANCE_SYSTEM_GUIDE.md`
- **Implementation**: `LEAVE_MANAGEMENT_IMPLEMENTATION.md`
- **User Guide**: `COMPLETE_SYSTEM_IMPLEMENTATION.md`
- **Success Report**: `LEAVE_SYSTEM_SUCCESS.md`

---

## ✅ Features Ready

- ✅ Apply for leave (Teachers/Staff)
- ✅ Approve/Reject leave (Admins)
- ✅ Leave balance tracking
- ✅ Cancel leave requests
- ✅ Multi-day leave support
- ✅ Half-day leave support
- ✅ Document upload
- ✅ Center-based isolation
- ✅ Real-time status updates

---

**🎉 Everything is ready! Start testing now!**

**Quick Links**:
- Teacher: http://localhost:3000/dashboard/teacher/leave
- Admin: http://localhost:3000/dashboard/attendance/leave-approvals
- API: http://localhost:8084/api/leaves/all
