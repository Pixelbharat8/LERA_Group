package com.lera.payroll_service.dto;

import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Typed request body for teacher salary configuration.
 * Replaces the previous raw {@code Map<String,Object>} body so that Bean Validation
 * (@Valid) actually runs and mass-assignment is bounded to known fields.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherSalaryConfigRequest {

    /** Required on create; ignored on update-by-teacherId (path variable wins). */
    private UUID teacherId;

    @PositiveOrZero(message = "baseSalary must be zero or positive")
    private BigDecimal baseSalary;

    @PositiveOrZero(message = "hourlyRate must be zero or positive")
    private BigDecimal hourlyRate;

    @PositiveOrZero(message = "sessionRate must be zero or positive")
    private BigDecimal sessionRate;

    private String salaryType;

    private String status;

    private UUID centerId;
}
