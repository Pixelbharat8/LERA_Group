package com.lera.academy_service.controller;

import com.lera.academy_service.model.GlobalExceptionHandler;
import com.lera.academy_service.repository.EnrollmentRepository;
import com.lera.academy_service.repository.ExamRepository;
import com.lera.academy_service.repository.ExamResultRepository;
import com.lera.academy_service.repository.StudentRepository;
import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.service.StudentReportCardService;
import com.lera.academy_service.testsupport.WebMvcMethodSecurityTestConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Auth regression tests for the new value features: report cards (per-student access) and the
 * teacher gradebook (staff-only). Mocks the authorization service to assert the controller honours it.
 */
@WebMvcTest(controllers = { ReportCardController.class, GradeController.class })
@Import({ WebMvcMethodSecurityTestConfig.class, GlobalExceptionHandler.class })
class ValueFeaturesWebMvcTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private StudentReportCardService reportCardService;
    @MockBean private AcademyAuthorizationService authz;
    @MockBean private ExamResultRepository examResultRepository;
    @MockBean private ExamRepository examRepository;
    @MockBean private EnrollmentRepository enrollmentRepository;
    @MockBean private StudentRepository studentRepository;
    @MockBean private com.lera.academy_service.client.NotificationClient notificationClient;

    // --- Report card: only people who can view the student ---

    @Test
    @WithMockUser(roles = "PARENT")
    void reportCard_unrelatedViewer_forbidden() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN)).when(authz).assertCanViewStudent(any());
        mockMvc.perform(get("/api/report-cards/" + UUID.randomUUID())).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "CHAIRMAN")
    void reportCard_authorizedViewer_ok() throws Exception {
        when(reportCardService.buildReportCard(any())).thenReturn(Map.of("student", Map.of()));
        mockMvc.perform(get("/api/report-cards/" + UUID.randomUUID())).andExpect(status().isOk());
    }

    // --- Gradebook + bulk grade entry: staff only ---

    @Test
    @WithMockUser(roles = "PARENT")
    void gradebook_nonStaff_forbidden() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN)).when(authz).assertStaff();
        mockMvc.perform(get("/api/grades/gradebook").param("examId", UUID.randomUUID().toString()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "PARENT")
    void bulkGrades_nonStaff_forbidden() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN)).when(authz).assertStaff();
        mockMvc.perform(post("/api/grades/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"examId\":\"" + UUID.randomUUID() + "\",\"grades\":[]}"))
                .andExpect(status().isForbidden());
    }
}
