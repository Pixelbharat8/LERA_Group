package com.lera.connect_service.controller;

import com.lera.connect_service.dto.CreateNotificationRequest;
import com.lera.connect_service.entity.Notification;
import com.lera.connect_service.repository.NotificationRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import com.lera.connect_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class NotificationController {
    
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<List<Notification>> getAllNotifications(Pageable pageable) {
        return ResponseEntity.ok(notificationRepository.findAll(pageable).getContent());
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getNotificationsByUser(
            @PathVariable UUID userId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID effectiveUser = ConnectSecurity.effectiveNotificationUserId(authUser, userId);
        // Get user-specific notifications
        List<Notification> userNotifications =
                notificationRepository.findByUserIdOrderByCreatedAtDesc(effectiveUser);
        // Get broadcast notifications (user_id is NULL)
        List<Notification> broadcastNotifications = notificationRepository.findByUserIdIsNullOrderByCreatedAtDesc();
        
        // Combine and sort by createdAt desc
        List<Notification> allNotifications = new ArrayList<>();
        allNotifications.addAll(userNotifications);
        allNotifications.addAll(broadcastNotifications);
        allNotifications.sort(Comparator.comparing(Notification::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        
        return ResponseEntity.ok(allNotifications);
    }
    
    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(
            @PathVariable UUID userId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID effectiveUser = ConnectSecurity.effectiveNotificationUserId(authUser, userId);
        // Get user-specific unread notifications
        List<Notification> userNotifications =
                notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(effectiveUser, false);
        // Get broadcast unread notifications
        List<Notification> broadcastNotifications = notificationRepository.findByUserIdIsNullAndIsReadOrderByCreatedAtDesc(false);
        
        // Combine and sort
        List<Notification> allNotifications = new ArrayList<>();
        allNotifications.addAll(userNotifications);
        allNotifications.addAll(broadcastNotifications);
        allNotifications.sort(Comparator.comparing(Notification::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        
        return ResponseEntity.ok(allNotifications);
    }
    
    @GetMapping("/user/{userId}/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @PathVariable UUID userId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID effectiveUser = ConnectSecurity.effectiveNotificationUserId(authUser, userId);
        long userCount = notificationRepository.countByUserIdAndIsRead(effectiveUser, false);
        long broadcastCount = notificationRepository.countByUserIdIsNullAndIsRead(false);
        return ResponseEntity.ok(Map.of("count", userCount + broadcastCount));
    }
    
    /**
     * Create a single notification. Routed through {@link NotificationService}
     * so that {@code PushDispatcher} fires for native push delivery — saving
     * directly via the repository (the previous behaviour) silently dropped
     * mobile pushes.
     */
    @PostMapping
    public ResponseEntity<Notification> createNotification(
            @Valid @RequestBody Notification notification,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertCanCreateNotification(authUser, notification);
        Notification saved = notificationService.createNotification(
                notification.getUserId(),
                notification.getTitle(),
                notification.getTitleVi(),
                notification.getMessage(),
                notification.getMessageVi(),
                notification.getType(),
                notification.getReferenceType(),
                notification.getReferenceId());
        // Honour caller-supplied "isRead"/"centerId" if they were set.
        if (notification.getIsRead() != null && notification.getIsRead()) {
            saved.setIsRead(true);
            saved.setReadAt(LocalDateTime.now());
            notificationRepository.save(saved);
        }
        if (notification.getCenterId() != null) {
            saved.setCenterId(notification.getCenterId());
            notificationRepository.save(saved);
        }
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER')")
    public ResponseEntity<List<Notification>> createBulkNotifications(
            @Valid @RequestBody List<Notification> notifications,
            @AuthenticationPrincipal AuthUser authUser) {
        List<Notification> saved = new ArrayList<>(notifications.size());
        for (Notification n : notifications) {
            ConnectSecurity.assertCanCreateNotification(authUser, n);
            saved.add(notificationService.createNotification(
                    n.getUserId(), n.getTitle(), n.getTitleVi(),
                    n.getMessage(), n.getMessageVi(),
                    n.getType(), n.getReferenceType(), n.getReferenceId()));
        }
        return ResponseEntity.ok(saved);
    }
    
    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return notificationRepository.findById(id).map(notification -> {
            ConnectSecurity.assertCanAccessNotification(authUser, notification);
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            return ResponseEntity.ok(notificationRepository.save(notification));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Mark notification as read - also supports PUT method
     * Frontend calls: PUT /api/notifications/{id}/read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsReadPut(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return markAsRead(id, authUser);
    }

    /**
     * Mark all notifications as read for the authenticated user.
     * Frontend calls: PUT /api/notifications/read-all
     */
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsReadGlobal(
            @AuthenticationPrincipal AuthUser authUser) {
        UUID self = ConnectSecurity.requireUserId(authUser);
        return markAllAsRead(self, authUser);
    }
    
    @PatchMapping("/user/{userId}/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(
            @PathVariable UUID userId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID effectiveUser = ConnectSecurity.effectiveNotificationUserId(authUser, userId);
        List<Notification> unread =
                notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(effectiveUser, false);
        unread.forEach(n -> {
            n.setIsRead(true);
            n.setReadAt(LocalDateTime.now());
        });
        notificationRepository.saveAll(unread);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read", "count", String.valueOf(unread.size())));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return notificationRepository.findById(id)
                .map(n -> {
                    ConnectSecurity.assertCanAccessNotification(authUser, n);
                    notificationRepository.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get notifications filtered by center ID
     * Used by center managers to see only their center's notifications
     */
    @GetMapping("/center/{centerId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER')")
    public ResponseEntity<List<Notification>> getNotificationsByCenter(
            @PathVariable UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = ConnectSecurity.effectiveCenterId(authUser, centerId);
        List<Notification> notifications = notificationRepository.findByCenterIdOrderByCreatedAtDesc(eff);
        return ResponseEntity.ok(notifications);
    }
    
    // ==================== SERVICE-TO-SERVICE ENDPOINTS ====================
    // These endpoints are called by other services to create notifications
    
    /**
     * Generic endpoint to create notification from any service
     */
    @PreAuthorize("hasRole('INTERNAL_SERVICE') or hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    @PostMapping("/trigger")
    public ResponseEntity<List<Notification>> triggerNotification(@Valid @RequestBody CreateNotificationRequest request) {
        List<Notification> notifications = new ArrayList<>();
        
        // Handle notification based on notificationType
        if (request.getNotificationType() != null) {
            switch (request.getNotificationType()) {
                case "LEAVE_APPLICATION":
                    notifications = notificationService.notifyLeaveApplication(
                        request.getUserId(), // employee applying
                        request.getEmployeeName(),
                        request.getLeaveType(),
                        request.getStartDate(),
                        request.getEndDate()
                    );
                    break;
                    
                case "LEAVE_APPROVED":
                    Notification approvedNotif = notificationService.notifyLeaveApproved(
                        request.getUserId(), // employee who applied
                        request.getLeaveType(),
                        request.getStartDate(),
                        request.getEndDate(),
                        request.getApproverName()
                    );
                    notifications.add(approvedNotif);
                    break;
                    
                case "LEAVE_REJECTED":
                    Notification rejectedNotif = notificationService.notifyLeaveRejected(
                        request.getUserId(),
                        request.getLeaveType(),
                        request.getStartDate(),
                        request.getEndDate(),
                        request.getApproverName(),
                        request.getReason()
                    );
                    notifications.add(rejectedNotif);
                    break;
                    
                case "PAYMENT_RECEIVED":
                    Notification paymentNotif = notificationService.notifyPaymentReceived(
                        request.getUserId(), // parent
                        request.getStudentName(),
                        request.getAmount(),
                        request.getCurrency(),
                        request.getReferenceId()
                    );
                    notifications.add(paymentNotif);
                    break;
                    
                case "PAYMENT_DUE":
                    Notification dueNotif = notificationService.notifyPaymentDue(
                        request.getUserId(),
                        request.getStudentName(),
                        request.getAmount(),
                        request.getCurrency(),
                        request.getDaysOverdue()
                    );
                    notifications.add(dueNotif);
                    break;
                    
                case "ENROLLMENT_APPROVED":
                    Notification enrollApprovedNotif = notificationService.notifyEnrollmentApproved(
                        request.getUserId(), // parent
                        request.getStudentName(),
                        request.getCourseName(),
                        request.getReferenceId()
                    );
                    notifications.add(enrollApprovedNotif);
                    break;
                    
                case "ENROLLMENT_REJECTED":
                    Notification enrollRejectedNotif = notificationService.notifyEnrollmentRejected(
                        request.getUserId(),
                        request.getStudentName(),
                        request.getCourseName(),
                        request.getReason()
                    );
                    notifications.add(enrollRejectedNotif);
                    break;
                    
                case "NEW_ENROLLMENT":
                    notifications = notificationService.notifyNewEnrollment(
                        request.getStudentName(),
                        request.getCourseName(),
                        request.getUserIds() // admin IDs to notify
                    );
                    break;
                    
                case "EXAM_SCHEDULED":
                    // Field mapping: studentName=examName (from client), examName=examDate, startDate=className
                    // This is a known field reuse pattern where:
                    //   - client sets studentName = actual exam name
                    //   - client sets examName = actual exam date  
                    //   - client sets startDate = actual class name
                    notifications = notificationService.notifyExamScheduled(
                        request.getStudentName(),  // examName
                        request.getExamName(),     // examDate
                        request.getStartDate(),    // className
                        request.getUserIds()       // studentIds
                    );
                    break;
                    
                case "EXAM_RESULT":
                    Notification resultNotif = notificationService.notifyExamResult(
                        request.getUserId(),
                        request.getStudentName(),
                        request.getExamName(),
                        request.getReferenceId()
                    );
                    notifications.add(resultNotif);
                    break;
                    
                case "ATTENDANCE_LOW":
                    Notification attendanceNotif = notificationService.notifyLowAttendance(
                        request.getUserId(),
                        request.getStudentName(),
                        request.getAttendancePercentage(),
                        request.getClassName()
                    );
                    notifications.add(attendanceNotif);
                    break;
                    
                case "NEW_MESSAGE":
                    Notification msgNotif = notificationService.notifyNewMessage(
                        request.getUserId(),
                        request.getSenderName(),
                        request.getMessage(),
                        request.getReferenceId()
                    );
                    notifications.add(msgNotif);
                    break;
                    
                case "TASK_ASSIGNED":
                    Notification taskNotif = notificationService.notifyTaskAssigned(
                        request.getUserId(),
                        request.getTitle(),
                        request.getReferenceId(),
                        request.getSenderName()
                    );
                    notifications.add(taskNotif);
                    break;
                    
                case "BROADCAST":
                    Notification broadcastNotif = notificationService.notifyBroadcast(
                        request.getTitle(),
                        request.getTitleVi(),
                        request.getMessage(),
                        request.getMessageVi(),
                        request.getType() != null ? request.getType() : "info"
                    );
                    notifications.add(broadcastNotif);
                    break;
                    
                default:
                    // Generic notification
                    if (request.getUserIds() != null && !request.getUserIds().isEmpty()) {
                        for (UUID userId : request.getUserIds()) {
                            Notification notif = notificationService.createNotificationWithVi(
                                userId,
                                request.getTitle(),
                                request.getTitleVi(),
                                request.getMessage(),
                                request.getMessageVi(),
                                request.getType() != null ? request.getType() : "info",
                                request.getReferenceType(),
                                request.getReferenceId()
                            );
                            notifications.add(notif);
                        }
                    } else if (request.getUserId() != null) {
                        Notification notif = notificationService.createNotificationWithVi(
                            request.getUserId(),
                            request.getTitle(),
                            request.getTitleVi(),
                            request.getMessage(),
                            request.getMessageVi(),
                            request.getType() != null ? request.getType() : "info",
                            request.getReferenceType(),
                            request.getReferenceId()
                        );
                        notifications.add(notif);
                    }
            }
        } else {
            // No notificationType - create generic notification
            if (request.getUserIds() != null && !request.getUserIds().isEmpty()) {
                for (UUID userId : request.getUserIds()) {
                    Notification notif = notificationService.createNotificationWithVi(
                        userId,
                        request.getTitle(),
                        request.getTitleVi(),
                        request.getMessage(),
                        request.getMessageVi(),
                        request.getType() != null ? request.getType() : "info",
                        request.getReferenceType(),
                        request.getReferenceId()
                    );
                    notifications.add(notif);
                }
            } else {
                Notification notif = notificationService.createNotificationWithVi(
                    request.getUserId(),
                    request.getTitle(),
                    request.getTitleVi(),
                    request.getMessage(),
                    request.getMessageVi(),
                    request.getType() != null ? request.getType() : "info",
                    request.getReferenceType(),
                    request.getReferenceId()
                );
                notifications.add(notif);
            }
        }
        
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * Endpoint for leave application notifications (called by attendance_service)
     */
    @PreAuthorize("hasRole('INTERNAL_SERVICE') or hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    @PostMapping("/trigger/leave-application")
    public ResponseEntity<List<Notification>> triggerLeaveApplication(
            @RequestParam UUID employeeId,
            @RequestParam String employeeName,
            @RequestParam String leaveType,
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false) UUID leaveId) {
        List<Notification> notifications = notificationService.notifyLeaveApplication(
            employeeId, employeeName, leaveType, startDate, endDate
        );
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * Endpoint for leave approval notifications
     */
    @PreAuthorize("hasRole('INTERNAL_SERVICE') or hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    @PostMapping("/trigger/leave-approved")
    public ResponseEntity<Notification> triggerLeaveApproved(
            @RequestParam UUID employeeId,
            @RequestParam String leaveType,
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam String approverName) {
        Notification notification = notificationService.notifyLeaveApproved(
            employeeId, leaveType, startDate, endDate, approverName
        );
        return ResponseEntity.ok(notification);
    }
    
    /**
     * Endpoint for leave rejection notifications
     */
    @PreAuthorize("hasRole('INTERNAL_SERVICE') or hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    @PostMapping("/trigger/leave-rejected")
    public ResponseEntity<Notification> triggerLeaveRejected(
            @RequestParam UUID employeeId,
            @RequestParam String leaveType,
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam String approverName,
            @RequestParam(required = false) String reason) {
        Notification notification = notificationService.notifyLeaveRejected(
            employeeId, leaveType, startDate, endDate, approverName, reason
        );
        return ResponseEntity.ok(notification);
    }
    
    /**
     * Endpoint for payment received notifications (called by payment_service)
     */
    @PreAuthorize("hasRole('INTERNAL_SERVICE') or hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    @PostMapping("/trigger/payment-received")
    public ResponseEntity<Notification> triggerPaymentReceived(
            @RequestParam UUID parentId,
            @RequestParam String studentName,
            @RequestParam Double amount,
            @RequestParam String currency,
            @RequestParam(required = false) UUID paymentId) {
        Notification notification = notificationService.notifyPaymentReceived(
            parentId, studentName, amount, currency, paymentId
        );
        return ResponseEntity.ok(notification);
    }
    
    /**
     * Endpoint for new enrollment notifications (called by academy_service)
     */
    @PreAuthorize("hasRole('INTERNAL_SERVICE') or hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    @PostMapping("/trigger/new-enrollment")
    public ResponseEntity<List<Notification>> triggerNewEnrollment(
            @RequestParam String studentName,
            @RequestParam String courseName,
            @Valid @RequestBody List<UUID> adminIds) {
        List<Notification> notifications = notificationService.notifyNewEnrollment(
            studentName, courseName, adminIds
        );
        return ResponseEntity.ok(notifications);
    }
    
    /**
     * Endpoint for broadcast notifications
     */
    @PreAuthorize("hasRole('INTERNAL_SERVICE') or hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    @PostMapping("/trigger/broadcast")
    public ResponseEntity<Notification> triggerBroadcast(
            @RequestParam String title,
            @RequestParam(required = false) String titleVi,
            @RequestParam String message,
            @RequestParam(required = false) String messageVi,
            @RequestParam(defaultValue = "info") String type) {
        Notification notification = notificationService.notifyBroadcast(
            title, titleVi, message, messageVi, type
        );
        return ResponseEntity.ok(notification);
    }
}
