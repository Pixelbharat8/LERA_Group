package com.lera.payroll_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "tax_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxSettings {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tax_name", nullable = false, length = 100)
    private String taxName; // Income Tax, Professional Tax, etc.

    @Column(name = "tax_type", length = 50)
    private String taxType; // INCOME, PROFESSIONAL, TDS

    @Column(name = "calculation_method", length = 50)
    private String calculationMethod; // SLAB, PERCENTAGE, FIXED

    @Column(name = "tax_slabs", columnDefinition = "TEXT")
    private String taxSlabs; // JSON for tax slabs

    @Column(name = "min_taxable_income", precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal minTaxableIncome = BigDecimal.ZERO;

    @Column(name = "max_exemption", precision = 12, scale = 2)
    @Builder.Default
    @PositiveOrZero
    private BigDecimal maxExemption = BigDecimal.ZERO;

    @Column(name = "fixed_amount", precision = 12, scale = 2)
    @PositiveOrZero
    private BigDecimal fixedAmount;

    @Column(name = "percentage_rate", precision = 5, scale = 2)
    @PositiveOrZero
    @DecimalMax(value = "100", inclusive = true)
    private BigDecimal percentageRate;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "applicable_from")
    private java.time.LocalDate applicableFrom;

    @Column(name = "applicable_to")
    private java.time.LocalDate applicableTo;

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
