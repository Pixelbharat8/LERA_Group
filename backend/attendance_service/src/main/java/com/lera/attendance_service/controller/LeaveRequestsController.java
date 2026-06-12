package com.lera.attendance_service.controller;

import com.lera.attendance_service.entity.TeacherStaffLeave;
import com.lera.attendance_service.security.AttendanceAuthorizationService;
import com.lera.attendance_service.security.AuthUser;
import com.lera.attendance_service.service.TeacherStaffLeaveService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Simplified leave-request routes. Center scope matches {@link TeacherStaffLeaveController};
 * aggregate lists without a center are org-wide only (via {@link AttendanceAuthorizationService}).
 */
@RestController
@RequestMapping("/api/leave-requests")
@RequiredArgsConstructor
@Slf4j
public class LeaveRequestsController {

    private final TeacherStaffLeaveService leaveService;
    private final AttendanceAuthorizationService authz;

    /**
     * GET /api/leave-requests?status=&centerId=
     */
    @GetMapping
    @PreAuthorize(AttendanceAuthorizationService.PRE_CENTER_LEAVE_READS)
    public ResponseEntity<List<TeacherStaffLeave>> getLeaveRequests(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            UUID eff = authz.effectiveLeaveRequestListCenterId(authUser, centerId);
            List<TeacherStaffLeave> leaves = resolveLeaveList(eff, status);
            return ResponseEntity.ok(leaves);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching leave requests", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * GET /api/leave-requests/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TeacherStaffLeave> getLeaveRequestById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            TeacherStaffLeave leave = leaveService.getLeaveById(id);
            authz.assertCanReadLeave(authUser, leave);
            return ResponseEntity.ok(leave);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching leave request: {}", id, e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /api/leave-requests/user/{userId}?status=
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TeacherStaffLeave>> getLeaveRequestsByUser(
            @PathVariable UUID userId,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            authz.assertCanQueryLeavesForUser(authUser, userId);
            List<TeacherStaffLeave> leaves = leaveService.getLeavesByUser(userId);
            if (status != null && !status.isEmpty()) {
                leaves = leaves.stream()
                        .filter(l -> l.getStatus() != null && l.getStatus().equalsIgnoreCase(status))
                        .collect(Collectors.toList());
            }
            if (!authz.isOrgWide(authUser)
                    && authUser.getUserId() != null
                    && !authUser.getUserId().equals(userId)) {
                leaves = leaves.stream()
                        .filter(l -> authz.leaveRowInCallerCenter(authUser, l))
                        .collect(Collectors.toList());
            }
            return ResponseEntity.ok(leaves);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching leave requests for user: {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * GET /api/leave-requests/pending?centerId=
     */
    @GetMapping("/pending")
    @PreAuthorize(AttendanceAuthorizationService.PRE_CENTER_LEAVE_READS)
    public ResponseEntity<List<TeacherStaffLeave>> getPendingLeaveRequests(
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            UUID eff = authz.effectiveLeaveRequestListCenterId(authUser, centerId);
            List<TeacherStaffLeave> leaves;
            if (eff != null) {
                leaves = leaveService.getPendingLeavesByCenter(eff);
            } else {
                leaves = leaveService.getAllLeaves().stream()
                        .filter(l -> "PENDING".equalsIgnoreCase(l.getStatus()))
                        .collect(Collectors.toList());
            }
            return ResponseEntity.ok(leaves);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching pending leave requests", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * GET /api/leave-requests/count?status=&centerId=
     */
    @GetMapping("/count")
    @PreAuthorize(AttendanceAuthorizationService.PRE_CENTER_LEAVE_READS)
    public ResponseEntity<Long> getLeaveRequestsCount(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            UUID eff = authz.effectiveLeaveRequestListCenterId(authUser, centerId);
            List<TeacherStaffLeave> leaves = resolveLeaveList(eff, status);
            return ResponseEntity.ok((long) leaves.size());
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error counting leave requests", e);
            return ResponseEntity.ok(0L);
        }
    }

    private List<TeacherStaffLeave> resolveLeaveList(UUID effectiveCenterId, String status) {
        List<TeacherStaffLeave> leaves;
        if (effectiveCenterId != null) {
            if (status != null && !status.isBlank()) {
                leaves = leaveService.getLeavesByCenterAndStatus(effectiveCenterId, status.toUpperCase());
            } else {
                leaves = leaveService.getLeavesByCenter(effectiveCenterId);
            }
        } else {
            leaves = leaveService.getAllLeaves();
            if (status != null && !status.isBlank()) {
                leaves = leaves.stream()
                        .filter(l -> l.getStatus() != null && l.getStatus().equalsIgnoreCase(status))
                        .collect(Collectors.toList());
            }
        }
        return leaves;
    }
}
