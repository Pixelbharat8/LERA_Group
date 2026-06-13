package com.lera.connect_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationRequest {
    
    private UUID userId;           // null for broadcast
    private List<UUID> userIds;    // for multiple users
    private String title;
    private String titleVi;
    private String message;
    private String messageVi;
    private String type;           // info, success, warning, error, approval, message, payment
    private String referenceType;  // leave, payment, enrollment, student, exam, etc.
    private UUID referenceId;
    
    // Convenience fields for specific notification types
    private String notificationType; // LEAVE_APPLICATION, LEAVE_APPROVED, PAYMENT_RECEIVED, etc.
    private String employeeName;
    private String studentName;
    private String leaveType;
    private String startDate;
    private String endDate;
    private String approverName;
    private String reason;
    private Double amount;
    private String currency;
    private String courseName;
    private String examName;
    private String className;
    private Integer daysOverdue;
    private Double attendancePercentage;
    private String senderName;
}
