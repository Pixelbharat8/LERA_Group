package com.lera.academy_service.controller;

import com.lera.academy_service.entity.StudentParent;
import com.lera.academy_service.repository.BlogPostRepository;
import com.lera.academy_service.repository.StudentParentRepository;
import com.lera.academy_service.model.GlobalExceptionHandler;
import com.lera.academy_service.repository.StudentRepository;
import com.lera.academy_service.security.StudentParentAccessPolicy;
import com.lera.academy_service.testsupport.WebMvcMethodSecurityTestConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies {@code @PreAuthorize} on selected endpoints; direct {@code @InjectMocks}
 * tests do not run method security.
 */
@WebMvcTest(controllers = { BlogPostController.class, StudentParentController.class })
@Import({ WebMvcMethodSecurityTestConfig.class, GlobalExceptionHandler.class })
class PreAuthorizeWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BlogPostRepository blogPostRepository;
    @MockBean
    private StudentParentRepository studentParentRepository;
    @MockBean
    private StudentRepository studentRepository;
    @MockBean
    private StudentParentAccessPolicy studentParentAccessPolicy;
    @MockBean
    private com.lera.academy_service.security.AcademyAuthorizationService academyAuthorizationService;

    @Test
    @WithMockUser(roles = "PARENT")
    void getAllBlogPosts_parent_forbidden() throws Exception {
        mockMvc.perform(get("/api/blog"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    void getAllBlogPosts_teacher_ok() throws Exception {
        when(blogPostRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
        mockMvc.perform(get("/api/blog"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    @WithMockUser(roles = "PARENT")
    void createStudentParent_parent_forbidden() throws Exception {
        UUID sid = UUID.randomUUID();
        UUID pid = UUID.randomUUID();
        String body = """
                {"studentId":"%s","parentId":"%s","relationship":"Mother"}
                """.formatted(sid, pid);
        mockMvc.perform(post("/api/student-parents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
        verify(studentParentRepository, org.mockito.Mockito.never()).save(any(StudentParent.class));
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    void createStudentParent_teacher_ok() throws Exception {
        UUID sid = UUID.randomUUID();
        UUID pid = UUID.randomUUID();
        String body = """
                {"studentId":"%s","parentId":"%s","relationship":"Mother"}
                """.formatted(sid, pid);
        when(studentParentRepository.save(any(StudentParent.class))).thenAnswer(inv -> inv.getArgument(0));
        mockMvc.perform(post("/api/student-parents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
        verify(studentParentRepository).save(any(StudentParent.class));
    }
}
