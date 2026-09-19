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

    // ── assertCanViewClassRoster ────────────────────────────────────────────────
    //
    // This method used to loop the class roster and ask two questions per enrolled student, so
    // a class of 30 cost up to 60 round trips on every access check a parent or student made.
    // It is now set-based. It had NO test coverage at the time it was rewritten, which for an
    // authorisation method is the part that matters: these pin both directions, because the
    // failure that costs you is the one that lets the wrong family in.

    private com.lera.academy_service.entity.Enrollment enrolment(UUID studentId) {
        com.lera.academy_service.entity.Enrollment e = new com.lera.academy_service.entity.Enrollment();
        e.setStudentId(studentId);
        return e;
    }

    private com.lera.academy_service.entity.ClassEntity classIn(UUID centerId) {
        com.lera.academy_service.entity.ClassEntity c = new com.lera.academy_service.entity.ClassEntity();
        c.setCenterId(centerId);
        return c;
    }

    @Test
    void classRoster_parentOfAnEnrolledChild_allowed() {
        UUID classId = UUID.randomUUID(), parent = UUID.randomUUID(), child = UUID.randomUUID();
        login(AuthUser.builder().roleName("PARENT").userId(parent).build());
        org.mockito.Mockito.when(classRepository.findById(classId))
                .thenReturn(java.util.Optional.of(classIn(centerA)));
        org.mockito.Mockito.when(enrollmentRepository.findByClassId(classId))
                .thenReturn(java.util.List.of(enrolment(child)));
        org.mockito.Mockito.when(studentParentRepository
                .existsByParentIdAndStudentIdIn(parent, java.util.List.of(child))).thenReturn(true);

        authz.assertCanViewClassRoster(classId);   // no exception
    }

    @Test
    void classRoster_parentOfAChildInAnotherClass_forbidden() {
        UUID classId = UUID.randomUUID(), parent = UUID.randomUUID(), someoneElse = UUID.randomUUID();
        login(AuthUser.builder().roleName("PARENT").userId(parent).build());
        org.mockito.Mockito.when(classRepository.findById(classId))
                .thenReturn(java.util.Optional.of(classIn(centerA)));
        org.mockito.Mockito.when(enrollmentRepository.findByClassId(classId))
                .thenReturn(java.util.List.of(enrolment(someoneElse)));
        org.mockito.Mockito.when(studentParentRepository
                .existsByParentIdAndStudentIdIn(parent, java.util.List.of(someoneElse))).thenReturn(false);
        org.mockito.Mockito.when(studentRepository.findAllById(java.util.List.of(someoneElse)))
                .thenReturn(java.util.List.of());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authz.assertCanViewClassRoster(classId));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void classRoster_enrolledStudentThemselves_allowed() {
        UUID classId = UUID.randomUUID(), studentUser = UUID.randomUUID(), studentRow = UUID.randomUUID();
        login(AuthUser.builder().roleName("STUDENT").userId(studentUser).build());
        com.lera.academy_service.entity.Student s = new com.lera.academy_service.entity.Student();
        s.setId(studentRow);
        s.setUserId(studentUser);   // students.user_id, not students.id — the recurring confusion
        org.mockito.Mockito.when(classRepository.findById(classId))
                .thenReturn(java.util.Optional.of(classIn(centerA)));
        org.mockito.Mockito.when(enrollmentRepository.findByClassId(classId))
                .thenReturn(java.util.List.of(enrolment(studentRow)));
        org.mockito.Mockito.when(studentParentRepository
                .existsByParentIdAndStudentIdIn(studentUser, java.util.List.of(studentRow))).thenReturn(false);
        org.mockito.Mockito.when(studentRepository.findAllById(java.util.List.of(studentRow)))
                .thenReturn(java.util.List.of(s));

        authz.assertCanViewClassRoster(classId);   // no exception
    }

    @Test
    void classRoster_emptyRoster_forbidden() {
        UUID classId = UUID.randomUUID(), parent = UUID.randomUUID();
        login(AuthUser.builder().roleName("PARENT").userId(parent).build());
        org.mockito.Mockito.when(classRepository.findById(classId))
                .thenReturn(java.util.Optional.of(classIn(centerA)));
        org.mockito.Mockito.when(enrollmentRepository.findByClassId(classId))
                .thenReturn(java.util.List.of());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authz.assertCanViewClassRoster(classId));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void classRoster_doesNotQueryPerEnrolledStudent() {
        UUID classId = UUID.randomUUID(), parent = UUID.randomUUID();
        java.util.List<UUID> thirty = new java.util.ArrayList<>();
        for (int i = 0; i < 30; i++) thirty.add(UUID.randomUUID());
        login(AuthUser.builder().roleName("PARENT").userId(parent).build());
        org.mockito.Mockito.when(classRepository.findById(classId))
                .thenReturn(java.util.Optional.of(classIn(centerA)));
        org.mockito.Mockito.when(enrollmentRepository.findByClassId(classId))
                .thenReturn(thirty.stream().map(this::enrolment).toList());
        org.mockito.Mockito.when(studentParentRepository
                .existsByParentIdAndStudentIdIn(parent, thirty)).thenReturn(true);

        authz.assertCanViewClassRoster(classId);

        // the per-row calls the old implementation made, thirty times each
        org.mockito.Mockito.verify(studentParentRepository, org.mockito.Mockito.never())
                .existsByStudentIdAndParentId(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
        org.mockito.Mockito.verify(studentRepository, org.mockito.Mockito.never())
                .findById(org.mockito.ArgumentMatchers.any());
    }
}
