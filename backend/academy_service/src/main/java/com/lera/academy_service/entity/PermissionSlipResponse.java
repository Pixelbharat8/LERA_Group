package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * One parent's Yes/No reply to a {@link PermissionSlip} for a specific student.
 * The compound (slipId, studentId) is unique — the parent's last reply wins.
 */
@Entity
@Table(
    name = "permission_slip_responses",
    uniqueConstraints = @UniqueConstraint(columnNames = {"slip_id", "student_id"})
)
@Data
public class PermissionSlipResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "slip_id", nullable = false)
    private UUID slipId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    /** The parent (or guardian) user who recorded the response. */
    @Column(name = "parent_id")
    private UUID parentId;

    /** YES or NO. */
    @Column(nullable = false)
    private String response;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt = LocalDateTime.now();

    @PrePersist
    void onCreate() {
        if (respondedAt == null) respondedAt = LocalDateTime.now();
    }
}
