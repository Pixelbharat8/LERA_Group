package com.lera.academy_service.controller;

import com.lera.academy_service.model.GlobalExceptionHandler;
import com.lera.academy_service.repository.CalendarEventRepository;
import com.lera.academy_service.repository.JobApplicationRepository;
import com.lera.academy_service.repository.JobOpeningRepository;
import com.lera.academy_service.repository.PerformanceReviewRepository;
import com.lera.academy_service.entity.JobOpening;
import com.lera.academy_service.testsupport.WebMvcMethodSecurityTestConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security (@PreAuthorize) coverage for the new modules: staff-level reads are open to
 * teachers, while manager/HR-only writes and admin lists are blocked for them.
 */
@WebMvcTest(controllers = { CalendarController.class, PerformanceReviewController.class, RecruitmentController.class })
@Import({ WebMvcMethodSecurityTestConfig.class, GlobalExceptionHandler.class })
class NewModulesPreAuthorizeWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean private CalendarEventRepository calendarEventRepository;
    @MockBean private PerformanceReviewRepository performanceReviewRepository;
    @MockBean private JobOpeningRepository jobOpeningRepository;
    @MockBean private JobApplicationRepository jobApplicationRepository;

    // --- Calendar: staff-level read (TEACHER allowed, PARENT not) ---

    @Test
    @WithMockUser(roles = "TEACHER")
    void calendarEvents_teacher_ok() throws Exception {
        when(calendarEventRepository.findByStartDateBetweenOrderByStartDateAsc(any(), any())).thenReturn(List.of());
        mockMvc.perform(get("/api/calendar/events")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "PARENT")
    void calendarEvents_parent_forbidden() throws Exception {
        mockMvc.perform(get("/api/calendar/events")).andExpect(status().isForbidden());
    }

    // --- Performance: my reviews open to staff; the team list is manager-only ---

    @Test
    @WithMockUser(roles = "TEACHER")
    void myReviews_teacher_ok() throws Exception {
        when(performanceReviewRepository.findByEmployeeIdOrderByReviewDateDesc(any())).thenReturn(List.of());
        mockMvc.perform(get("/api/performance-reviews/employee/" + java.util.UUID.randomUUID()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    void reviewsList_teacher_forbidden() throws Exception {
        mockMvc.perform(get("/api/performance-reviews")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "CHAIRMAN")
    void reviewsList_chairman_ok() throws Exception {
        when(performanceReviewRepository.findAllByOrderByReviewDateDesc()).thenReturn(List.of());
        mockMvc.perform(get("/api/performance-reviews")).andExpect(status().isOk());
    }

    // --- Recruitment: list open to staff; creating an opening is HR-only ---

    @Test
    @WithMockUser(roles = "TEACHER")
    void jobOpenings_teacher_canView() throws Exception {
        when(jobOpeningRepository.findAllByOrderByPostedDateDesc()).thenReturn(List.of());
        mockMvc.perform(get("/api/job-openings")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    void createOpening_teacher_forbidden() throws Exception {
        mockMvc.perform(post("/api/job-openings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"English Teacher\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "CHAIRMAN")
    void createOpening_chairman_ok() throws Exception {
        when(jobOpeningRepository.save(any())).thenAnswer(i -> i.getArgument(0, JobOpening.class));
        mockMvc.perform(post("/api/job-openings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"English Teacher\"}"))
                .andExpect(status().isOk());
    }
}
