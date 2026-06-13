package com.lera.payroll_service.security;

import com.lera.payroll_service.entity.PayrollRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PayrollAuthorizationServiceTest {

    private PayrollAuthorizationService authz;

    private final UUID centerId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private final UUID teacherId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID otherTeacher = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @BeforeEach
    void setUp() {
        authz = new PayrollAuthorizationService();
    }

    @Test
    void effectivePayrollSubject_self_ok() {
        AuthUser teacher = AuthUser.builder().userId(teacherId).roleName("TEACHER").centerId(centerId).build();
        assertEquals(teacherId, authz.effectivePayrollSubjectId(teacher, teacherId));
    }

    @Test
    void effectivePayrollSubject_teacher_other_forbidden() {
        AuthUser teacher = AuthUser.builder().userId(teacherId).roleName("TEACHER").centerId(centerId).build();
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authz.effectivePayrollSubjectId(teacher, otherTeacher));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void effectiveQueryCenter_crossCenter_forbidden() {
        UUID otherCenter = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
        AuthUser manager = AuthUser.builder().userId(UUID.randomUUID()).roleName("CENTER_MANAGER").centerId(centerId).build();
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authz.effectiveQueryCenterId(manager, otherCenter));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void assertCanViewPayrollRecord_sameCenterManager_ok() {
        AuthUser manager = AuthUser.builder().userId(UUID.randomUUID()).roleName("CENTER_MANAGER").centerId(centerId).build();
        PayrollRecord record = PayrollRecord.builder().teacherId(otherTeacher).centerId(centerId).build();
        authz.assertCanViewPayrollRecord(manager, record);
    }
}
