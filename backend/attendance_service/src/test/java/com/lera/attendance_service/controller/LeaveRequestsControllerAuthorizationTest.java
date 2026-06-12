package com.lera.attendance_service.controller;

import com.lera.attendance_service.entity.TeacherStaffLeave;
import com.lera.attendance_service.security.AttendanceAuthorizationService;
import com.lera.attendance_service.security.AuthUser;
import com.lera.attendance_service.service.TeacherStaffLeaveService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Direct controller calls (no servlet stack, no {@code @PreAuthorize} proxy) — validates
 * {@link AttendanceAuthorizationService} integration on {@link LeaveRequestsController}.
 */
class LeaveRequestsControllerAuthorizationTest {

    private static final UUID CENTER_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID CENTER_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private final AttendanceAuthorizationService authz = new AttendanceAuthorizationService();

    private static class RecordingTeacherStaffLeaveService extends TeacherStaffLeaveService {

        UUID lastGetLeavesByCenter;
        UUID lastGetPendingLeavesByCenter;
        boolean getAllLeavesCalled;

        RecordingTeacherStaffLeaveService() {
            super(null, null, null);
        }

        @Override
        public List<TeacherStaffLeave> getLeavesByCenter(UUID centerId) {
            lastGetLeavesByCenter = centerId;
            return List.of();
        }

        @Override
        public List<TeacherStaffLeave> getPendingLeavesByCenter(UUID centerId) {
            lastGetPendingLeavesByCenter = centerId;
            return List.of();
        }

        @Override
        public List<TeacherStaffLeave> getLeavesByCenterAndStatus(UUID centerId, String status) {
            return List.of();
        }

        @Override
        public List<TeacherStaffLeave> getAllLeaves() {
            getAllLeavesCalled = true;
            return List.of();
        }
    }

    @Test
    void list_asTeacher_withoutCenterQuery_scopesToJwtCenter() {
        RecordingTeacherStaffLeaveService svc = new RecordingTeacherStaffLeaveService();
        LeaveRequestsController controller = new LeaveRequestsController(svc, authz);
        AuthUser u = AuthUser.builder()
                .userId(UUID.randomUUID())
                .centerId(CENTER_A)
                .roleName("TEACHER")
                .build();

        ResponseEntity<List<TeacherStaffLeave>> res = controller.getLeaveRequests(null, null, u);

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals(CENTER_A, svc.lastGetLeavesByCenter);
    }

    @Test
    void list_asTeacher_otherCenterParam_forbidden() {
        RecordingTeacherStaffLeaveService svc = new RecordingTeacherStaffLeaveService();
        LeaveRequestsController controller = new LeaveRequestsController(svc, authz);
        AuthUser u = AuthUser.builder()
                .userId(UUID.randomUUID())
                .centerId(CENTER_A)
                .roleName("TEACHER")
                .build();

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controller.getLeaveRequests(null, CENTER_B, u));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void list_asCeo_withoutCenter_globalAggregate() {
        RecordingTeacherStaffLeaveService svc = new RecordingTeacherStaffLeaveService();
        LeaveRequestsController controller = new LeaveRequestsController(svc, authz);
        AuthUser u = AuthUser.builder()
                .userId(UUID.randomUUID())
                .centerId(CENTER_A)
                .roleName("CEO")
                .build();

        ResponseEntity<List<TeacherStaffLeave>> res = controller.getLeaveRequests(null, null, u);

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertTrue(svc.getAllLeavesCalled);
    }

    @Test
    void list_asCeo_withCenter_filtersByCenter() {
        RecordingTeacherStaffLeaveService svc = new RecordingTeacherStaffLeaveService();
        LeaveRequestsController controller = new LeaveRequestsController(svc, authz);
        AuthUser u = AuthUser.builder()
                .userId(UUID.randomUUID())
                .centerId(CENTER_A)
                .roleName("CEO")
                .build();

        ResponseEntity<List<TeacherStaffLeave>> res =
                controller.getLeaveRequests(null, CENTER_B, u);

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals(CENTER_B, svc.lastGetLeavesByCenter);
    }

    @Test
    void pending_asStaff_scopesToJwtCenter() {
        RecordingTeacherStaffLeaveService svc = new RecordingTeacherStaffLeaveService();
        LeaveRequestsController controller = new LeaveRequestsController(svc, authz);
        AuthUser u = AuthUser.builder()
                .userId(UUID.randomUUID())
                .centerId(CENTER_A)
                .roleName("STAFF")
                .build();

        ResponseEntity<List<TeacherStaffLeave>> res =
                controller.getPendingLeaveRequests(null, u);

        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals(CENTER_A, svc.lastGetPendingLeavesByCenter);
    }
}
