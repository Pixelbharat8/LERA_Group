package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private UUID id;

    @Column(name = "vehicle_number", nullable = false, unique = true, length = 50)
    private String vehicleNumber;

    @Column(name = "vehicle_type", nullable = false, length = 50)
    private String vehicleType; // BUS, VAN, CAR, MINI_BUS

    @Column(name = "make", length = 100)
    private String make;

    @Column(name = "model", length = 100)
    private String model;

    @Column(name = "year")
    private Integer year;

    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @Column(name = "registration_number", unique = true, length = 50)
    private String registrationNumber;

    @Column(name = "insurance_number", length = 100)
    private String insuranceNumber;

    @Column(name = "insurance_expiry_date")
    private LocalDateTime insuranceExpiryDate;

    @Column(name = "fitness_certificate_number", length = 100)
    private String fitnessCertificateNumber;

    @Column(name = "fitness_expiry_date")
    private LocalDateTime fitnessExpiryDate;

    @Column(name = "status", nullable = false, length = 20)
    private String status; // ACTIVE, MAINTENANCE, INACTIVE

    @Column(name = "purchase_date")
    private LocalDateTime purchaseDate;

    @Column(name = "last_service_date")
    private LocalDateTime lastServiceDate;

    @Column(name = "next_service_date")
    private LocalDateTime nextServiceDate;

    @Column(name = "fuel_type", length = 50)
    private String fuelType; // DIESEL, PETROL, CNG, ELECTRIC

    @Column(name = "average_mileage")
    private Double averageMileage;

    @Column(name = "current_odometer")
    private Double currentOdometer;

    @Column(name = "gps_device_id", length = 100)
    private String gpsDeviceId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

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
