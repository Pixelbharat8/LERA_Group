package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "gps_tracking")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GpsTracking {

    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private UUID id;

    @Column(name = "vehicle_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID vehicleId;

    @Column(name = "schedule_id", columnDefinition = "VARCHAR(36)")
    private UUID scheduleId;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "speed")
    private Double speed; // in km/h

    @Column(name = "heading")
    private Double heading; // direction in degrees

    @Column(name = "accuracy")
    private Double accuracy; // in meters

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "ignition_status", length = 20)
    private String ignitionStatus; // ON, OFF

    @Column(name = "fuel_level")
    private Double fuelLevel; // percentage

    @Column(name = "battery_voltage")
    private Double batteryVoltage;

    @Column(name = "odometer")
    private Double odometer;

    @Column(name = "nearest_landmark", length = 255)
    private String nearestLandmark;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
