package com.lera.identity_service.controller;

import com.lera.identity_service.entity.UserRole;
import com.lera.identity_service.model.GlobalExceptionHandler;
import com.lera.identity_service.security.AccessGuard;
import com.lera.identity_service.security.AuthCookies;
import com.lera.identity_service.service.AuditService;
import com.lera.identity_service.service.JwtService;
import com.lera.identity_service.service.UserRoleService;
import com.lera.identity_service.testsupport.WebMvcMethodSecurityTestConfig;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Regression guard for the two most severe authorization fixes from the security sweep:
 * impersonation (account takeover) and role assignment (privilege escalation) must be
 * admin-only. If anyone ever re-broadens those @PreAuthorize role lists to include
 * STUDENT/PARENT/TEACHER, these tests fail.
 */
@WebMvcTest(controllers = { ImpersonationController.class, UserRoleController.class })
@Import({ WebMvcMethodSecurityTestConfig.class, GlobalExceptionHandler.class })
class CriticalAuthzWebMvcTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private AccessGuard accessGuard;
    @MockBean private EntityManager entityManager;
    @MockBean private JwtService jwtService;
    @MockBean private AuditService auditService;
    @MockBean private AuthCookies authCookies;
    @MockBean private UserRoleService userRoleService;
    // The production JwtAuthenticationFilter (a @Component) is picked up by the slice; satisfy its dep.
    @MockBean private com.lera.identity_service.repository.UserRepository userRepository;

    private static final String IMPERSONATE = "/api/impersonation/" + UUID.randomUUID();

    // --- Impersonation = logging in AS another user. Org-wide admins only. ---
    @Test @WithMockUser(roles = "STUDENT")
    void impersonate_student_forbidden() throws Exception {
        mockMvc.perform(post(IMPERSONATE)).andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "PARENT")
    void impersonate_parent_forbidden() throws Exception {
        mockMvc.perform(post(IMPERSONATE)).andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "TEACHER")
    void impersonate_teacher_forbidden() throws Exception {
        mockMvc.perform(post(IMPERSONATE)).andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "CHAIRMAN")
    void impersonate_chairman_clearsTheAuthGate() throws Exception {
        // CHAIRMAN passes @PreAuthorize; whatever the method does next, it is NOT a 403.
        mockMvc.perform(post(IMPERSONATE))
                .andExpect(r -> assertNotEquals(403, r.getResponse().getStatus()));
    }

    // --- Role assignment = privilege escalation (e.g. grant self SUPER_ADMIN). Admin-only. ---
    private static MockHttpServletRequestBuilder assignRole() {
        return post("/api/user-roles")
                .param("userId", UUID.randomUUID().toString())
                .param("roleId", UUID.randomUUID().toString())
                .param("assignedBy", UUID.randomUUID().toString());
    }

    @Test @WithMockUser(roles = "STUDENT")
    void assignRole_student_forbidden() throws Exception {
        mockMvc.perform(assignRole()).andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "PARENT")
    void assignRole_parent_forbidden() throws Exception {
        mockMvc.perform(assignRole()).andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "TEACHER")
    void assignRole_teacher_forbidden() throws Exception {
        mockMvc.perform(assignRole()).andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "CHAIRMAN")
    void assignRole_chairman_allowed() throws Exception {
        when(userRoleService.assignRole(any(), any(), any())).thenReturn(new UserRole());
        mockMvc.perform(assignRole()).andExpect(status().isCreated());
    }
}
