package com.lera.attendance_service.controller;

import com.lera.attendance_service.entity.TeacherStaffLeave;
import com.lera.attendance_service.security.AttendanceAuthorizationService;
import com.lera.attendance_service.security.AuthUser;
import com.lera.attendance_service.service.LeaveBalanceAccrualService;
import com.lera.attendance_service.service.TeacherStaffLeaveService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
@Slf4j
public class TeacherStaffLeaveController {

    private final TeacherStaffLeaveService leaveService;
    private final LeaveBalanceAccrualService accrualService;
    private final AttendanceAuthorizationService authz;

    /**
     * All leaves — org-wide roles only (must be registered before {@code /{id}}).
     */
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<List<TeacherStaffLeave>> getAllLeaves() {
        try {
            List<TeacherStaffLeave> leaves = leaveService.getAllLeaves();
            return ResponseEntity.ok(leaves);
        } catch (Exception e) {
            log.error("Error getting all leaves", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Apply for leave
     */
    @PostMapping("/apply")
    public ResponseEntity<TeacherStaffLeave> applyLeave(
            @Valid @RequestBody TeacherStaffLeave leave,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            authz.assertApplyLeaveCenter(authUser, leave);
            TeacherStaffLeave created = leaveService.applyLeave(leave);
            return ResponseEntity.ok(created);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error applying for leave", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get leave by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<TeacherStaffLeave> getLeaveById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            TeacherStaffLeave leave = leaveService.getLeaveById(id);
            authz.assertCanReadLeave(authUser, leave);
            return ResponseEntity.ok(leave);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting leave by id: {}", id, e);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get all leaves for a user
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TeacherStaffLeave>> getLeavesByUser(
            @PathVariable UUID userId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            authz.assertCanQueryLeavesForUser(authUser, userId);
            List<TeacherStaffLeave> leaves = leaveService.getLeavesByUser(userId);
            if (!authz.isOrgWide(authUser) && authUser.getUserId() != null && !authUser.getUserId().equals(userId)) {
                leaves = leaves.stream()
                        .filter(l -> authz.leaveRowInCallerCenter(authUser, l))
                        .toList();
            }
            return ResponseEntity.ok(leaves);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting leaves for user: {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get all leaves for a center
     */
    @GetMapping("/center/{centerId}")
    @PreAuthorize(AttendanceAuthorizationService.PRE_CENTER_LEAVE_READS)
    public ResponseEntity<List<TeacherStaffLeave>> getLeavesByCenter(
            @PathVariable UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            authz.assertCenterAccess(authUser, centerId);
            List<TeacherStaffLeave> leaves = leaveService.getLeavesByCenter(centerId);
            return ResponseEntity.ok(leaves);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting leaves for center: {}", centerId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get pending leaves for a center
     */
    @GetMapping("/pending")
    @PreAuthorize(AttendanceAuthorizationService.PRE_CENTER_LEAVE_READS)
    public ResponseEntity<List<TeacherStaffLeave>> getPendingLeaves(
            @RequestParam UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            authz.assertCenterAccess(authUser, centerId);
            List<TeacherStaffLeave> leaves = leaveService.getPendingLeavesByCenter(centerId);
            return ResponseEntity.ok(leaves);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting pending leaves for center: {}", centerId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get leaves by center and status
     */
    @GetMapping("/center/{centerId}/status/{status}")
    @PreAuthorize(AttendanceAuthorizationService.PRE_CENTER_LEAVE_READS)
    public ResponseEntity<List<TeacherStaffLeave>> getLeavesByCenterAndStatus(
            @PathVariable UUID centerId,
            @PathVariable String status,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            authz.assertCenterAccess(authUser, centerId);
            List<TeacherStaffLeave> leaves = leaveService.getLeavesByCenterAndStatus(centerId, status);
            return ResponseEntity.ok(leaves);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting leaves for center: {} with status: {}", centerId, status, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get leaves in date range
     */
    @GetMapping("/center/{centerId}/date-range")
    @PreAuthorize(AttendanceAuthorizationService.PRE_CENTER_LEAVE_READS)
    public ResponseEntity<List<TeacherStaffLeave>> getLeavesByDateRange(
            @PathVariable UUID centerId,
            @RequestParam String startDate,
            @RequestParam String endDate,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            authz.assertCenterAccess(authUser, centerId);
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            List<TeacherStaffLeave> leaves = leaveService.getLeavesByDateRange(centerId, start, end);
            return ResponseEntity.ok(leaves);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting leaves by date range", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Approve leave
     */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    public ResponseEntity<TeacherStaffLeave> approveLeave(
            @PathVariable UUID id,
            @Valid @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            TeacherStaffLeave lv = leaveService.getLeaveById(id);
            authz.assertCenterAccessOrOrg(authUser, lv.getCenterId());
            UUID approvedBy = UUID.fromString((String) payload.get("approvedBy"));
            String approverRole = (String) payload.get("approverRole");
            Boolean isPaid = payload.get("isPaid") != null ? (Boolean) payload.get("isPaid") : true;
            String comments = (String) payload.get("comments");
            
            TeacherStaffLeave approved = leaveService.approveLeave(id, approvedBy, approverRole, isPaid, comments);
            return ResponseEntity.ok(approved);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error approving leave: {}", id, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Reject leave
     */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    public ResponseEntity<TeacherStaffLeave> rejectLeave(
            @PathVariable UUID id,
            @Valid @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            TeacherStaffLeave lv = leaveService.getLeaveById(id);
            authz.assertCenterAccessOrOrg(authUser, lv.getCenterId());
            UUID rejectedBy = UUID.fromString((String) payload.get("rejectedBy"));
            String rejectionReason = (String) payload.get("rejectionReason");
            String approverRole = (String) payload.get("approverRole");
            
            TeacherStaffLeave rejected = leaveService.rejectLeave(id, rejectedBy, rejectionReason, approverRole);
            return ResponseEntity.ok(rejected);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error rejecting leave: {}", id, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Cancel leave
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    public ResponseEntity<Void> cancelLeave(
            @PathVariable UUID id,
            @RequestParam UUID userId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            TeacherStaffLeave lv = leaveService.getLeaveById(id);
            if (authUser.getUserId() != null && authUser.getUserId().equals(userId)
                    && userId.equals(lv.getUserId())) {
                authz.assertCanReadLeave(authUser, lv);
            } else {
                authz.assertCenterAccessOrOrg(authUser, lv.getCenterId());
            }
            leaveService.cancelLeave(id, userId);
            return ResponseEntity.ok().build();
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error cancelling leave: {}", id, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Check if user has leave for a date
     */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkLeaveForDate(
            @RequestParam UUID userId,
            @RequestParam String date,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            if (authUser == null || (!authz.isOrgWide(authUser)
                    && (authUser.getUserId() == null || !authUser.getUserId().equals(userId)))) {
                return ResponseEntity.status(403).build();
            }
            LocalDate leaveDate = LocalDate.parse(date);
            boolean hasLeave = leaveService.hasApprovedLeaveForDate(userId, leaveDate);
            
            Map<String, Boolean> response = new HashMap<>();
            response.put("hasLeave", hasLeave);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error checking leave for date", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get leave balance for user - Now returns monthly accrual data
     */
    @GetMapping("/balance/{userId}")
    public ResponseEntity<Map<String, Object>> getLeaveBalance(
            @PathVariable UUID userId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            if (authUser == null || (!authz.isOrgWide(authUser)
                    && (authUser.getUserId() == null || !authUser.getUserId().equals(userId)))) {
                return ResponseEntity.status(403).build();
            }
            Map<String, Object> balance = leaveService.getLeaveBalance(userId);
            return ResponseEntity.ok(balance);
        } catch (Exception e) {
            log.error("Error getting leave balance for user: {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Initialize monthly accrual for a new user
     */
    @PostMapping("/accrual/initialize")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Map<String, Object>> initializeLeaveBalances(
            @RequestParam UUID userId,
            @RequestParam UUID centerId,
            @RequestParam String joinDate) {
        try {
            LocalDate join = LocalDate.parse(joinDate);
            accrualService.initializeAccrualsForNewUser(userId, centerId, join);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Accruals initialized successfully");
            response.put("userId", userId.toString());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error initializing accruals for user: {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Process monthly accrual for a user
     */
    @PostMapping("/accrual/process")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Map<String, Object>> processMonthlyAccrual(
            @RequestParam UUID userId,
            @RequestParam UUID centerId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        try {
            LocalDate now = LocalDate.now();
            Integer targetYear = year != null ? year : now.getYear();
            Integer targetMonth = month != null ? month : now.getMonthValue();
            
            accrualService.processMonthlyAccrual(userId, centerId, targetYear, targetMonth);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Monthly accrual processed");
            response.put("month", targetMonth.toString());
            response.put("year", targetYear.toString());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing monthly accrual", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Assign approver for leave (Chairman feature)
     */
    @PutMapping("/{id}/assign-approver")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<TeacherStaffLeave> assignApprover(
            @PathVariable UUID id,
            @RequestParam UUID approverId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            TeacherStaffLeave leave = leaveService.getLeaveById(id);
            authz.assertCenterAccessOrOrg(authUser, leave.getCenterId());
            leave.setAssignedApproverId(approverId);
            
            // Save updated leave
            TeacherStaffLeave updated = leaveService.applyLeave(leave);
            
            log.info("Approver assigned - Leave ID: {}, Approver: {}", id, approverId);
            
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error assigning approver to leave: {}", id, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get leaves that need CEO/Chairman visibility
     */
    @GetMapping("/executive/pending")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<List<TeacherStaffLeave>> getExecutivePendingLeaves(
            @RequestParam(required = false) UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            List<TeacherStaffLeave> leaves;
            if (centerId != null) {
                authz.assertCenterAccessOrOrg(authUser, centerId);
                leaves = leaveService.getLeavesByCenter(centerId);
            } else {
                leaves = leaveService.getAllLeaves();
            }
            
            // Filter for pending and notified to executives
            List<TeacherStaffLeave> executiveLeaves = leaves.stream()
                    .filter(l -> "PENDING".equals(l.getStatus()) && 
                                (l.getNotifiedToCeo() || l.getNotifiedToChairman()))
                    .toList();
            
            return ResponseEntity.ok(executiveLeaves);
        } catch (Exception e) {
            log.error("Error getting executive pending leaves", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Mark leave as viewed by CEO
     */
    @PutMapping("/{id}/ceo-viewed")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Map<String, String>> markCeoViewed(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            TeacherStaffLeave leave = leaveService.getLeaveById(id);
            authz.assertCenterAccessOrOrg(authUser, leave.getCenterId());
            leave.setCeoViewedAt(java.time.LocalDateTime.now());
            leaveService.applyLeave(leave);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Marked as viewed by CEO");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error marking CEO viewed", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Mark leave as viewed by Chairman
     */
    @PutMapping("/{id}/chairman-viewed")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Map<String, String>> markChairmanViewed(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            TeacherStaffLeave leave = leaveService.getLeaveById(id);
            authz.assertCenterAccessOrOrg(authUser, leave.getCenterId());
            leave.setChairmanViewedAt(java.time.LocalDateTime.now());
            leaveService.applyLeave(leave);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Marked as viewed by Chairman");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error marking Chairman viewed", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get leaves by user and year
     */
    @GetMapping("/user/{userId}/year/{year}")
    public ResponseEntity<List<TeacherStaffLeave>> getLeavesByUserAndYear(
            @PathVariable UUID userId,
            @PathVariable int year,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            authz.assertCanQueryLeavesForUser(authUser, userId);
            List<TeacherStaffLeave> leaves = leaveService.getLeavesByUserAndYear(userId, year);
            if (!authz.isOrgWide(authUser) && authUser.getUserId() != null && !authUser.getUserId().equals(userId)) {
                leaves = leaves.stream()
                        .filter(l -> authz.leaveRowInCallerCenter(authUser, l))
                        .toList();
            }
            return ResponseEntity.ok(leaves);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting leaves for user: {} and year: {}", userId, year, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Count pending leaves by center
     */
    @GetMapping("/pending/count")
    @PreAuthorize(AttendanceAuthorizationService.PRE_CENTER_LEAVE_READS)
    public ResponseEntity<Map<String, Long>> countPendingLeaves(
            @RequestParam UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            authz.assertCenterAccess(authUser, centerId);
            Long count = leaveService.countPendingLeavesByCenter(centerId);
            
            Map<String, Long> response = new HashMap<>();
            response.put("pendingCount", count);
            
            return ResponseEntity.ok(response);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error counting pending leaves for center: {}", centerId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get leaves by user type
     */
    @GetMapping("/center/{centerId}/type/{userType}")
    @PreAuthorize(AttendanceAuthorizationService.PRE_CENTER_LEAVE_READS)
    public ResponseEntity<List<TeacherStaffLeave>> getLeavesByUserType(
            @PathVariable UUID centerId,
            @PathVariable String userType,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            authz.assertCenterAccess(authUser, centerId);
            List<TeacherStaffLeave> leaves = leaveService.getLeavesByUserType(userType, centerId);
            return ResponseEntity.ok(leaves);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting leaves by user type", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get leaves by reporting manager (for approval)
     */
    @GetMapping("/reporting-manager/{managerId}")
    public ResponseEntity<List<TeacherStaffLeave>> getLeavesByReportingManager(
            @PathVariable UUID managerId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            authz.assertReportingManagerOrOrg(authUser, managerId);
            List<TeacherStaffLeave> leaves = leaveService.getLeavesByReportingManager(managerId);
            return ResponseEntity.ok(leaves);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting leaves for reporting manager: {}", managerId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get leaves CC'd to center manager (view only, no approval)
     */
    @GetMapping("/center-manager/{managerId}/cc")
    public ResponseEntity<List<TeacherStaffLeave>> getLeavesCCToCenterManager(
            @PathVariable UUID managerId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            authz.assertReportingManagerOrOrg(authUser, managerId);
            List<TeacherStaffLeave> leaves = leaveService.getLeavesByCenterManager(managerId);
            return ResponseEntity.ok(leaves);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting CC leaves for center manager: {}", managerId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Mark leave as viewed by center manager (CC only)
     */
    @PutMapping("/{id}/center-manager-viewed")
    public ResponseEntity<Map<String, String>> markCenterManagerViewed(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            TeacherStaffLeave leave = leaveService.getLeaveById(id);
            authz.assertCanReadLeave(authUser, leave);
            leave.setCenterManagerViewedAt(java.time.LocalDateTime.now());
            leaveService.applyLeave(leave);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Marked as viewed by Center Manager");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error marking center manager viewed", e);
            return ResponseEntity.badRequest().build();
        }
    }
}
