package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vehicle_maintenance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleMaintenance {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private UUID id;

    @Column(name = "vehicle_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID vehicleId;

    @Column(name = "maintenance_type", nullable = false, length = 100)
    private String maintenanceType; // SERVICE, REPAIR, INSPECTION, TIRE_CHANGE

    @Column(name = "maintenance_date", nullable = false)
    private LocalDateTime maintenanceDate;

    @Column(name = "odometer_reading")
    private Double odometerReading;

    @Column(name = "service_center", length = 255)
    private String serviceCenter;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "parts_replaced", columnDefinition = "TEXT")
    private String partsReplaced;

    @Column(name = "cost", nullable = false)
    private Double cost;

    @Column(name = "next_service_date")
    private LocalDateTime nextServiceDate;

    @Column(name = "next_service_odometer")
    private Double nextServiceOdometer;

    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;

    @Column(name = "technician_name", length = 200)
    private String technicianName;

    @Column(name = "status", nullable = false, length = 20)
    private String status; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

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
