package com.lera.payroll_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherSummary {
    private UUID teacherId;
    private String teacherName;
    private String teacherEmail;
    private BigDecimal totalHours;
    private BigDecimal hourlyRate;
    private BigDecimal baseSalary;
    private BigDecimal teachingAmount;
    private BigDecimal bonus;
    private BigDecimal deductions;
    private BigDecimal totalAmount;
    private String centerId;
    private String centerName;
}
