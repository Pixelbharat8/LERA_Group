package com.lera.payroll_service.controller;

import com.lera.payroll_service.service.JdbcAuditWriter;
import com.lera.payroll_service.service.PayrollCycleService;
import com.lera.payroll_service.service.SalaryComponentService;
import com.lera.payroll_service.service.TaxSettingsService;
import com.lera.payroll_service.service.TeacherOvertimeService;
import com.lera.payroll_service.testsupport.WebMvcMethodSecurityTestConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Regression guard for the payroll authorization fix: tax/salary/payroll-cycle/overtime
 * config is financial data — students/parents (and regular teachers/staff) must have NO
 * access. These controllers are class-level @PreAuthorize'd to finance roles, so a plain
 * GET exercises the gate. If anyone re-broadens the role list, these fail.
 */
@WebMvcTest(controllers = {
        TaxSettingsController.class, SalaryComponentController.class,
        PayrollCycleController.class, TeacherOvertimeController.class })
@Import(WebMvcMethodSecurityTestConfig.class)
class PayrollConfigAuthzWebMvcTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private TaxSettingsService taxSettingsService;
    @MockBean private SalaryComponentService salaryComponentService;
    @MockBean private PayrollCycleService payrollCycleService;
    @MockBean private TeacherOvertimeService teacherOvertimeService;
    @MockBean private JdbcAuditWriter jdbcAuditWriter;

    private static final String[] CONFIG_ENDPOINTS = {
            "/api/tax-settings", "/api/salary-components", "/api/payroll-cycles", "/api/teacher-overtime"
    };

    private void assertForbiddenForAll() throws Exception {
        for (String ep : CONFIG_ENDPOINTS) {
            mockMvc.perform(get(ep)).andExpect(status().isForbidden());
        }
    }

    @Test @WithMockUser(roles = "STUDENT")
    void payrollConfig_student_forbidden() throws Exception {
        assertForbiddenForAll();
    }

    @Test @WithMockUser(roles = "PARENT")
    void payrollConfig_parent_forbidden() throws Exception {
        assertForbiddenForAll();
    }

    @Test @WithMockUser(roles = "TEACHER")
    void payrollConfig_teacher_forbidden() throws Exception {
        assertForbiddenForAll();
    }

    @Test @WithMockUser(roles = "STAFF")
    void payrollConfig_staff_forbidden() throws Exception {
        assertForbiddenForAll();
    }

    @Test @WithMockUser(roles = "ACCOUNTANT")
    void payrollConfig_accountant_allowed() throws Exception {
        for (String ep : CONFIG_ENDPOINTS) {
            mockMvc.perform(get(ep)).andExpect(r -> assertNotEquals(403, r.getResponse().getStatus()));
        }
    }

    @Test @WithMockUser(roles = "CHAIRMAN")
    void payrollConfig_chairman_allowed() throws Exception {
        for (String ep : CONFIG_ENDPOINTS) {
            mockMvc.perform(get(ep)).andExpect(r -> assertNotEquals(403, r.getResponse().getStatus()));
        }
    }
}
