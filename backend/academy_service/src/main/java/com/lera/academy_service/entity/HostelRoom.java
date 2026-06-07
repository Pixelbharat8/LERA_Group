package com.lera.academy_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** A hostel room. DB-backed (replaces the in-memory HostelController stub). */
@Entity
@Table(name = "hostel_rooms", indexes = {
        @Index(name = "idx_hostel_room_center", columnList = "center_id"),
        @Index(name = "idx_hostel_room_status", columnList = "status")
})
@Data
public class HostelRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank
    @Column(name = "room_number", nullable = false)
    private String roomNumber;

    @Column(name = "block")
    private String block;

    @Column(name = "floor")
    private Integer floor;

    /** Single | Double | Triple | Dormitory */
    @Column(name = "type")
    private String type;

    @Column(name = "capacity")
    private Integer capacity = 1;

    @Column(name = "occupancy")
    private Integer occupancy = 0;

    @Column(name = "monthly_rent")
    private BigDecimal monthlyRent;

    /** AVAILABLE | FULL | MAINTENANCE */
    @Column(name = "status")
    private String status = "AVAILABLE";

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

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
        if (status == null) status = "AVAILABLE";
        if (occupancy == null) occupancy = 0;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }
}
