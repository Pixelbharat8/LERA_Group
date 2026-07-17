package com.lera.attendance_service.controller;

import com.lera.attendance_service.entity.LeaveBalanceAccrual;
import com.lera.attendance_service.security.AttendanceAuthorizationService;
import com.lera.attendance_service.security.AuthUser;
import com.lera.attendance_service.service.LeaveBalanceAccrualService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller for managing leave balance information.
 * Provides a simplified endpoint for getting user leave balance.
 * Works with the monthly accrual system to compute total balance.
 */
@RestController
@RequestMapping("/api/leave-balance")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("isAuthenticated()")
public class LeaveBalanceController {

    private final LeaveBalanceAccrualService leaveBalanceService;
    private final AttendanceAuthorizationService authz;

    private Map<String, Object> buildBalanceResponse(UUID userId, Map<String, Object> balance) {
        Map<String, Object> response = new HashMap<>(balance);
        response.put("userId", userId);
        response.put("totalAllowed", balance.getOrDefault("expectedAnnualLeaves", 12.0));
        response.put("annualLeave", balance.getOrDefault("totalAccruedThisYear", 0.0));
        response.put("used", balance.getOrDefault("totalUsedThisYear", 0.0));
        response.put("usedLeave", balance.getOrDefault("totalUsedThisYear", 0.0));
        response.put("remaining", balance.getOrDefault("totalAvailable", 0.0));
        response.put("remainingLeave", balance.getOrDefault("totalAvailable", 0.0));
        response.put("pending", 0);
        // Sick/casual leave are not tracked by the accrual system — report null (not tracked)
        // rather than fabricating fixed 10/5 allowances.
        response.put("sickLeave", null);
        response.put("usedSickLeave", null);
        response.put("casualLeave", null);
        response.put("usedCasualLeave", null);
        response.put("sickCasualTracked", false);
        return response;
    }

    /**
     * Get leave balance for a specific user
     * Endpoint: GET /api/leave-balance?userId={userId}
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getLeaveBalance(
            @RequestParam UUID userId,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertCanQueryLeaveBalance(authUser, userId);
        try {
            log.info("Fetching leave balance for user: {}", userId);
            Map<String, Object> balance = leaveBalanceService.getLeaveBalance(userId);
            return ResponseEntity.ok(buildBalanceResponse(userId, balance));
        } catch (Exception e) {
            log.error("Error fetching leave balance for user: {}", userId, e);
            // Do NOT mask the failure behind a fabricated healthy 12-day balance — surface it,
            // otherwise a real service fault silently reports a full, incorrect balance.
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not compute leave balance");
        }
    }

    /**
     * Get leave balance by user ID path parameter
     * Endpoint: GET /api/leave-balance/{userId}
     */
    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getLeaveBalanceByPath(
            @PathVariable UUID userId,
            @AuthenticationPrincipal AuthUser authUser) {
        return getLeaveBalance(userId, authUser);
    }

    /**
     * Get leave history for a specific user and year
     * Endpoint: GET /api/leave-balance/{userId}/history?year={year}
     */
    @GetMapping("/{userId}/history")
    public ResponseEntity<List<LeaveBalanceAccrual>> getLeaveHistory(
            @PathVariable UUID userId,
            @RequestParam(required = false) Integer year,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertCanQueryLeaveBalance(authUser, userId);
        try {
            log.info("Fetching leave history for user: {} year: {}", userId, year);
            List<LeaveBalanceAccrual> history = leaveBalanceService.getLeaveHistory(userId, year);
            if (!authz.isOrgWide(authUser) && authUser.getCenterId() != null) {
                history = history.stream()
                        .filter(a -> authUser.getCenterId().equals(a.getCenterId()))
                        .toList();
            }
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error fetching leave history for user: {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Check if user has sufficient leave balance
     * Endpoint: GET /api/leave-balance/{userId}/check?days={days}
     */
    @GetMapping("/{userId}/check")
    public ResponseEntity<Map<String, Object>> checkLeaveBalance(
            @PathVariable UUID userId,
            @RequestParam Double days,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertCanQueryLeaveBalance(authUser, userId);
        try {
            log.info("Checking leave balance for user: {} days: {}", userId, days);
            boolean hasSufficient = leaveBalanceService.hasSufficientBalance(userId, days);
            Map<String, Object> response = new HashMap<>();
            response.put("userId", userId);
            response.put("daysRequested", days);
            response.put("hasSufficientBalance", hasSufficient);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error checking leave balance for user: {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Initialize accruals for a new user
     * Endpoint: POST /api/leave-balance/{userId}/initialize
     */
    @PostMapping("/{userId}/initialize")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    public ResponseEntity<Map<String, Object>> initializeLeaveBalance(
            @PathVariable UUID userId,
            @Valid @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            log.info("Initializing leave balance for user: {}", userId);
            UUID centerId = UUID.fromString((String) payload.get("centerId"));
            authz.assertCenterAccessOrOrg(authUser, centerId);
            LocalDate joinDate = payload.containsKey("joinDate")
                    ? LocalDate.parse((String) payload.get("joinDate"))
                    : LocalDate.now();
            leaveBalanceService.initializeAccrualsForNewUser(userId, centerId, joinDate);
            Map<String, Object> response = new HashMap<>();
            response.put("userId", userId);
            response.put("message", "Leave balance initialized successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error initializing leave balance for user: {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }
}
