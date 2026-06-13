package com.lera.attendance_service.security;

import com.lera.attendance_service.entity.AttendanceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AttendanceAuthorizationServiceTest {

    private static final UUID A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private AttendanceAuthorizationService authz;

    @BeforeEach
    void setUp() {
        authz = new AttendanceAuthorizationService();
    }

    @Test
    void effectiveLeaveRequestListCenterId_orgWide_preservesRequestedIncludingNull() {
        AuthUser ceo = AuthUser.builder().userId(UUID.randomUUID()).centerId(A).roleName("CEO").build();
        assertEquals(null, authz.effectiveLeaveRequestListCenterId(ceo, null));
        assertEquals(B, authz.effectiveLeaveRequestListCenterId(ceo, B));
    }

    @Test
    void effectiveLeaveRequestListCenterId_staff_forcesJwtWhenRequestedNull() {
        AuthUser teacher = AuthUser.builder().userId(UUID.randomUUID()).centerId(A).roleName("TEACHER").build();
        assertEquals(A, authz.effectiveLeaveRequestListCenterId(teacher, null));
    }

    @Test
    void effectiveLeaveRequestListCenterId_staff_rejectsOtherCenter() {
        AuthUser mgr = AuthUser.builder().userId(UUID.randomUUID()).centerId(A).roleName("CENTER_MANAGER").build();
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> authz.effectiveLeaveRequestListCenterId(mgr, B));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void effectiveLeaveRequestListCenterId_staff_missingJwt_forbidden() {
        AuthUser mgr = AuthUser.builder().userId(UUID.randomUUID()).centerId(null).roleName("STAFF").build();
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> authz.effectiveLeaveRequestListCenterId(mgr, null));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void assertAttendanceExceptionsForCaller_teacher_otherCenter_forbidden() {
        AuthUser teacher = AuthUser.builder().userId(UUID.randomUUID()).centerId(A).roleName("TEACHER").build();
        AttendanceException row = AttendanceException.builder().centerId(B).studentId(UUID.randomUUID()).build();
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> authz.assertAttendanceExceptionsForCaller(teacher, List.of(row)));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void assertCanMutateAttendanceException_student_forbidden() {
        AuthUser student = AuthUser.builder().userId(UUID.randomUUID()).centerId(A).roleName("STUDENT").build();
        AttendanceException row = AttendanceException.builder().centerId(A).studentId(UUID.randomUUID()).build();
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> authz.assertCanMutateAttendanceException(student, row));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }
}
