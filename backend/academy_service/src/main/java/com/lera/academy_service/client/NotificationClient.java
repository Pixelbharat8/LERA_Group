package com.lera.academy_service.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Client to communicate with Connect Service for sending notifications.
 * <p>
 * All methods route through the unified POST /api/notifications/trigger endpoint
 * using the CreateNotificationRequest DTO contract.
 * <p>
 * Supported notificationType values handled by the Connect Service controller switch:
 *   LEAVE_APPLICATION, LEAVE_APPROVED, LEAVE_REJECTED,
 *   PAYMENT_RECEIVED, PAYMENT_DUE,
 *   ENROLLMENT_APPROVED, ENROLLMENT_REJECTED, NEW_ENROLLMENT,
 *   EXAM_SCHEDULED, EXAM_RESULT,
 *   ATTENDANCE_LOW, NEW_MESSAGE, TASK_ASSIGNED, BROADCAST
 * <p>
 * Any unrecognized notificationType or null notificationType falls through to the
 * controller's generic/default handler which creates notifications using:
 *   userId/userIds, title, titleVi, message, messageVi, type, referenceType, referenceId
 * <p>
 * The Notification entity also supports centerId which can be set via the direct
 * POST /api/notifications endpoint.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationClient {

    private final RestTemplate restTemplate;

    @Value("${connect.service.url:http://localhost:8086}")
    private String connectServiceUrl;

    // ==================== ENROLLMENT NOTIFICATIONS ====================

    /**
     * Send new enrollment notification to admins.
     * Maps to controller case "NEW_ENROLLMENT" which calls
     * notificationService.notifyNewEnrollment(studentName, courseName, adminIds)
     */
    public void notifyNewEnrollment(String studentName, String courseName, List<UUID> adminIds) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "NEW_ENROLLMENT");
            request.put("studentName", studentName);
            request.put("courseName", courseName);
            request.put("userIds", adminIds);

            triggerNotification(request);
            log.info("Sent new enrollment notification for student: {} in course: {} to {} admins",
                    studentName, courseName, adminIds.size());
        } catch (Exception e) {
            log.error("Failed to send enrollment notification for student: {} in course: {}",
                    studentName, courseName, e);
        }
    }

    /**
     * Send enrollment approval notification to parent.
     * Maps to controller case "ENROLLMENT_APPROVED" which calls
     * notificationService.notifyEnrollmentApproved(userId, studentName, courseName, referenceId)
     */
    public void notifyEnrollmentApproved(UUID parentId, String studentName, String courseName, UUID enrollmentId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "ENROLLMENT_APPROVED");
            request.put("userId", parentId);
            request.put("studentName", studentName);
            request.put("courseName", courseName);
            if (enrollmentId != null) {
                request.put("referenceId", enrollmentId);
            }

            triggerNotification(request);
            log.info("Sent enrollment approval notification to parent: {} for student: {}", parentId, studentName);
        } catch (Exception e) {
            log.error("Failed to send enrollment approval notification to parent: {}", parentId, e);
        }
    }

    /**
     * Send enrollment rejection notification.
     * Maps to controller case "ENROLLMENT_REJECTED" which calls
     * notificationService.notifyEnrollmentRejected(userId, studentName, courseName, reason)
     */
    public void notifyEnrollmentRejected(UUID parentId, String studentName, String courseName, String reason) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "ENROLLMENT_REJECTED");
            request.put("userId", parentId);
            request.put("studentName", studentName);
            request.put("courseName", courseName);
            if (reason != null) {
                request.put("reason", reason);
            }

            triggerNotification(request);
            log.info("Sent enrollment rejection notification to parent: {} for student: {}", parentId, studentName);
        } catch (Exception e) {
            log.error("Failed to send enrollment rejection notification to parent: {}", parentId, e);
        }
    }

    // ==================== EXAM NOTIFICATIONS ====================

    /**
     * Notify about exam scheduled.
     * Maps to controller case "EXAM_SCHEDULED" which calls:
     *   notificationService.notifyExamScheduled(
     *       request.getStudentName(),  // → examName param
     *       request.getExamName(),     // → examDate param
     *       request.getStartDate(),    // → className param
     *       request.getUserIds()
     *   )
     * NOTE: The Connect Service controller has a known field mapping where:
     *   - DTO studentName field → service examName parameter
     *   - DTO examName field → service examDate parameter
     *   - DTO startDate field → service className parameter
     * We set the DTO fields to match this mapping.
     */
    public void notifyExamScheduled(List<UUID> studentIds, String examName, String examDate, String className) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "EXAM_SCHEDULED");
            // Map DTO fields to match controller's parameter passing order:
            request.put("studentName", examName);    // controller reads as 1st arg (examName)
            request.put("examName", examDate);        // controller reads as 2nd arg (examDate)
            request.put("startDate", className);      // controller reads as 3rd arg (className)
            request.put("userIds", studentIds);

            triggerNotification(request);
            log.info("Sent exam scheduled notification to {} students for exam: {}", studentIds.size(), examName);
        } catch (Exception e) {
            log.error("Failed to send exam scheduled notification for exam: {}", examName, e);
        }
    }

    /**
     * Notify a single user about an upcoming exam.
     * Uses generic path with bilingual content.
     * Maps to NotificationService.notifyUpcomingExam(userId, examName, examDate, className, examId)
     */
    public void notifyUpcomingExam(UUID userId, String examName, String examDate,
                                   String className, UUID examId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userId", userId);
            request.put("title", "Upcoming Exam");
            request.put("titleVi", "Kỳ thi sắp tới");
            request.put("message", String.format("Reminder: %s for %s is scheduled on %s.",
                    examName, className, examDate));
            request.put("messageVi", String.format("Nhắc nhở: %s cho lớp %s sẽ diễn ra vào %s.",
                    examName, className, examDate));
            request.put("type", "info");
            request.put("referenceType", "exam");
            if (examId != null) {
                request.put("referenceId", examId);
            }

            triggerNotification(request);
            log.info("Sent upcoming exam notification to user: {} for exam: {}", userId, examName);
        } catch (Exception e) {
            log.error("Failed to send upcoming exam notification to user: {}", userId, e);
        }
    }

    /**
     * Notify about exam results available.
     * Maps to controller case "EXAM_RESULT" which calls
     * notificationService.notifyExamResult(userId, studentName, examName, referenceId)
     */
    public void notifyExamResults(UUID parentId, String studentName, String examName, UUID examId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "EXAM_RESULT");
            request.put("userId", parentId);
            request.put("studentName", studentName);
            request.put("examName", examName);
            if (examId != null) {
                request.put("referenceId", examId);
            }

            triggerNotification(request);
            log.info("Sent exam result notification for student: {} exam: {}", studentName, examName);
        } catch (Exception e) {
            log.error("Failed to send exam result notification for student: {}", studentName, e);
        }
    }

    // ==================== ATTENDANCE NOTIFICATIONS ====================

    /**
     * Notify about low attendance.
     * Maps to controller case "ATTENDANCE_LOW" which calls
     * notificationService.notifyLowAttendance(userId, studentName, attendancePercentage, className)
     */
    public void notifyLowAttendance(UUID userId, String studentName, double attendancePercentage, String className) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "ATTENDANCE_LOW");
            request.put("userId", userId);
            request.put("studentName", studentName);
            request.put("attendancePercentage", attendancePercentage);
            request.put("className", className);

            triggerNotification(request);
            log.info("Sent low attendance notification for student: {} ({}%)", studentName, attendancePercentage);
        } catch (Exception e) {
            log.error("Failed to send low attendance notification for student: {}", studentName, e);
        }
    }

    /**
     * Send daily attendance reminder to teacher.
     * Uses generic path since no dedicated controller case exists.
     */
    public void notifyAttendanceReminder(UUID teacherId, String className) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userId", teacherId);
            request.put("title", "Mark Attendance");
            request.put("titleVi", "Điểm danh lớp học");
            request.put("message", String.format("Please mark attendance for %s today.", className));
            request.put("messageVi", String.format("Vui lòng điểm danh cho lớp %s hôm nay.", className));
            request.put("type", "info");

            triggerNotification(request);
            log.info("Sent attendance reminder to teacher: {} for class: {}", teacherId, className);
        } catch (Exception e) {
            log.error("Failed to send attendance reminder to teacher: {}", teacherId, e);
        }
    }

    // ==================== MESSAGE NOTIFICATIONS ====================

    /**
     * Notify about new message received.
     * Maps to controller case "NEW_MESSAGE" which calls
     * notificationService.notifyNewMessage(userId, senderName, message, referenceId)
     */
    public void notifyNewMessage(UUID recipientId, String senderName, String messagePreview, UUID messageId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "NEW_MESSAGE");
            request.put("userId", recipientId);
            request.put("senderName", senderName);
            request.put("message", messagePreview);
            if (messageId != null) {
                request.put("referenceId", messageId);
            }

            triggerNotification(request);
            log.info("Sent new message notification to user: {} from: {}", recipientId, senderName);
        } catch (Exception e) {
            log.error("Failed to send new message notification to user: {}", recipientId, e);
        }
    }

    // ==================== TASK NOTIFICATIONS ====================

    /**
     * Notify about task assigned.
     * Maps to controller case "TASK_ASSIGNED" which calls
     * notificationService.notifyTaskAssigned(userId, title, referenceId, senderName)
     */
    public void notifyTaskAssigned(UUID assigneeId, String taskTitle, UUID taskId, String assignerName) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "TASK_ASSIGNED");
            request.put("userId", assigneeId);
            request.put("title", taskTitle);
            request.put("senderName", assignerName);
            if (taskId != null) {
                request.put("referenceId", taskId);
            }

            triggerNotification(request);
            log.info("Sent task assignment notification to user: {} for task: {}", assigneeId, taskTitle);
        } catch (Exception e) {
            log.error("Failed to send task assignment notification to user: {}", assigneeId, e);
        }
    }

    // ==================== PAYMENT NOTIFICATIONS ====================

    /**
     * Notify about payment received.
     * Maps to controller case "PAYMENT_RECEIVED" which calls
     * notificationService.notifyPaymentReceived(userId, studentName, amount, currency, referenceId)
     */
    public void notifyPaymentReceived(UUID parentId, String studentName, double amount,
                                      String currency, UUID paymentId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "PAYMENT_RECEIVED");
            request.put("userId", parentId);
            request.put("studentName", studentName);
            request.put("amount", amount);
            request.put("currency", currency != null ? currency : "VND");
            if (paymentId != null) {
                request.put("referenceId", paymentId);
            }

            triggerNotification(request);
            log.info("Sent payment received notification to parent: {} amount: {} {}", parentId, amount, currency);
        } catch (Exception e) {
            log.error("Failed to send payment received notification to parent: {}", parentId, e);
        }
    }

    /**
     * Notify about payment due / overdue.
     * Maps to controller case "PAYMENT_DUE" which calls
     * notificationService.notifyPaymentDue(userId, studentName, amount, currency, daysOverdue)
     */
    public void notifyPaymentDue(UUID parentId, String studentName, double amount,
                                 String currency, int daysOverdue) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "PAYMENT_DUE");
            request.put("userId", parentId);
            request.put("studentName", studentName);
            request.put("amount", amount);
            request.put("currency", currency != null ? currency : "VND");
            request.put("daysOverdue", daysOverdue);

            triggerNotification(request);
            log.info("Sent payment due notification to parent: {} amount: {} {} ({}d overdue)",
                    parentId, amount, currency, daysOverdue);
        } catch (Exception e) {
            log.error("Failed to send payment due notification to parent: {}", parentId, e);
        }
    }

    /**
     * Notify about payment overdue (with feeId reference).
     * Uses generic path with bilingual content and referenceType="fee".
     * Maps to NotificationService.notifyPaymentOverdue(parentId, studentName, amount, currency, daysOverdue, feeId)
     */
    public void notifyPaymentOverdue(UUID parentId, String studentName, double amount,
                                     String currency, int daysOverdue, UUID feeId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userId", parentId);
            request.put("title", "Payment Overdue");
            request.put("titleVi", "Thanh toán quá hạn");
            request.put("message", String.format("Payment of %,.0f %s for %s is %d days overdue. Please pay immediately.",
                    amount, currency != null ? currency : "VND", studentName, daysOverdue));
            request.put("messageVi", String.format("Thanh toán %,.0f %s cho %s đã quá hạn %d ngày. Vui lòng thanh toán ngay.",
                    amount, currency != null ? currency : "VND", studentName, daysOverdue));
            request.put("type", "warning");
            request.put("referenceType", "fee");
            if (feeId != null) {
                request.put("referenceId", feeId);
            }

            triggerNotification(request);
            log.info("Sent payment overdue notification to parent: {} amount: {} {} ({}d overdue)",
                    parentId, amount, currency, daysOverdue);
        } catch (Exception e) {
            log.error("Failed to send payment overdue notification to parent: {}", parentId, e);
        }
    }

    /**
     * Notify about upcoming payment due soon (before it becomes overdue).
     * Uses generic path with custom title/message since no dedicated controller case exists.
     */
    public void notifyPaymentDueSoon(UUID parentId, String studentName, double amount,
                                     String currency, String dueDate) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userId", parentId);
            request.put("title", "Payment Due Soon");
            request.put("titleVi", "Sắp đến hạn thanh toán");
            request.put("message", String.format("Payment of %,.0f %s for %s is due on %s.",
                    amount, currency != null ? currency : "VND", studentName, dueDate));
            request.put("messageVi", String.format("Thanh toán %,.0f %s cho %s sẽ đến hạn vào %s.",
                    amount, currency != null ? currency : "VND", studentName, dueDate));
            request.put("type", "info");
            request.put("referenceType", "payment");

            triggerNotification(request);
            log.info("Sent payment due soon notification to parent: {} for student: {}", parentId, studentName);
        } catch (Exception e) {
            log.error("Failed to send payment due soon notification to parent: {}", parentId, e);
        }
    }

    // ==================== LEAVE NOTIFICATIONS ====================

    /**
     * Send leave application notification to managers.
     * Maps to controller case "LEAVE_APPLICATION" which calls
     * notificationService.notifyLeaveApplication(userId, employeeName, leaveType, startDate, endDate)
     */
    public void notifyLeaveApplication(UUID employeeId, String employeeName,
                                       String leaveType, String startDate, String endDate) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "LEAVE_APPLICATION");
            request.put("userId", employeeId);
            request.put("employeeName", employeeName);
            request.put("leaveType", leaveType);
            request.put("startDate", startDate);
            request.put("endDate", endDate);

            triggerNotification(request);
            log.info("Sent leave application notification for employee: {}", employeeName);
        } catch (Exception e) {
            log.error("Failed to send leave application notification for employee: {}", employeeName, e);
        }
    }

    /**
     * Send leave approval notification to employee.
     * Maps to controller case "LEAVE_APPROVED" which calls
     * notificationService.notifyLeaveApproved(userId, leaveType, startDate, endDate, approverName)
     */
    public void notifyLeaveApproved(UUID employeeId, String leaveType,
                                    String startDate, String endDate, String approverName) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "LEAVE_APPROVED");
            request.put("userId", employeeId);
            request.put("leaveType", leaveType);
            request.put("startDate", startDate);
            request.put("endDate", endDate);
            request.put("approverName", approverName);

            triggerNotification(request);
            log.info("Sent leave approved notification to employee: {}", employeeId);
        } catch (Exception e) {
            log.error("Failed to send leave approved notification to employee: {}", employeeId, e);
        }
    }

    /**
     * Send leave rejection notification to employee.
     * Maps to controller case "LEAVE_REJECTED" which calls
     * notificationService.notifyLeaveRejected(userId, leaveType, startDate, endDate, approverName, reason)
     */
    public void notifyLeaveRejected(UUID employeeId, String leaveType,
                                    String startDate, String endDate,
                                    String approverName, String reason) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "LEAVE_REJECTED");
            request.put("userId", employeeId);
            request.put("leaveType", leaveType);
            request.put("startDate", startDate);
            request.put("endDate", endDate);
            request.put("approverName", approverName);
            if (reason != null) {
                request.put("reason", reason);
            }

            triggerNotification(request);
            log.info("Sent leave rejected notification to employee: {}", employeeId);
        } catch (Exception e) {
            log.error("Failed to send leave rejected notification to employee: {}", employeeId, e);
        }
    }

    // ==================== APPROVAL NOTIFICATIONS ====================

    /**
     * Send generic approval request notification.
     * Uses generic path (no dedicated notificationType case) with Vietnamese support.
     */
    public void notifyApprovalRequired(UUID approverId, String requestType, String requesterName,
                                       String description, String referenceType, UUID referenceId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userId", approverId);
            request.put("title", "Approval Required: " + requestType);
            request.put("titleVi", "Cần phê duyệt: " + requestType);
            request.put("message", String.format("%s has submitted a %s request: %s",
                    requesterName, requestType, description));
            request.put("messageVi", String.format("%s đã gửi yêu cầu %s: %s",
                    requesterName, requestType, description));
            request.put("type", "approval");
            if (referenceType != null) {
                request.put("referenceType", referenceType);
            }
            if (referenceId != null) {
                request.put("referenceId", referenceId);
            }

            triggerNotification(request);
            log.info("Sent approval request notification to approver: {} type: {}", approverId, requestType);
        } catch (Exception e) {
            log.error("Failed to send approval request notification to approver: {}", approverId, e);
        }
    }

    /**
     * Send generic approval completed notification.
     * Uses generic path (no dedicated notificationType case) with Vietnamese support.
     */
    public void notifyApprovalCompleted(UUID requesterId, String requestType, boolean approved,
                                        String approverName, String reason,
                                        String referenceType, UUID referenceId) {
        try {
            String status = approved ? "Approved" : "Rejected";
            String statusVi = approved ? "được duyệt" : "bị từ chối";
            Map<String, Object> request = new HashMap<>();
            request.put("userId", requesterId);
            request.put("title", requestType + " " + status);
            request.put("titleVi", requestType + " đã " + statusVi);
            request.put("message", String.format("Your %s request has been %s by %s.%s",
                    requestType, status.toLowerCase(), approverName,
                    reason != null ? " Reason: " + reason : ""));
            request.put("messageVi", String.format("Yêu cầu %s của bạn đã %s bởi %s.%s",
                    requestType, statusVi, approverName,
                    reason != null ? " Lý do: " + reason : ""));
            request.put("type", approved ? "success" : "warning");
            if (referenceType != null) {
                request.put("referenceType", referenceType);
            }
            if (referenceId != null) {
                request.put("referenceId", referenceId);
            }

            triggerNotification(request);
            log.info("Sent approval completed notification to requester: {} type: {} status: {}",
                    requesterId, requestType, status);
        } catch (Exception e) {
            log.error("Failed to send approval completed notification to requester: {}", requesterId, e);
        }
    }

    // ==================== BROADCAST NOTIFICATIONS ====================

    /**
     * Send broadcast notification (basic).
     * Maps to controller case "BROADCAST".
     */
    public void sendBroadcast(String title, String message, String type) {
        sendBroadcast(title, null, message, null, type);
    }

    /**
     * Send broadcast notification with Vietnamese support.
     * Maps to controller case "BROADCAST" which calls
     * notificationService.notifyBroadcast(title, titleVi, message, messageVi, type)
     */
    public void sendBroadcast(String title, String titleVi, String message, String messageVi, String type) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "BROADCAST");
            request.put("title", title);
            request.put("message", message);
            request.put("type", type != null ? type : "info");
            if (titleVi != null) {
                request.put("titleVi", titleVi);
            }
            if (messageVi != null) {
                request.put("messageVi", messageVi);
            }

            triggerNotification(request);
            log.info("Sent broadcast notification: {}", title);
        } catch (Exception e) {
            log.error("Failed to send broadcast notification: {}", title, e);
        }
    }

    // ==================== GENERIC / CUSTOM NOTIFICATIONS ====================

    /**
     * Send a custom notification to a single user (English only).
     * Uses generic path (no notificationType).
     */
    public void sendCustomNotification(UUID userId, String title, String message, String type,
                                       String referenceType, UUID referenceId) {
        sendCustomNotificationWithVi(userId, title, null, message, null, type, referenceType, referenceId);
    }

    /**
     * Send a custom notification with Vietnamese support to a single user.
     * Uses generic path with full bilingual content.
     */
    public void sendCustomNotificationWithVi(UUID userId, String title, String titleVi,
                                              String message, String messageVi, String type,
                                              String referenceType, UUID referenceId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userId", userId);
            request.put("title", title);
            request.put("message", message);
            request.put("type", type != null ? type : "info");
            if (titleVi != null) {
                request.put("titleVi", titleVi);
            }
            if (messageVi != null) {
                request.put("messageVi", messageVi);
            }
            if (referenceType != null) {
                request.put("referenceType", referenceType);
            }
            if (referenceId != null) {
                request.put("referenceId", referenceId);
            }

            triggerNotification(request);
            log.info("Sent custom notification to user: {} title: {}", userId, title);
        } catch (Exception e) {
            log.error("Failed to send custom notification to user: {}", userId, e);
        }
    }

    /**
     * Send a custom notification to multiple users (English only).
     * Uses generic path (no notificationType).
     */
    public void sendBulkNotification(List<UUID> userIds, String title, String message, String type,
                                     String referenceType, UUID referenceId) {
        sendBulkNotificationWithVi(userIds, title, null, message, null, type, referenceType, referenceId);
    }

    /**
     * Send a custom notification to multiple users with Vietnamese support.
     * Uses generic path with full bilingual content.
     */
    public void sendBulkNotificationWithVi(List<UUID> userIds, String title, String titleVi,
                                           String message, String messageVi, String type,
                                           String referenceType, UUID referenceId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userIds", userIds);
            request.put("title", title);
            request.put("message", message);
            request.put("type", type != null ? type : "info");
            if (titleVi != null) {
                request.put("titleVi", titleVi);
            }
            if (messageVi != null) {
                request.put("messageVi", messageVi);
            }
            if (referenceType != null) {
                request.put("referenceType", referenceType);
            }
            if (referenceId != null) {
                request.put("referenceId", referenceId);
            }

            triggerNotification(request);
            log.info("Sent bulk notification to {} users title: {}", userIds.size(), title);
        } catch (Exception e) {
            log.error("Failed to send bulk notification to {} users", userIds.size(), e);
        }
    }

    // ==================== CERTIFICATE NOTIFICATIONS ====================

    /**
     * Notify about certificate issued.
     * Uses generic path with bilingual content.
     */
    public void notifyCertificateIssued(UUID userId, String studentName, String courseName, UUID certificateId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userId", userId);
            request.put("title", "Certificate Issued");
            request.put("titleVi", "Chứng chỉ đã cấp");
            request.put("message", String.format("Certificate for %s in course %s has been issued.", studentName, courseName));
            request.put("messageVi", String.format("Chứng chỉ cho %s trong khóa %s đã được cấp.", studentName, courseName));
            request.put("type", "success");
            request.put("referenceType", "certificate");
            if (certificateId != null) {
                request.put("referenceId", certificateId);
            }

            triggerNotification(request);
            log.info("Sent certificate issued notification for student: {} course: {}", studentName, courseName);
        } catch (Exception e) {
            log.error("Failed to send certificate issued notification for student: {}", studentName, e);
        }
    }

    // ==================== CLASS / SCHEDULE NOTIFICATIONS ====================

    /**
     * Notify about class schedule change.
     * Uses generic path with bilingual content for multiple users.
     */
    public void notifyClassScheduleChange(List<UUID> userIds, String className, String changeDescription) {
        notifyClassScheduleChange(userIds, className, changeDescription, null);
    }

    /**
     * Same as {@link #notifyClassScheduleChange(List, String, String)} with optional deep-link target class id.
     */
    public void notifyClassScheduleChange(List<UUID> userIds, String className, String changeDescription, UUID classId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userIds", userIds);
            request.put("title", "Class Schedule Updated");
            request.put("titleVi", "Lịch học đã thay đổi");
            request.put("message", String.format("Schedule for %s has been updated: %s", className, changeDescription));
            request.put("messageVi", String.format("Lịch học lớp %s đã được cập nhật: %s", className, changeDescription));
            request.put("type", "info");
            request.put("referenceType", "class");
            if (classId != null) {
                request.put("referenceId", classId);
            }

            triggerNotification(request);
            log.info("Sent class schedule change notification for class: {} to {} users", className, userIds.size());
        } catch (Exception e) {
            log.error("Failed to send class schedule change notification for class: {}", className, e);
        }
    }

    /**
     * Notify about class cancellation.
     * Uses generic path with bilingual content for multiple users.
     */
    public void notifyClassCancelled(List<UUID> userIds, String className, String date, String reason) {
        notifyClassCancelled(userIds, className, date, reason, null);
    }

    public void notifyClassCancelled(List<UUID> userIds, String className, String date, String reason, UUID classId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userIds", userIds);
            request.put("title", "Class Cancelled");
            request.put("titleVi", "Lớp học bị hủy");
            request.put("message", String.format("Class %s on %s has been cancelled.%s",
                    className, date, reason != null ? " Reason: " + reason : ""));
            request.put("messageVi", String.format("Lớp %s ngày %s đã bị hủy.%s",
                    className, date, reason != null ? " Lý do: " + reason : ""));
            request.put("type", "warning");
            request.put("referenceType", "class");
            if (classId != null) {
                request.put("referenceId", classId);
            }

            triggerNotification(request);
            log.info("Sent class cancelled notification for class: {} on: {}", className, date);
        } catch (Exception e) {
            log.error("Failed to send class cancelled notification for class: {}", className, e);
        }
    }

    /**
     * Fully custom multi-user notification (used e.g. for single session cancellation).
     */
    public void notifyCustomMultiUser(List<UUID> userIds, String title, String titleVi,
                                      String message, String messageVi, String type,
                                      String referenceType, UUID referenceId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userIds", userIds);
            request.put("title", title);
            request.put("titleVi", titleVi);
            request.put("message", message);
            request.put("messageVi", messageVi);
            request.put("type", type != null ? type : "info");
            request.put("referenceType", referenceType);
            if (referenceId != null) {
                request.put("referenceId", referenceId);
            }
            triggerNotification(request);
            log.info("Sent custom notification '{}' to {} users", title, userIds.size());
        } catch (Exception e) {
            log.error("Failed to send custom multi-user notification: {}", title, e);
        }
    }

    // ==================== ASSIGNMENT NOTIFICATIONS ====================

    /**
     * Notify about new assignment.
     * Uses generic path with bilingual content for multiple users.
     */
    public void notifyNewAssignment(List<UUID> studentIds, String assignmentTitle,
                                    String className, String dueDate, UUID assignmentId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userIds", studentIds);
            request.put("title", "New Assignment");
            request.put("titleVi", "Bài tập mới");
            request.put("message", String.format("New assignment '%s' for %s. Due: %s",
                    assignmentTitle, className, dueDate));
            request.put("messageVi", String.format("Bài tập mới '%s' cho lớp %s. Hạn nộp: %s",
                    assignmentTitle, className, dueDate));
            request.put("type", "info");
            request.put("referenceType", "assignment");
            if (assignmentId != null) {
                request.put("referenceId", assignmentId);
            }

            triggerNotification(request);
            log.info("Sent new assignment notification '{}' to {} students", assignmentTitle, studentIds.size());
        } catch (Exception e) {
            log.error("Failed to send new assignment notification: {}", assignmentTitle, e);
        }
    }

    /**
     * Notify about assignment graded.
     * Uses generic path with bilingual content.
     */
    public void notifyAssignmentGraded(UUID studentId, String assignmentTitle,
                                       String grade, UUID assignmentId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userId", studentId);
            request.put("title", "Assignment Graded");
            request.put("titleVi", "Bài tập đã chấm điểm");
            request.put("message", String.format("Your assignment '%s' has been graded: %s",
                    assignmentTitle, grade));
            request.put("messageVi", String.format("Bài tập '%s' của bạn đã được chấm điểm: %s",
                    assignmentTitle, grade));
            request.put("type", "success");
            request.put("referenceType", "assignment");
            if (assignmentId != null) {
                request.put("referenceId", assignmentId);
            }

            triggerNotification(request);
            log.info("Sent assignment graded notification to student: {} for: {}", studentId, assignmentTitle);
        } catch (Exception e) {
            log.error("Failed to send assignment graded notification to student: {}", studentId, e);
        }
    }

    // ==================== TRANSPORT NOTIFICATIONS ====================

    /**
     * Notify about transport schedule update.
     * Uses generic path with bilingual content for multiple users.
     */
    public void notifyTransportUpdate(List<UUID> parentIds, String routeName, String changeDescription) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userIds", parentIds);
            request.put("title", "Transport Schedule Updated");
            request.put("titleVi", "Lịch xe đưa đón đã thay đổi");
            request.put("message", String.format("Transport route '%s' has been updated: %s",
                    routeName, changeDescription));
            request.put("messageVi", String.format("Tuyến xe '%s' đã được cập nhật: %s",
                    routeName, changeDescription));
            request.put("type", "info");
            request.put("referenceType", "transport");

            triggerNotification(request);
            log.info("Sent transport update notification for route: {} to {} parents", routeName, parentIds.size());
        } catch (Exception e) {
            log.error("Failed to send transport update notification for route: {}", routeName, e);
        }
    }

    // ==================== LESSON PLAN NOTIFICATIONS ====================

    /**
     * Notify when a new lesson plan is submitted for review.
     * Uses generic path with bilingual content.
     */
    public void notifyLessonPlanSubmitted(UUID reviewerId, String teacherName, String lessonTitle,
                                          String planDate, UUID lessonPlanId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userId", reviewerId);
            request.put("title", "Lesson Plan Submitted for Review");
            request.put("titleVi", "Giáo án đã nộp để xem xét");
            request.put("message", String.format("%s submitted lesson plan '%s' for %s. Please review.",
                    teacherName, lessonTitle, planDate));
            request.put("messageVi", String.format("%s đã nộp giáo án '%s' cho ngày %s. Vui lòng xem xét.",
                    teacherName, lessonTitle, planDate));
            request.put("type", "approval");
            request.put("referenceType", "lesson_plan");
            if (lessonPlanId != null) {
                request.put("referenceId", lessonPlanId);
            }

            triggerNotification(request);
            log.info("Sent lesson plan submitted notification for: {} to reviewer: {}", lessonTitle, reviewerId);
        } catch (Exception e) {
            log.error("Failed to send lesson plan submitted notification for: {}", lessonTitle, e);
        }
    }

    /**
     * Notify teacher when lesson plan is approved.
     * Uses generic path with bilingual content.
     */
    public void notifyLessonPlanApproved(UUID teacherId, String lessonTitle, String approverName, UUID lessonPlanId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userId", teacherId);
            request.put("title", "Lesson Plan Approved");
            request.put("titleVi", "Giáo án đã được duyệt");
            request.put("message", String.format("Your lesson plan '%s' has been approved by %s.",
                    lessonTitle, approverName));
            request.put("messageVi", String.format("Giáo án '%s' của bạn đã được %s phê duyệt.",
                    lessonTitle, approverName));
            request.put("type", "success");
            request.put("referenceType", "lesson_plan");
            if (lessonPlanId != null) {
                request.put("referenceId", lessonPlanId);
            }

            triggerNotification(request);
            log.info("Sent lesson plan approved notification to teacher: {}", teacherId);
        } catch (Exception e) {
            log.error("Failed to send lesson plan approved notification to teacher: {}", teacherId, e);
        }
    }

    /**
     * Notify teacher when lesson plan is rejected.
     * Uses generic path with bilingual content.
     */
    public void notifyLessonPlanRejected(UUID teacherId, String lessonTitle, String approverName,
                                         String reason, UUID lessonPlanId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userId", teacherId);
            request.put("title", "Lesson Plan Needs Revision");
            request.put("titleVi", "Giáo án cần chỉnh sửa");
            request.put("message", String.format("Your lesson plan '%s' needs revision. Feedback from %s: %s",
                    lessonTitle, approverName, reason != null ? reason : "Please review and resubmit."));
            request.put("messageVi", String.format("Giáo án '%s' cần chỉnh sửa. Nhận xét từ %s: %s",
                    lessonTitle, approverName, reason != null ? reason : "Vui lòng xem lại và nộp lại."));
            request.put("type", "warning");
            request.put("referenceType", "lesson_plan");
            if (lessonPlanId != null) {
                request.put("referenceId", lessonPlanId);
            }

            triggerNotification(request);
            log.info("Sent lesson plan rejected notification to teacher: {}", teacherId);
        } catch (Exception e) {
            log.error("Failed to send lesson plan rejected notification to teacher: {}", teacherId, e);
        }
    }

    // ==================== HOMEWORK NOTIFICATIONS ====================

    /**
     * Notify students/parents about new homework assigned.
     * Uses generic path with bilingual content for multiple users.
     */
    public void notifyHomeworkAssigned(List<UUID> userIds, String homeworkTitle, String className,
                                      String dueDate, UUID assignmentId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userIds", userIds);
            request.put("title", "New Homework Assigned");
            request.put("titleVi", "Bài tập về nhà mới");
            request.put("message", String.format("New homework '%s' for %s. Due: %s",
                    homeworkTitle, className, dueDate));
            request.put("messageVi", String.format("Bài tập về nhà mới '%s' cho lớp %s. Hạn nộp: %s",
                    homeworkTitle, className, dueDate));
            request.put("type", "info");
            request.put("referenceType", "assignment");
            if (assignmentId != null) {
                request.put("referenceId", assignmentId);
            }

            triggerNotification(request);
            log.info("Sent homework assigned notification '{}' to {} users", homeworkTitle, userIds.size());
        } catch (Exception e) {
            log.error("Failed to send homework assigned notification: {}", homeworkTitle, e);
        }
    }

    /**
     * Notify about homework deadline approaching.
     * Uses generic path with bilingual content for multiple users.
     */
    public void notifyHomeworkDeadline(List<UUID> userIds, String homeworkTitle, String className,
                                      String dueDate, int daysRemaining) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userIds", userIds);
            request.put("title", "Homework Deadline Reminder");
            request.put("titleVi", "Nhắc nhở hạn nộp bài tập");
            request.put("message", String.format("Homework '%s' for %s is due in %d day(s) on %s.",
                    homeworkTitle, className, daysRemaining, dueDate));
            request.put("messageVi", String.format("Bài tập '%s' lớp %s còn %d ngày nữa là đến hạn (%s).",
                    homeworkTitle, className, daysRemaining, dueDate));
            request.put("type", daysRemaining <= 1 ? "warning" : "info");
            request.put("referenceType", "assignment");

            triggerNotification(request);
            log.info("Sent homework deadline notification '{}' to {} users ({} days remaining)",
                    homeworkTitle, userIds.size(), daysRemaining);
        } catch (Exception e) {
            log.error("Failed to send homework deadline notification: {}", homeworkTitle, e);
        }
    }

    /**
     * Notify teacher about homework submission.
     * Uses generic path with bilingual content.
     */
    public void notifyHomeworkSubmitted(UUID teacherId, String studentName, String homeworkTitle, UUID submissionId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userId", teacherId);
            request.put("title", "Homework Submitted");
            request.put("titleVi", "Bài tập đã nộp");
            request.put("message", String.format("%s has submitted homework '%s'.", studentName, homeworkTitle));
            request.put("messageVi", String.format("%s đã nộp bài tập '%s'.", studentName, homeworkTitle));
            request.put("type", "info");
            request.put("referenceType", "assignment_submission");
            if (submissionId != null) {
                request.put("referenceId", submissionId);
            }

            triggerNotification(request);
            log.info("Sent homework submitted notification to teacher: {} from student: {}", teacherId, studentName);
        } catch (Exception e) {
            log.error("Failed to send homework submitted notification to teacher: {}", teacherId, e);
        }
    }

    /**
     * Notify student/parent about homework graded.
     * Uses generic path with bilingual content.
     */
    public void notifyHomeworkGraded(UUID userId, String homeworkTitle, String grade,
                                     String feedback, UUID submissionId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userId", userId);
            request.put("title", "Homework Graded");
            request.put("titleVi", "Bài tập đã chấm điểm");
            request.put("message", String.format("Your homework '%s' has been graded: %s.%s",
                    homeworkTitle, grade, feedback != null ? " Feedback: " + feedback : ""));
            request.put("messageVi", String.format("Bài tập '%s' đã được chấm điểm: %s.%s",
                    homeworkTitle, grade, feedback != null ? " Nhận xét: " + feedback : ""));
            request.put("type", "success");
            request.put("referenceType", "assignment_submission");
            if (submissionId != null) {
                request.put("referenceId", submissionId);
            }

            triggerNotification(request);
            log.info("Sent homework graded notification to user: {} for: {}", userId, homeworkTitle);
        } catch (Exception e) {
            log.error("Failed to send homework graded notification to user: {}", userId, e);
        }
    }

    // ==================== CURRICULUM NOTIFICATIONS ====================

    /**
     * Notify teachers about curriculum update.
     * Uses generic path with bilingual content for multiple users.
     */
    public void notifyCurriculumUpdated(List<UUID> teacherIds, String curriculumName, String description) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userIds", teacherIds);
            request.put("title", "Curriculum Updated");
            request.put("titleVi", "Chương trình giảng dạy đã cập nhật");
            request.put("message", String.format("Curriculum '%s' has been updated: %s", curriculumName, description));
            request.put("messageVi", String.format("Chương trình '%s' đã được cập nhật: %s", curriculumName, description));
            request.put("type", "info");
            request.put("referenceType", "curriculum");

            triggerNotification(request);
            log.info("Sent curriculum update notification for: {} to {} teachers", curriculumName, teacherIds.size());
        } catch (Exception e) {
            log.error("Failed to send curriculum update notification for: {}", curriculumName, e);
        }
    }

    // ==================== SYSTEM NOTIFICATIONS ====================

    /**
     * Send system maintenance notification (broadcast to all users).
     * Uses generic path with bilingual content.
     */
    public void notifySystemMaintenance(String scheduledTime, String duration) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "BROADCAST");
            request.put("title", "Scheduled Maintenance");
            request.put("titleVi", "Bảo trì hệ thống");
            request.put("message", String.format("System maintenance scheduled at %s for approximately %s.",
                    scheduledTime, duration));
            request.put("messageVi", String.format("Bảo trì hệ thống dự kiến vào %s trong khoảng %s.",
                    scheduledTime, duration));
            request.put("type", "warning");

            triggerNotification(request);
            log.info("Sent system maintenance notification: {} for {}", scheduledTime, duration);
        } catch (Exception e) {
            log.error("Failed to send system maintenance notification", e);
        }
    }

    /**
     * Send new feature announcement (broadcast to all users).
     * Uses generic path with bilingual content.
     */
    public void notifyNewFeature(String featureName, String description, String descriptionVi) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "BROADCAST");
            request.put("title", "New Feature: " + featureName);
            request.put("titleVi", "Tính năng mới: " + featureName);
            request.put("message", description);
            request.put("messageVi", descriptionVi != null ? descriptionVi : description);
            request.put("type", "info");

            triggerNotification(request);
            log.info("Sent new feature announcement: {}", featureName);
        } catch (Exception e) {
            log.error("Failed to send new feature announcement: {}", featureName, e);
        }
    }

    // ==================== GRADE / REPORT CARD NOTIFICATIONS ====================

    /**
     * Notify parent about student grade report available.
     * Uses generic path with bilingual content.
     */
    public void notifyGradeReportAvailable(UUID parentId, String studentName, String term, UUID reportId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userId", parentId);
            request.put("title", "Grade Report Available");
            request.put("titleVi", "Bảng điểm đã có");
            request.put("message", String.format("Grade report for %s (%s) is now available.", studentName, term));
            request.put("messageVi", String.format("Bảng điểm của %s (%s) đã có.", studentName, term));
            request.put("type", "info");
            request.put("referenceType", "grade_report");
            if (reportId != null) {
                request.put("referenceId", reportId);
            }

            triggerNotification(request);
            log.info("Sent grade report notification for student: {} term: {}", studentName, term);
        } catch (Exception e) {
            log.error("Failed to send grade report notification for student: {}", studentName, e);
        }
    }

    // ==================== DIRECT NOTIFICATION CREATION ====================

    /**
     * Create a notification directly via POST /api/notifications
     * (bypasses the trigger endpoint). Supports centerId field.
     * Use this when you need to set centerId on the notification.
     */
    public void createDirectNotification(UUID userId, String title, String titleVi,
                                         String message, String messageVi,
                                         String type, String referenceType, UUID referenceId,
                                         UUID centerId) {
        try {
            String url = connectServiceUrl + "/api/notifications";

            Map<String, Object> notification = new HashMap<>();
            if (userId != null) {
                notification.put("userId", userId);
            }
            notification.put("title", title);
            notification.put("message", message);
            notification.put("type", type != null ? type : "info");
            notification.put("isRead", false);
            if (titleVi != null) {
                notification.put("titleVi", titleVi);
            }
            if (messageVi != null) {
                notification.put("messageVi", messageVi);
            }
            if (referenceType != null) {
                notification.put("referenceType", referenceType);
            }
            if (referenceId != null) {
                notification.put("referenceId", referenceId);
            }
            if (centerId != null) {
                notification.put("centerId", centerId);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(notification, headers);

            restTemplate.postForEntity(url, request, Object.class);
            log.info("Created direct notification for user: {} title: {}", userId, title);
        } catch (Exception e) {
            log.error("Failed to create direct notification for user: {}: {}", userId, e.getMessage());
        }
    }

    // ==================== READ / QUERY OPERATIONS ====================

    /**
     * Get all notifications for a user (includes broadcasts).
     * Calls GET /api/notifications/user/{userId}
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public List<Map<String, Object>> getNotificationsByUser(UUID userId) {
        try {
            String url = connectServiceUrl + "/api/notifications/user/" + userId;
            ResponseEntity<List> response = restTemplate.getForEntity(url, List.class);
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to get notifications for user: {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Get unread notifications for a user (includes broadcasts).
     * Calls GET /api/notifications/user/{userId}/unread
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public List<Map<String, Object>> getUnreadNotifications(UUID userId) {
        try {
            String url = connectServiceUrl + "/api/notifications/user/" + userId + "/unread";
            ResponseEntity<List> response = restTemplate.getForEntity(url, List.class);
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to get unread notifications for user: {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Get unread notification count for a user.
     * Calls GET /api/notifications/user/{userId}/unread/count
     * Returns the count, or 0 on failure.
     */
    @SuppressWarnings("rawtypes")
    public long getUnreadCount(UUID userId) {
        try {
            String url = connectServiceUrl + "/api/notifications/user/" + userId + "/unread/count";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getBody() != null && response.getBody().containsKey("count")) {
                Object count = response.getBody().get("count");
                return count instanceof Number ? ((Number) count).longValue() : 0L;
            }
            return 0L;
        } catch (Exception e) {
            log.error("Failed to get unread count for user: {}: {}", userId, e.getMessage());
            return 0L;
        }
    }

    // ==================== MARK AS READ OPERATIONS ====================

    /**
     * Mark a single notification as read.
     * Calls PATCH /api/notifications/{id}/read
     */
    public void markNotificationAsRead(UUID notificationId) {
        try {
            String url = connectServiceUrl + "/api/notifications/" + notificationId + "/read";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Void> request = new HttpEntity<>(headers);
            restTemplate.exchange(url, HttpMethod.PATCH, request, Object.class);
            log.debug("Marked notification {} as read", notificationId);
        } catch (Exception e) {
            log.error("Failed to mark notification {} as read: {}", notificationId, e.getMessage());
        }
    }

    /**
     * Mark all notifications as read for a user.
     * Calls PATCH /api/notifications/user/{userId}/read-all
     */
    public void markAllNotificationsAsRead(UUID userId) {
        try {
            String url = connectServiceUrl + "/api/notifications/user/" + userId + "/read-all";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Void> request = new HttpEntity<>(headers);
            restTemplate.exchange(url, HttpMethod.PATCH, request, Object.class);
            log.info("Marked all notifications as read for user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to mark all notifications as read for user: {}: {}", userId, e.getMessage());
        }
    }

    // ==================== DELETE OPERATIONS ====================

    /**
     * Delete a notification by ID.
     * Calls DELETE /api/notifications/{id}
     */
    public void deleteNotification(UUID notificationId) {
        try {
            String url = connectServiceUrl + "/api/notifications/" + notificationId;
            restTemplate.delete(url);
            log.info("Deleted notification: {}", notificationId);
        } catch (Exception e) {
            log.error("Failed to delete notification {}: {}", notificationId, e.getMessage());
        }
    }

    // ==================== BULK CREATE OPERATIONS ====================

    /**
     * Create multiple notifications directly in bulk.
     * Calls POST /api/notifications/bulk
     * Use this when you need to create many notifications at once, bypassing the trigger logic.
     */
    public void createBulkNotifications(List<Map<String, Object>> notifications) {
        try {
            String url = connectServiceUrl + "/api/notifications/bulk";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<List<Map<String, Object>>> request = new HttpEntity<>(notifications, headers);

            restTemplate.postForEntity(url, request, Object.class);
            log.info("Created {} bulk notifications", notifications.size());
        } catch (Exception e) {
            log.error("Failed to create bulk notifications: {}", e.getMessage());
        }
    }

    // ==================== CORE TRIGGER METHOD ====================

    /**
     * Generic notification trigger via Connect Service POST /api/notifications/trigger endpoint.
     * All specific notification methods should use this method.
     * <p>
     * The Connect Service controller handles:
     * - Known notificationType values via a switch-case (ENROLLMENT_APPROVED, EXAM_SCHEDULED, etc.)
     * - Unknown/null notificationType via generic handler that reads title, titleVi, message, messageVi,
     *   type, referenceType, referenceId, userId/userIds directly from the request
     * <p>
     * Notification failures are logged but never propagated to avoid blocking the calling service.
     */
    public void triggerNotification(Map<String, Object> notificationRequest) {
        try {
            String url = connectServiceUrl + "/api/notifications/trigger";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(notificationRequest, headers);

            restTemplate.postForEntity(url, request, Object.class);
            log.debug("Triggered notification: {}", notificationRequest.getOrDefault("notificationType", "CUSTOM"));
        } catch (Exception e) {
            log.error("Failed to trigger notification type={}: {}",
                    notificationRequest.getOrDefault("notificationType", "CUSTOM"), e.getMessage());
        }
    }
}
