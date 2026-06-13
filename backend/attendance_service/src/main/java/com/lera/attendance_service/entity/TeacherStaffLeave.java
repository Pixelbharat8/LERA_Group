package com.lera.attendance_service.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "teacher_staff_leaves", indexes = {
    @Index(name = "idx_tsl_user", columnList = "user_id"),
    @Index(name = "idx_tsl_center", columnList = "center_id"),
    @Index(name = "idx_tsl_status", columnList = "status"),
    @Index(name = "idx_tsl_date", columnList = "leave_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherStaffLeave {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId; // Teacher or Staff ID

    @Column(name = "center_id", nullable = false)
    private UUID centerId; // Which center

    @Column(name = "reporting_manager_id")
    private UUID reportingManagerId; // Teacher's reporting manager (approver)

    @Column(name = "center_manager_id")
    private UUID centerManagerId; // Center manager (CC only, not approver)

    @Column(name = "user_type", length = 50, nullable = false)
    private String userType; // TEACHER, STAFF, TA, CENTER_ADMIN

    @Column(name = "leave_date", nullable = false)
    private LocalDate leaveDate;

    @Column(name = "end_date")
    private LocalDate endDate; // For multi-day leave

    @Column(name = "leave_type", length = 50, nullable = false)
    private String leaveType; // SICK_LEAVE, CASUAL_LEAVE, EMERGENCY, ANNUAL_LEAVE, MATERNITY, PATERNITY, BEREAVEMENT

    @Column(name = "reason", columnDefinition = "TEXT", nullable = false)
    private String reason;

    @Column(name = "documents", columnDefinition = "TEXT")
    private String documents; // JSON array of document URLs

    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, CANCELLED

    @Column(name = "requested_by", nullable = false)
    private UUID requestedBy; // Usually self

    @Column(name = "requested_at", nullable = false)
    @Builder.Default
    private LocalDateTime requestedAt = LocalDateTime.now();

    @Column(name = "approved_by")
    private UUID approvedBy; // Center Admin or Director

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "is_paid")
    @Builder.Default
    private Boolean isPaid = true; // Paid or unpaid leave

    @Column(name = "days_count")
    private Integer daysCount; // Number of leave days

    @Column(name = "approver_role", length = 50)
    private String approverRole; // CENTER_ADMIN, DIRECTOR, CEO

    @Column(name = "half_day")
    @Builder.Default
    private Boolean halfDay = false;

    @Column(name = "is_advance_leave")
    @Builder.Default
    private Boolean isAdvanceLeave = false; // Advance leave (borrowing from future balance)

    @Column(name = "advance_leave_count")
    @Builder.Default
    private Double advanceLeaveCount = 0.0; // Number of days being taken as advance

    @Column(name = "employment_type", length = 50)
    private String employmentType; // PERMANENT, CONTRACT, PART_TIME, INTERN - Leave only for PERMANENT

    @Column(name = "start_time")
    private java.time.LocalTime startTime; // For half-day leave

    @Column(name = "end_time")
    private java.time.LocalTime endTime; // For half-day leave

    @Column(name = "notification_sent")
    @Builder.Default
    private Boolean notificationSent = false;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments; // Additional comments by approver

    @Column(name = "assigned_approver_id")
    private UUID assignedApproverId; // Chairman can assign specific approver (overrides reporting manager)

    @Column(name = "center_manager_notified")
    @Builder.Default
    private Boolean centerManagerNotified = false; // Center manager in CC (not approver)

    @Column(name = "center_manager_viewed_at")
    private LocalDateTime centerManagerViewedAt; // When center manager viewed (CC only)

    @Column(name = "notified_to_ceo")
    @Builder.Default
    private Boolean notifiedToCeo = false; // CEO visibility

    @Column(name = "notified_to_chairman")
    @Builder.Default
    private Boolean notifiedToChairman = false; // Chairman visibility

    @Column(name = "ceo_viewed_at")
    private LocalDateTime ceoViewedAt;

    @Column(name = "chairman_viewed_at")
    private LocalDateTime chairmanViewedAt;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Helper method to calculate days count
    public void calculateDaysCount() {
        if (endDate != null && leaveDate != null) {
            this.daysCount = (int) java.time.temporal.ChronoUnit.DAYS.between(leaveDate, endDate) + 1;
        } else {
            this.daysCount = halfDay ? 0 : 1; // 0.5 represented as 0, will be calculated differently
        }
    }
}
