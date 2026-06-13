package com.lera.connect_service.service;

import com.lera.connect_service.entity.Notification;
import com.lera.connect_service.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final PushDispatcher pushDispatcher;
    
    /**
     * Create a notification for a specific user
     */
    public Notification createNotification(UUID userId, String title, String message, String type) {
        return createNotification(userId, title, null, message, null, type, null, null);
    }
    
    /**
     * Create a notification with reference to another entity - with Vietnamese support
     */
    public Notification createNotificationWithVi(UUID userId, String title, String titleVi, 
                                           String message, String messageVi, 
                                           String type, String referenceType, UUID referenceId) {
        return createNotification(userId, title, titleVi, message, messageVi, type, referenceType, referenceId);
    }
    
    /**
     * Create a notification with reference to another entity
     */
    public Notification createNotification(UUID userId, String title, String titleVi, 
                                           String message, String messageVi, 
                                           String type, String referenceType, UUID referenceId) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setTitleVi(titleVi);
        notification.setMessage(message);
        notification.setMessageVi(messageVi);
        notification.setType(type);
        notification.setReferenceType(referenceType);
        notification.setReferenceId(referenceId);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        
        Notification saved = notificationRepository.save(notification);
        log.info("Created notification for user {}: {}", userId, title);
        pushDispatcher.send(userId, title, message);
        return saved;
    }
    
    /**
     * Create a broadcast notification (for all users)
     */
    public Notification createBroadcastNotification(String title, String titleVi, 
                                                    String message, String messageVi, String type) {
        return createNotification(null, title, titleVi, message, messageVi, type, null, null);
    }
    
    /**
     * Create notifications for multiple users
     */
    public List<Notification> createNotificationsForUsers(List<UUID> userIds, String title, 
                                                          String message, String type, 
                                                          String referenceType, UUID referenceId) {
        return userIds.stream()
                .map(userId -> createNotification(userId, title, null, message, null, type, referenceType, referenceId))
                .toList();
    }
    
    // ============ LEAVE NOTIFICATIONS ============
    
    /**
     * Notify manager when employee applies for leave (returns list for multiple managers)
     */
    public List<Notification> notifyLeaveApplication(UUID employeeId, String employeeName, 
                                               String leaveType, String startDate, String endDate) {
        // For now, create a single notification - in a full implementation, 
        // this would look up managers and create notifications for each
        Notification notification = notifyLeaveApplication(employeeId, employeeName, leaveType, startDate, endDate, null);
        return List.of(notification);
    }
    
    /**
     * Notify manager when employee applies for leave
     */
    public Notification notifyLeaveApplication(UUID managerId, String employeeName, 
                                               String leaveType, String startDate, String endDate,
                                               UUID leaveId) {
        String title = "Leave Application Received";
        String titleVi = "Đơn xin nghỉ phép mới";
        String message = String.format("%s has applied for %s leave from %s to %s. Please review and approve/reject.", 
                employeeName, leaveType, startDate, endDate);
        String messageVi = String.format("%s đã nộp đơn xin nghỉ %s từ %s đến %s. Vui lòng xem xét và phê duyệt/từ chối.", 
                employeeName, leaveType, startDate, endDate);
        
        return createNotification(managerId, title, titleVi, message, messageVi, "approval", "leave", leaveId);
    }
    
    /**
     * Notify employee when leave is approved (without leaveId)
     */
    public Notification notifyLeaveApproved(UUID employeeId, String leaveType, 
                                            String startDate, String endDate, String approverName) {
        return notifyLeaveApproved(employeeId, leaveType, startDate, endDate, approverName, null);
    }
    
    /**
     * Notify employee when leave is approved
     */
    public Notification notifyLeaveApproved(UUID employeeId, String leaveType, 
                                            String startDate, String endDate, String approverName,
                                            UUID leaveId) {
        String title = "Leave Approved";
        String titleVi = "Đơn nghỉ phép được duyệt";
        String message = String.format("Your %s leave from %s to %s has been approved by %s.", 
                leaveType, startDate, endDate, approverName);
        String messageVi = String.format("Đơn nghỉ %s từ %s đến %s của bạn đã được %s phê duyệt.", 
                leaveType, startDate, endDate, approverName);
        
        return createNotification(employeeId, title, titleVi, message, messageVi, "success", "leave", leaveId);
    }
    
    /**
     * Notify employee when leave is rejected (without leaveId)
     */
    public Notification notifyLeaveRejected(UUID employeeId, String leaveType, 
                                            String startDate, String endDate, String approverName, 
                                            String reason) {
        return notifyLeaveRejected(employeeId, leaveType, startDate, endDate, approverName, reason, null);
    }
    
    /**
     * Notify employee when leave is rejected
     */
    public Notification notifyLeaveRejected(UUID employeeId, String leaveType, 
                                            String startDate, String endDate, String approverName, 
                                            String reason, UUID leaveId) {
        String title = "Leave Rejected";
        String titleVi = "Đơn nghỉ phép bị từ chối";
        String message = String.format("Your %s leave from %s to %s has been rejected by %s. Reason: %s", 
                leaveType, startDate, endDate, approverName, reason != null ? reason : "Not specified");
        String messageVi = String.format("Đơn nghỉ %s từ %s đến %s của bạn đã bị %s từ chối. Lý do: %s", 
                leaveType, startDate, endDate, approverName, reason != null ? reason : "Không xác định");
        
        return createNotification(employeeId, title, titleVi, message, messageVi, "warning", "leave", leaveId);
    }
    
    // ============ ATTENDANCE NOTIFICATIONS ============
    
    /**
     * Notify about low attendance
     */
    public Notification notifyLowAttendance(UUID userId, String studentName, 
                                            double attendancePercentage, UUID studentId) {
        String title = "Low Attendance Alert";
        String titleVi = "Cảnh báo điểm danh thấp";
        String message = String.format("%s's attendance has dropped to %.1f%%. Please follow up.", 
                studentName, attendancePercentage);
        String messageVi = String.format("Tỷ lệ điểm danh của %s đã giảm xuống %.1f%%. Vui lòng theo dõi.", 
                studentName, attendancePercentage);
        
        return createNotification(userId, title, titleVi, message, messageVi, "warning", "student", studentId);
    }
    
    /**
     * Daily attendance reminder
     */
    public Notification notifyAttendanceReminder(UUID teacherId, String className) {
        String title = "Mark Attendance";
        String titleVi = "Điểm danh lớp học";
        String message = String.format("Please mark attendance for %s today.", className);
        String messageVi = String.format("Vui lòng điểm danh cho lớp %s hôm nay.", className);
        
        return createNotification(teacherId, title, titleVi, message, messageVi, "info", null, null);
    }
    
    // ============ PAYMENT NOTIFICATIONS ============
    
    /**
     * Notify about payment received
     */
    public Notification notifyPaymentReceived(UUID userId, String studentName, 
                                              double amount, String currency, UUID paymentId) {
        String title = "Payment Received";
        String titleVi = "Đã nhận thanh toán";
        String message = String.format("Payment of %,.0f %s received for %s.", amount, currency, studentName);
        String messageVi = String.format("Đã nhận thanh toán %,.0f %s cho %s.", amount, currency, studentName);
        
        return createNotification(userId, title, titleVi, message, messageVi, "success", "payment", paymentId);
    }
    
    /**
     * Notify about overdue payment
     */
    public Notification notifyPaymentOverdue(UUID parentId, String studentName, 
                                             double amount, String currency, int daysOverdue, UUID feeId) {
        String title = "Payment Overdue";
        String titleVi = "Thanh toán quá hạn";
        String message = String.format("Payment of %,.0f %s for %s is %d days overdue. Please pay immediately.", 
                amount, currency, studentName, daysOverdue);
        String messageVi = String.format("Thanh toán %,.0f %s cho %s đã quá hạn %d ngày. Vui lòng thanh toán ngay.", 
                amount, currency, studentName, daysOverdue);
        
        return createNotification(parentId, title, titleVi, message, messageVi, "warning", "fee", feeId);
    }
    
    /**
     * Notify about upcoming payment due
     */
    public Notification notifyPaymentDueSoon(UUID parentId, String studentName, 
                                             double amount, String currency, String dueDate, UUID feeId) {
        String title = "Payment Due Soon";
        String titleVi = "Sắp đến hạn thanh toán";
        String message = String.format("Payment of %,.0f %s for %s is due on %s.", 
                amount, currency, studentName, dueDate);
        String messageVi = String.format("Thanh toán %,.0f %s cho %s sẽ đến hạn vào %s.", 
                amount, currency, studentName, dueDate);
        
        return createNotification(parentId, title, titleVi, message, messageVi, "info", "fee", feeId);
    }
    
    // ============ ENROLLMENT NOTIFICATIONS ============
    
    /**
     * Notify admin about new enrollment
     */
    public Notification notifyNewEnrollment(UUID adminId, String studentName, 
                                            String courseName, UUID enrollmentId) {
        String title = "New Enrollment Request";
        String titleVi = "Đăng ký học viên mới";
        String message = String.format("New enrollment request: %s wants to join %s. Please review.", 
                studentName, courseName);
        String messageVi = String.format("Yêu cầu đăng ký mới: %s muốn tham gia khóa %s. Vui lòng xem xét.", 
                studentName, courseName);
        
        return createNotification(adminId, title, titleVi, message, messageVi, "approval", "enrollment", enrollmentId);
    }
    
    /**
     * Notify parent about enrollment approved
     */
    public Notification notifyEnrollmentApproved(UUID parentId, String studentName, 
                                                 String courseName, UUID enrollmentId) {
        String title = "Enrollment Approved";
        String titleVi = "Đăng ký được duyệt";
        String message = String.format("%s has been successfully enrolled in %s.", studentName, courseName);
        String messageVi = String.format("%s đã được đăng ký thành công vào khóa %s.", studentName, courseName);
        
        return createNotification(parentId, title, titleVi, message, messageVi, "success", "enrollment", enrollmentId);
    }
    
    // ============ EXAM NOTIFICATIONS ============
    
    /**
     * Notify about upcoming exam
     */
    public Notification notifyUpcomingExam(UUID userId, String examName, 
                                           String examDate, String className, UUID examId) {
        String title = "Upcoming Exam";
        String titleVi = "Kỳ thi sắp tới";
        String message = String.format("Reminder: %s for %s is scheduled on %s.", examName, className, examDate);
        String messageVi = String.format("Nhắc nhở: %s cho lớp %s sẽ diễn ra vào %s.", examName, className, examDate);
        
        return createNotification(userId, title, titleVi, message, messageVi, "info", "exam", examId);
    }
    
    /**
     * Notify about exam results available
     */
    public Notification notifyExamResults(UUID parentId, String studentName, 
                                          String examName, UUID examId) {
        String title = "Exam Results Available";
        String titleVi = "Kết quả thi đã có";
        String message = String.format("Results for %s's %s are now available.", studentName, examName);
        String messageVi = String.format("Kết quả %s của %s đã có.", examName, studentName);
        
        return createNotification(parentId, title, titleVi, message, messageVi, "info", "exam", examId);
    }
    
    // ============ MESSAGE NOTIFICATIONS ============
    
    /**
     * Notify about new message
     */
    public Notification notifyNewMessage(UUID recipientId, String senderName, UUID messageId) {
        String title = "New Message";
        String titleVi = "Tin nhắn mới";
        String message = String.format("You have a new message from %s.", senderName);
        String messageVi = String.format("Bạn có tin nhắn mới từ %s.", senderName);
        
        return createNotification(recipientId, title, titleVi, message, messageVi, "message", "message", messageId);
    }
    
    // ============ APPROVAL NOTIFICATIONS ============
    
    /**
     * Generic approval request notification
     */
    public Notification notifyApprovalRequired(UUID approverId, String requestType, 
                                               String requesterName, String description,
                                               String referenceType, UUID referenceId) {
        String title = "Approval Required: " + requestType;
        String titleVi = "Cần phê duyệt: " + requestType;
        String message = String.format("%s has submitted a %s request: %s", requesterName, requestType, description);
        String messageVi = String.format("%s đã gửi yêu cầu %s: %s", requesterName, requestType, description);
        
        return createNotification(approverId, title, titleVi, message, messageVi, "approval", referenceType, referenceId);
    }
    
    /**
     * Generic approval completed notification
     */
    public Notification notifyApprovalCompleted(UUID requesterId, String requestType, 
                                                boolean approved, String approverName, String reason,
                                                String referenceType, UUID referenceId) {
        String status = approved ? "Approved" : "Rejected";
        String statusVi = approved ? "được duyệt" : "bị từ chối";
        String type = approved ? "success" : "warning";
        
        String title = requestType + " " + status;
        String titleVi = requestType + " đã " + statusVi;
        String message = String.format("Your %s request has been %s by %s.%s", 
                requestType, status.toLowerCase(), approverName,
                reason != null ? " Reason: " + reason : "");
        String messageVi = String.format("Yêu cầu %s của bạn đã %s bởi %s.%s", 
                requestType, statusVi, approverName,
                reason != null ? " Lý do: " + reason : "");
        
        return createNotification(requesterId, title, titleVi, message, messageVi, type, referenceType, referenceId);
    }
    
    // ============ SYSTEM NOTIFICATIONS ============
    
    /**
     * System maintenance notification
     */
    public Notification notifySystemMaintenance(String scheduledTime, String duration) {
        String title = "Scheduled Maintenance";
        String titleVi = "Bảo trì hệ thống";
        String message = String.format("System maintenance scheduled at %s for approximately %s.", scheduledTime, duration);
        String messageVi = String.format("Bảo trì hệ thống dự kiến vào %s trong khoảng %s.", scheduledTime, duration);
        
        return createBroadcastNotification(title, titleVi, message, messageVi, "warning");
    }
    
    /**
     * New feature announcement
     */
    public Notification notifyNewFeature(String featureName, String description) {
        String title = "New Feature: " + featureName;
        String titleVi = "Tính năng mới: " + featureName;
        String message = description;
        String messageVi = description; // Would need translation
        
        return createBroadcastNotification(title, titleVi, message, messageVi, "info");
    }
    
    // ============ ADDITIONAL NOTIFICATION METHODS ============
    
    /**
     * Notify about payment due (overdue)
     */
    public Notification notifyPaymentDue(UUID parentId, String studentName, 
                                         Double amount, String currency, Integer daysOverdue) {
        String title = "Payment Overdue";
        String titleVi = "Thanh toán quá hạn";
        String message = String.format("Payment of %,.0f %s for %s is %d days overdue.", 
                amount, currency, studentName, daysOverdue != null ? daysOverdue : 0);
        String messageVi = String.format("Thanh toán %,.0f %s cho %s đã quá hạn %d ngày.", 
                amount, currency, studentName, daysOverdue != null ? daysOverdue : 0);
        
        return createNotification(parentId, title, titleVi, message, messageVi, "warning", "payment", null);
    }
    
    /**
     * Notify multiple admins about new enrollment
     */
    public List<Notification> notifyNewEnrollment(String studentName, String courseName, List<UUID> adminIds) {
        if (adminIds == null || adminIds.isEmpty()) {
            return List.of();
        }
        return adminIds.stream()
                .map(adminId -> notifyNewEnrollment(adminId, studentName, courseName, null))
                .toList();
    }
    
    /**
     * Notify about enrollment rejected
     */
    public Notification notifyEnrollmentRejected(UUID parentId, String studentName, 
                                                 String courseName, String reason) {
        String title = "Enrollment Rejected";
        String titleVi = "Đăng ký bị từ chối";
        String message = String.format("Enrollment of %s in %s has been rejected. %s", 
                studentName, courseName, reason != null ? "Reason: " + reason : "");
        String messageVi = String.format("Đăng ký của %s vào khóa %s đã bị từ chối. %s", 
                studentName, courseName, reason != null ? "Lý do: " + reason : "");
        
        return createNotification(parentId, title, titleVi, message, messageVi, "warning", "enrollment", null);
    }
    
    /**
     * Notify multiple students about exam scheduled
     */
    public List<Notification> notifyExamScheduled(String examName, String examDate, 
                                                  String className, List<UUID> studentIds) {
        if (studentIds == null || studentIds.isEmpty()) {
            return List.of();
        }
        return studentIds.stream()
                .map(studentId -> notifyUpcomingExam(studentId, examName, examDate, className, null))
                .toList();
    }
    
    /**
     * Notify about exam result available
     */
    public Notification notifyExamResult(UUID parentId, String studentName, 
                                         String examName, UUID examId) {
        return notifyExamResults(parentId, studentName, examName, examId);
    }
    
    /**
     * Notify about low attendance with class name
     */
    public Notification notifyLowAttendance(UUID userId, String studentName, 
                                            Double attendancePercentage, String className) {
        String title = "Low Attendance Alert";
        String titleVi = "Cảnh báo điểm danh thấp";
        String message = String.format("%s's attendance in %s has dropped to %.1f%%. Please follow up.", 
                studentName, className, attendancePercentage != null ? attendancePercentage : 0.0);
        String messageVi = String.format("Tỷ lệ điểm danh của %s trong lớp %s đã giảm xuống %.1f%%. Vui lòng theo dõi.", 
                studentName, className, attendancePercentage != null ? attendancePercentage : 0.0);
        
        return createNotification(userId, title, titleVi, message, messageVi, "warning", "attendance", null);
    }
    
    /**
     * Notify about new message with preview
     */
    public Notification notifyNewMessage(UUID recipientId, String senderName, 
                                         String messagePreview, UUID messageId) {
        String title = "New Message from " + senderName;
        String titleVi = "Tin nhắn mới từ " + senderName;
        String message = messagePreview != null && messagePreview.length() > 100 
                ? messagePreview.substring(0, 100) + "..." : messagePreview;
        String messageVi = message; // Would need translation
        
        return createNotification(recipientId, title, titleVi, message, messageVi, "message", "message", messageId);
    }
    
    /**
     * Notify about task assigned
     */
    public Notification notifyTaskAssigned(UUID assigneeId, String taskTitle, 
                                           UUID taskId, String assignerName) {
        String title = "New Task Assigned";
        String titleVi = "Nhiệm vụ mới được giao";
        String message = String.format("%s has assigned you a task: %s", assignerName, taskTitle);
        String messageVi = String.format("%s đã giao cho bạn nhiệm vụ: %s", assignerName, taskTitle);
        
        return createNotification(assigneeId, title, titleVi, message, messageVi, "info", "task", taskId);
    }
    
    /**
     * Create a broadcast notification with Vietnamese support
     */
    public Notification notifyBroadcast(String title, String titleVi, 
                                        String message, String messageVi, String type) {
        return createBroadcastNotification(
            title, 
            titleVi != null ? titleVi : title, 
            message, 
            messageVi != null ? messageVi : message, 
            type
        );
    }
}
