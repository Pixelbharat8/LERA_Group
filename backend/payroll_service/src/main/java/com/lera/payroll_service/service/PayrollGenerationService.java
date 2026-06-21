package com.lera.payroll_service.service;

import com.lera.payroll_service.dto.GeneratePayrollRequest;
import com.lera.payroll_service.entity.PayrollRecord;
import com.lera.payroll_service.entity.TeacherSalaryConfig;
import com.lera.payroll_service.repository.PayrollRepository;
import com.lera.payroll_service.repository.TeacherSalaryConfigRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PayrollGenerationService {
    
    private static final Logger log = LoggerFactory.getLogger(PayrollGenerationService.class);

    private final PayrollRepository payrollRepository;
    private final TeacherSalaryConfigRepository salaryConfigRepository;
    private final RestTemplate restTemplate;

    @Value("${identity.service.url:http://localhost:8081}")
    private String identityServiceUrl;

    @Value("${attendance.service.url:http://localhost:8085}")
    private String attendanceServiceUrl;

    /**
     * Generate payroll for all staff (teachers, TAs, staff) based on attendance hours and salary configs.
     * This integrates with:
     * - Identity Service (staff list)
     * - Attendance Service (teaching hours from teacher_sessions)
     * - TeacherSalaryConfig (per-staff salary rates)
     */
    @Transactional
    public List<PayrollRecord> generatePayrollForPeriod(GeneratePayrollRequest request) {
        LocalDate periodStart = LocalDate.parse(request.getPayPeriodStart());
        LocalDate periodEnd = LocalDate.parse(request.getPayPeriodEnd());

        // 1. Fetch all staff (TEACHER, TA, STAFF) from Identity Service
        List<Map<String, Object>> staff = fetchStaff();
        log.info("Found {} staff members to process for payroll", staff.size());

        List<PayrollRecord> generated = new ArrayList<>();

        for (Map<String, Object> staffMember : staff) {
            UUID staffId = UUID.fromString((String) staffMember.get("id"));
            String staffName = (String) staffMember.getOrDefault("fullname", "Unknown");
            String roleName = (String) staffMember.getOrDefault("roleName", "STAFF");
            
            // Get center information
            String centerName = null;
            UUID centerId = null;
            Object centerObj = staffMember.get("center");
            if (centerObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> center = (Map<String, Object>) centerObj;
                centerName = (String) center.get("name");
                Object centerIdObj = center.get("id");
                if (centerIdObj != null) {
                    centerId = UUID.fromString((String) centerIdObj);
                }
            }

            // 2. Fetch teaching hours from NEW Teacher Sessions endpoint (for TEACHER and TA roles)
            BigDecimal teachingHours = BigDecimal.ZERO;
            if ("TEACHER".equals(roleName) || "TA".equals(roleName)) {
                teachingHours = fetchTeachingHoursFromSessions(staffId, periodStart, periodEnd);
            }

            // 3. Get staff salary config from database (or use defaults)
            TeacherSalaryConfig config = salaryConfigRepository.findByTeacherId(staffId)
                    .orElse(getDefaultSalaryConfig());

            BigDecimal baseSalary = config.getBaseSalary() != null ? config.getBaseSalary() : BigDecimal.ZERO;
            BigDecimal hourlyRate = config.getHourlyRate() != null ? config.getHourlyRate() : BigDecimal.ZERO;

            BigDecimal teachingAmount = hourlyRate.multiply(teachingHours != null ? teachingHours : BigDecimal.ZERO);
            BigDecimal bonus = BigDecimal.ZERO;
            BigDecimal deductions = BigDecimal.ZERO;

            BigDecimal totalAmount = baseSalary.add(teachingAmount).add(bonus).subtract(deductions);

            // 4. Find-or-create the PayrollRecord — re-running generation for the same period
            //    must UPDATE the existing row, not insert a duplicate.
            PayrollRecord existing = payrollRepository
                    .findByTeacherIdAndPayPeriodStartAndPayPeriodEnd(staffId, periodStart, periodEnd)
                    .orElse(null);
            // Never overwrite a payslip that's already been approved or paid.
            if (existing != null && ("PAID".equalsIgnoreCase(existing.getStatus())
                    || "APPROVED".equalsIgnoreCase(existing.getStatus()))) {
                generated.add(existing);
                continue;
            }
            PayrollRecord payroll = existing != null ? existing : new PayrollRecord();
            payroll.setTeacherId(staffId);
            payroll.setTeacherName(staffName);
            payroll.setCenterName(centerName);
            payroll.setCenterId(centerId);
            payroll.setPayPeriodStart(periodStart);
            payroll.setPayPeriodEnd(periodEnd);
            payroll.setBaseSalary(baseSalary);
            payroll.setTeachingHours(teachingHours);
            payroll.setHourlyRate(hourlyRate);
            payroll.setTeachingAmount(teachingAmount);
            payroll.setBonus(bonus);
            payroll.setDeductions(deductions);
            payroll.setTotalAmount(totalAmount);
            payroll.setCurrency("VND");
            payroll.setStatus("PENDING");
            payroll.setNotes("Auto-generated for period: " + periodStart + " to " + periodEnd + " [" + roleName + "]");

            PayrollRecord saved = payrollRepository.save(payroll);
            generated.add(saved);

            log.info("Generated payroll for {}: {} ({}h, {} center) => {} VND", 
                    roleName, staffName, teachingHours, centerName, totalAmount);
        }

        return generated;
    }
    
    /**
     * Get default salary configuration if teacher doesn't have one
     */
    private TeacherSalaryConfig getDefaultSalaryConfig() {
        TeacherSalaryConfig config = new TeacherSalaryConfig();
        config.setBaseSalary(new BigDecimal("5000000")); // 5M VND default
        config.setHourlyRate(new BigDecimal("200000"));  // 200K VND per hour default
        config.setSalaryType("HOURLY");
        config.setStatus("ACTIVE");
        return config;
    }

    /**
     * Fetch all staff (TEACHER, TA, STAFF) from Identity Service
     */
    /**
     * Build an HttpEntity that forwards the caller's JWT so downstream services
     * (identity, attendance) authenticate the request. Without this, those calls
     * 401 and payroll generation silently finds 0 staff / 0 hours.
     */
    private HttpEntity<Void> forwardAuth() {
        HttpHeaders headers = new HttpHeaders();
        var attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) {
            String auth = sra.getRequest().getHeader(HttpHeaders.AUTHORIZATION);
            if (auth != null && !auth.isBlank()) headers.set(HttpHeaders.AUTHORIZATION, auth);
        }
        return new HttpEntity<>(headers);
    }

    private List<Map<String, Object>> fetchStaff() {
        try {
            String url = identityServiceUrl + "/api/users";
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    forwardAuth(),
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            List<Map<String, Object>> users = response.getBody();
            if (users == null) return Collections.emptyList();

            // Filter TEACHER, TA, and STAFF roles
            return users.stream()
                    .filter(u -> {
                        String role = (String) u.get("roleName");
                        return "TEACHER".equals(role) || "TA".equals(role) || "STAFF".equals(role);
                    })
                    .toList();
        } catch (Exception e) {
            log.error("Failed to fetch staff from Identity Service", e);
            return Collections.emptyList();
        }
    }

    /**
     * Fetch total teaching hours for a teacher from NEW Teacher Sessions endpoint
     */
    private BigDecimal fetchTeachingHoursFromSessions(UUID teacherId, LocalDate start, LocalDate end) {
        try {
            // NEW endpoint: GET /api/teacher-sessions/teacher/{teacherId}/hours?startDate={start}&endDate={end}
            String url = String.format(
                attendanceServiceUrl + "/api/teacher-sessions/teacher/%s/hours?startDate=%s&endDate=%s",
                teacherId, start, end
            );
            
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    forwardAuth(),
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> data = response.getBody();
            if (data == null || !data.containsKey("totalHours")) {
                log.warn("No teaching hours found for teacher {}", teacherId);
                return BigDecimal.ZERO;
            }

            Object totalHoursObj = data.get("totalHours");
            BigDecimal totalHours = new BigDecimal(String.valueOf(totalHoursObj));
            
            log.info("Fetched {} teaching hours for teacher {} from sessions", totalHours, teacherId);
            return totalHours;

        } catch (Exception e) {
            log.error("Failed to fetch teaching hours for teacher {} from sessions endpoint", teacherId, e);
            return BigDecimal.ZERO;
        }
    }
}
