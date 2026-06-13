# LERA Notification System - Implementation Guide

## Overview

The LERA notification system enables real-time notifications across all services when business events occur. When a teacher applies for leave, their manager gets notified. When a payment is received, the parent gets notified.

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  attendance_service │     │  payment_service    │     │  academy_service    │
│  (Leaves)           │     │  (Payments)         │     │  (Enrollments)      │
└─────────┬───────────┘     └─────────┬───────────┘     └─────────┬───────────┘
          │                           │                           │
          │ HTTP POST                 │ HTTP POST                 │ HTTP POST
          ▼                           ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          connect_service (8086)                             │
│                     /api/notifications/trigger/*                            │
│                                                                             │
│  NotificationController → NotificationService → NotificationRepository      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │  PostgreSQL   │
                              │  notifications│
                              └───────────────┘
```

## Notification Types

| Type | Description | Recipients |
|------|-------------|------------|
| `LEAVE_APPLICATION` | Employee applied for leave | Managers, CEO, Chairman |
| `LEAVE_APPROVED` | Leave request approved | Employee who applied |
| `LEAVE_REJECTED` | Leave request rejected | Employee who applied |
| `PAYMENT_RECEIVED` | Payment successfully processed | Parent/Payer |
| `PAYMENT_DUE` | Payment is overdue | Parent/Guardian |
| `NEW_ENROLLMENT` | New student enrollment request | Admins |
| `ENROLLMENT_APPROVED` | Enrollment approved | Parent |
| `ENROLLMENT_REJECTED` | Enrollment rejected | Parent |
| `EXAM_SCHEDULED` | New exam scheduled | Students |
| `EXAM_RESULT` | Exam results available | Parent |
| `ATTENDANCE_LOW` | Student attendance below threshold | Parent |
| `NEW_MESSAGE` | New message received | Recipient |
| `TASK_ASSIGNED` | New task assigned | Assignee |
| `BROADCAST` | System-wide announcement | All users |

## API Endpoints

### Generic Trigger (POST /api/notifications/trigger)

Accepts JSON body:
```json
{
  "notificationType": "LEAVE_APPLICATION",
  "userId": "uuid",           // Target user (null for broadcast)
  "userIds": ["uuid", "uuid"], // For multiple recipients
  "employeeName": "John Doe",
  "leaveType": "Annual",
  "startDate": "2024-01-15",
  "endDate": "2024-01-17",
  "title": "Custom title",
  "titleVi": "Tiêu đề",
  "message": "Custom message",
  "messageVi": "Nội dung",
  "type": "info|success|warning|error|approval|message|payment",
  "referenceType": "leave|payment|enrollment|exam|student",
  "referenceId": "uuid"
}
```

### Specific Endpoints

| Endpoint | Parameters |
|----------|------------|
| `POST /trigger/leave-application` | employeeId, employeeName, leaveType, startDate, endDate, leaveId |
| `POST /trigger/leave-approved` | employeeId, leaveType, startDate, endDate, approverName |
| `POST /trigger/leave-rejected` | employeeId, leaveType, startDate, endDate, approverName, reason |
| `POST /trigger/payment-received` | parentId, studentName, amount, currency, paymentId |
| `POST /trigger/new-enrollment` | studentName, courseName + body: adminIds[] |
| `POST /trigger/broadcast` | title, titleVi, message, messageVi, type |

## Service Integration

### Attendance Service

The `TeacherStaffLeaveService` now sends notifications:

1. **On Leave Application** → Notifies managers
2. **On Leave Approval** → Notifies employee
3. **On Leave Rejection** → Notifies employee

```java
// In applyLeave()
notificationClient.notifyLeaveApplication(
    leave.getUserId(),
    employeeName,
    leave.getLeaveType(),
    leave.getLeaveDate().toString(),
    endDate.toString(),
    savedLeave.getId()
);
```

### Payment Service

The `NotificationClient` can be called:

```java
@Autowired
private NotificationClient notificationClient;

// After payment success
notificationClient.notifyPaymentReceived(
    parentId,
    studentName,
    amount,
    "VND",
    paymentId
);
```

### Academy Service

The `NotificationClient` can be called:

```java
@Autowired
private NotificationClient notificationClient;

// After enrollment
notificationClient.notifyNewEnrollment(studentName, courseName, adminIds);
notificationClient.notifyEnrollmentApproved(parentId, studentName, courseName, enrollmentId);
```

## Configuration

Each service needs in `application.properties`:

```properties
connect.service.url=http://localhost:8086
```

## Database Schema

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID,           -- NULL for broadcast
    title VARCHAR(255),
    title_vi VARCHAR(255),
    message TEXT,
    message_vi TEXT,
    type VARCHAR(50),       -- info, success, warning, error, approval, message, payment
    reference_type VARCHAR(50),
    reference_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Frontend Integration

The frontend fetches notifications from:
- `GET /api/notifications/user/{userId}` - All notifications (user + broadcast)
- `GET /api/notifications/user/{userId}/unread` - Unread only
- `GET /api/notifications/user/{userId}/unread/count` - Count for badge
- `PATCH /api/notifications/{id}/read` - Mark as read
- `PATCH /api/notifications/user/{userId}/read-all` - Mark all as read

## Bilingual Support

All notifications support English and Vietnamese:
- `title` / `titleVi`
- `message` / `messageVi`

The frontend switches based on user's language preference.

## Files Modified/Created

### Connect Service (8086)
- `NotificationService.java` - Core notification logic
- `NotificationController.java` - REST API endpoints
- `CreateNotificationRequest.java` - DTO for trigger requests

### Attendance Service (8085)
- `NotificationClient.java` - HTTP client to call connect_service
- `RestTemplateConfig.java` - RestTemplate bean
- `TeacherStaffLeaveService.java` - Added notification calls

### Payment Service (8083)
- `NotificationClient.java` - HTTP client to call connect_service
- `RestTemplateConfig.java` - RestTemplate bean

### Academy Service (8082)
- `NotificationClient.java` - HTTP client to call connect_service
- `RestTemplateConfig.java` - RestTemplate bean

## Testing

1. Start all services
2. Apply for leave via API or UI
3. Check notification appears in connect_service database
4. Check `/api/notifications/user/{managerId}` returns the notification

```bash
# Test leave notification
curl -X POST http://localhost:8085/api/leaves/apply \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "ceo-uuid",
    "centerId": "center-uuid",
    "leaveType": "Annual",
    "leaveDate": "2024-01-15",
    "endDate": "2024-01-17",
    "reason": "Vacation"
  }'

# Check notification
curl http://localhost:8086/api/notifications/user/manager-uuid
```

## Error Handling

Notification failures are logged but do not fail the main operation:
```java
try {
    notificationClient.notifyLeaveApplication(...);
} catch (Exception e) {
    log.warn("Failed to send notification, but leave was saved successfully", e);
}
```

## Next Steps

To complete integration:
1. Wire NotificationClient into PaymentService for payment confirmations
2. Wire NotificationClient into enrollment/exam services
3. Add WebSocket for real-time push (optional)
4. Add email/SMS integration (optional)
