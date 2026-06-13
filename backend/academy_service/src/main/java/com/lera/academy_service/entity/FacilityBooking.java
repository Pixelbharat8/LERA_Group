package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "facility_bookings", indexes = {
    @Index(name = "idx_facility_bookings_facility", columnList = "facility_id"),
    @Index(name = "idx_facility_bookings_date", columnList = "booking_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacilityBooking {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "facility_id", nullable = false)
    private UUID facilityId;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "start_time", nullable = false)
    private java.time.LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private java.time.LocalTime endTime;

    @Column(name = "booked_by", nullable = false)
    private UUID bookedBy;

    @Column(name = "booking_type", length = 50)
    private String bookingType; // TRAINING, MATCH, EVENT, MAINTENANCE, PERSONAL

    @Column(name = "team_id")
    private UUID teamId;

    @Column(name = "match_id")
    private UUID matchId;

    @Column(name = "purpose", columnDefinition = "TEXT")
    private String purpose;

    @Column(name = "expected_attendees")
    private Integer expectedAttendees;

    @Column(length = 50)
    @Builder.Default
    private String status = "CONFIRMED"; // PENDING, CONFIRMED, CANCELLED, COMPLETED

    @Column(name = "booking_fee", precision = 10, scale = 2)
    @Builder.Default
    private java.math.BigDecimal bookingFee = java.math.BigDecimal.ZERO;

    @Column(name = "payment_status", length = 50)
    @Builder.Default
    private String paymentStatus = "PENDING"; // PENDING, PAID, WAIVED

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

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
