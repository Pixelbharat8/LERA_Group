package com.lera.payroll_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeneratePayrollRequest {
    private String payPeriodStart; // ISO date
    private String payPeriodEnd;   // ISO date
    private UUID centerId;         // optional: filter by center
    private boolean includeAllTeachers; // if true, generate for all active teachers
}
