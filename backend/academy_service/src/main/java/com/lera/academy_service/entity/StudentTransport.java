package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "student_transport")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentTransport {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private UUID id;

    @Column(name = "student_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID studentId;

    @Column(name = "route_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID routeId;

    @Column(name = "stop_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID stopId;

    @Column(name = "transport_type", nullable = false, length = 50)
    private String transportType; // PICKUP, DROP, BOTH

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "monthly_fee")
    private Double monthlyFee;

    @Column(name = "status", nullable = false, length = 20)
    private String status; // ACTIVE, SUSPENDED, INACTIVE

    @Column(name = "parent_phone", length = 20)
    private String parentPhone;

    @Column(name = "emergency_contact", length = 20)
    private String emergencyContact;

    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
