package com.lera.payroll_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "salary_components")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryComponent {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "component_name", nullable = false, length = 100)
    private String componentName; // HRA, DA, TA, PF, ESI, etc.

    @Column(name = "component_type", length = 50)
    private String componentType; // EARNING, DEDUCTION

    @Column(name = "calculation_type", length = 50)
    private String calculationType; // FIXED, PERCENTAGE, HOURLY

    @Column(name = "default_value", precision = 12, scale = 2)
    @PositiveOrZero
    private BigDecimal defaultValue;

    @Column(name = "is_taxable")
    @Builder.Default
    private Boolean isTaxable = true;

    @Column(name = "is_mandatory")
    @Builder.Default
    private Boolean isMandatory = false;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(columnDefinition = "TEXT")
    private String description;

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
