package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sport_equipment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportEquipment {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "equipment_name", nullable = false)
    private String equipmentName;

    @Column(name = "equipment_code", unique = true, length = 50)
    private String equipmentCode;

    @Column(name = "sport_type_id")
    private UUID sportTypeId;

    @Column(name = "category", length = 50)
    private String category; // BALL, BAT, NET, PROTECTIVE_GEAR, TRAINING_AID, CLOTHING

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "brand", length = 100)
    private String brand;

    @Column(name = "model", length = 100)
    private String model;

    @Column(name = "size", length = 50)
    private String size;

    @Column(name = "quantity_total")
    @Builder.Default
    private Integer quantityTotal = 0;

    @Column(name = "quantity_available")
    @Builder.Default
    private Integer quantityAvailable = 0;

    @Column(name = "quantity_in_use")
    @Builder.Default
    private Integer quantityInUse = 0;

    @Column(name = "quantity_damaged")
    @Builder.Default
    private Integer quantityDamaged = 0;

    @Column(name = "unit_price", precision = 10, scale = 2)
    private java.math.BigDecimal unitPrice;

    @Column(name = "purchase_date")
    private java.time.LocalDate purchaseDate;

    @Column(name = "warranty_until")
    private java.time.LocalDate warrantyUntil;

    @Column(name = "location", length = 200)
    private String location; // Storage location

    @Column(length = 50)
    @Builder.Default
    private String condition = "NEW"; // NEW, GOOD, FAIR, POOR, DAMAGED

    @Column(name = "maintenance_required")
    @Builder.Default
    private Boolean maintenanceRequired = false;

    @Column(name = "last_maintenance_date")
    private java.time.LocalDate lastMaintenanceDate;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

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
