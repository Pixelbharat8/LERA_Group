package com.lera.academy_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/** A student's hostel room registration. DB-backed. */
@Entity
@Table(name = "hostel_registrations", indexes = {
        @Index(name = "idx_hostel_reg_room", columnList = "room_id"),
        @Index(name = "idx_hostel_reg_student", columnList = "student_id"),
        @Index(name = "idx_hostel_reg_status", columnList = "status")
})
@Data
public class HostelRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "room_id")
    private UUID roomId;

    /** PENDING | APPROVED | REJECTED | CHECKED_OUT */
    @Column(name = "status")
    private String status = "PENDING";

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "center_id")
    private UUID centerId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (status == null) status = "PENDING";
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }
}
