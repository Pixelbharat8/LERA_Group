package com.lera.payroll_service.service;

import com.lera.payroll_service.dto.GeneratePayrollRequest;
import com.lera.payroll_service.entity.PayrollRecord;
import com.lera.payroll_service.entity.TeacherSalaryConfig;
import com.lera.payroll_service.repository.BonusRepository;
import com.lera.payroll_service.repository.DeductionRepository;
import com.lera.payroll_service.repository.PayrollRepository;
import com.lera.payroll_service.repository.TeacherOvertimeRepository;
import com.lera.payroll_service.repository.TeacherSalaryConfigRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PayrollGenerationServiceTest {

    @Mock private PayrollRepository payrollRepository;
    @Mock private TeacherSalaryConfigRepository salaryConfigRepository;
    @Mock private BonusRepository bonusRepository;
    @Mock private DeductionRepository deductionRepository;
    @Mock private TeacherOvertimeRepository overtimeRepository;
    @Mock private RestTemplate restTemplate;
    @InjectMocks private PayrollGenerationService service;

    private static GeneratePayrollRequest req() {
        return GeneratePayrollRequest.builder()
                .payPeriodStart("2026-06-01").payPeriodEnd("2026-06-30").build();
    }

    private static List<Map<String, Object>> oneStaff(String role) {
        return List.of(Map.of("id", UUID.randomUUID().toString(), "fullname", "Jo", "roleName", role));
    }

    /** Route fetchStaff (/api/users) and fetchTeachingHours (/hours) through one stub. */
    @SuppressWarnings({"unchecked", "rawtypes"})
    private void mockHttp(List<Map<String, Object>> staff, String totalHours) {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                .thenAnswer(inv -> {
                    String url = inv.getArgument(0);
                    if (url.contains("/api/users")) return new ResponseEntity(staff, HttpStatus.OK);
                    return new ResponseEntity(Map.of("totalHours", totalHours), HttpStatus.OK);
                });
        // lenient: staff-skipped tests (no salary config) never reach save()
        lenient().when(payrollRepository.save(any(PayrollRecord.class))).thenAnswer(i -> i.getArgument(0));
        // Default no bonuses/deductions; individual tests override.
        lenient().when(bonusRepository.sumApprovedForTeacherInRange(any(), any(), any())).thenReturn(BigDecimal.ZERO);
        lenient().when(deductionRepository.sumActiveForTeacherInRange(any(), any(), any())).thenReturn(BigDecimal.ZERO);
        lenient().when(overtimeRepository.sumApprovedForTeacherInRange(any(), any(), any())).thenReturn(BigDecimal.ZERO);
    }

    @Test
    void staffWithoutConfig_isSkippedNotPaidAFabricatedDefault() {
        mockHttp(oneStaff("STAFF"), "0");
        when(salaryConfigRepository.findByTeacherId(any())).thenReturn(Optional.empty());

        List<PayrollRecord> result = service.generatePayrollForPeriod(req());

        // Staff with no salary config are SKIPPED rather than paid a fabricated default
        // (previously a flat 5,000,000 VND) — their salary must be configured first.
        assertEquals(0, result.size());
    }

    @Test
    void teacherWithConfig_addsHourlyRateTimesHoursToBase() {
        mockHttp(oneStaff("TEACHER"), "10");
        TeacherSalaryConfig cfg = TeacherSalaryConfig.builder()
                .baseSalary(new BigDecimal("8000000")).hourlyRate(new BigDecimal("150000")).build();
        when(salaryConfigRepository.findByTeacherId(any())).thenReturn(Optional.of(cfg));

        PayrollRecord r = service.generatePayrollForPeriod(req()).get(0);

        // 150,000/h × 10h = 1,500,000 teaching; + 8,000,000 base = 9,500,000
        assertEquals(0, r.getTeachingHours().compareTo(new BigDecimal("10")));
        assertEquals(0, r.getTeachingAmount().compareTo(new BigDecimal("1500000")));
        assertEquals(0, r.getTotalAmount().compareTo(new BigDecimal("9500000")));
    }

    @Test
    void includesApprovedBonusDeductionAndOvertimeInThePayslip() {
        mockHttp(oneStaff("TEACHER"), "10");
        TeacherSalaryConfig cfg = TeacherSalaryConfig.builder()
                .baseSalary(new BigDecimal("8000000")).hourlyRate(new BigDecimal("150000")).build();
        when(salaryConfigRepository.findByTeacherId(any())).thenReturn(Optional.of(cfg));
        // Approved bonus + active deduction + approved overtime for the pay period.
        when(bonusRepository.sumApprovedForTeacherInRange(any(), any(), any())).thenReturn(new BigDecimal("500000"));
        when(deductionRepository.sumActiveForTeacherInRange(any(), any(), any())).thenReturn(new BigDecimal("200000"));
        when(overtimeRepository.sumApprovedForTeacherInRange(any(), any(), any())).thenReturn(new BigDecimal("300000"));

        PayrollRecord r = service.generatePayrollForPeriod(req()).get(0);

        // base 8,000,000 + teaching 1,500,000 + bonus 500,000 + overtime 300,000 − deduction 200,000 = 10,100,000
        assertEquals(0, r.getBonus().compareTo(new BigDecimal("500000")));
        assertEquals(0, r.getDeductions().compareTo(new BigDecimal("200000")));
        assertEquals(0, r.getOvertime().compareTo(new BigDecimal("300000")));
        assertEquals(0, r.getTotalAmount().compareTo(new BigDecimal("10100000")));
    }

    @Test
    void noStaff_generatesNothing() {
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), any(ParameterizedTypeReference.class)))
                .thenAnswer(inv -> new ResponseEntity<>(List.of(), HttpStatus.OK));

        assertTrue(service.generatePayrollForPeriod(req()).isEmpty());
    }
}
