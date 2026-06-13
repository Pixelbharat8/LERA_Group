package com.lera.academy_service.security;

import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.repository.ClassSessionRepository;
import com.lera.academy_service.repository.EnrollmentRepository;
import com.lera.academy_service.repository.StudentParentRepository;
import com.lera.academy_service.repository.StudentRepository;
import com.lera.academy_service.repository.TeacherRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
class AcademyAuthorizationServiceTest {

    @Mock
    private StudentRepository studentRepository;
    @Mock
    private StudentParentRepository studentParentRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private ClassRepository classRepository;
    @Mock
    private ClassSessionRepository classSessionRepository;
    @Mock
    private TeacherRepository teacherRepository;

    private AcademyAuthorizationService authz;

    private final UUID centerA = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID centerB = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @BeforeEach
    void setUp() {
        authz = new AcademyAuthorizationService(
                studentRepository, studentParentRepository, enrollmentRepository,
                classRepository, classSessionRepository, teacherRepository);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void login(AuthUser user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, java.util.List.of()));
    }

    @Test
    void effectiveListCenterId_centerManager_usesJwt() {
        login(AuthUser.builder().roleName("CENTER_MANAGER").centerId(centerA).userId(UUID.randomUUID()).build());
        assertEquals(centerA, authz.effectiveListCenterId(null));
    }

    @Test
    void effectiveListCenterId_centerManager_otherCenter_forbidden() {
        login(AuthUser.builder().roleName("CENTER_MANAGER").centerId(centerA).userId(UUID.randomUUID()).build());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authz.effectiveListCenterId(centerB));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void effectiveListCenterId_orgWide_null_ok() {
        login(AuthUser.builder().roleName("CEO").userId(UUID.randomUUID()).build());
        assertEquals(null, authz.effectiveListCenterId(null));
    }
}
