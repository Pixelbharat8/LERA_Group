package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sport_facilities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportFacility {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "facility_name", nullable = false)
    private String facilityName;

    @Column(name = "facility_code", unique = true, length = 50)
    private String facilityCode;

    @Column(name = "facility_type", length = 50)
    private String facilityType; // FIELD, COURT, POOL, GYM, TRACK, HALL

    @Column(name = "sport_type_id")
    private UUID sportTypeId;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 200)
    private String location;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "dimensions", length = 100)
    private String dimensions; // e.g., "100m x 60m"

    @Column(name = "surface_type", length = 50)
    private String surfaceType; // GRASS, ARTIFICIAL_TURF, CONCRETE, WOODEN, CLAY

    @Column(name = "is_indoor")
    @Builder.Default
    private Boolean isIndoor = false;

    @Column(name = "has_lighting")
    @Builder.Default
    private Boolean hasLighting = false;

    @Column(name = "has_seating")
    @Builder.Default
    private Boolean hasSeating = false;

    @Column(name = "seating_capacity")
    private Integer seatingCapacity;

    @Column(name = "booking_required")
    @Builder.Default
    private Boolean bookingRequired = true;

    @Column(name = "hourly_rate", precision = 10, scale = 2)
    private java.math.BigDecimal hourlyRate;

    @Column(length = 50)
    @Builder.Default
    private String status = "AVAILABLE"; // AVAILABLE, OCCUPIED, MAINTENANCE, CLOSED

    @Column(name = "last_maintenance_date")
    private java.time.LocalDate lastMaintenanceDate;

    @Column(name = "next_maintenance_date")
    private java.time.LocalDate nextMaintenanceDate;

    @Column(name = "facilities", columnDefinition = "TEXT")
    private String facilities; // JSON - changing rooms, restrooms, water, etc.

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "operating_hours", length = 100)
    private String operatingHours;

    @Column(columnDefinition = "TEXT")
    private String rules;

    @Column(columnDefinition = "TEXT")
    private String notes;

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
}
