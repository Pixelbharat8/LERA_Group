package com.lera.attendance_service.controller;

import com.lera.attendance_service.entity.LeaveBalanceAccrual;
import com.lera.attendance_service.repository.LeaveBalanceAccrualRepository;
import com.lera.attendance_service.security.AttendanceAuthorizationService;
import com.lera.attendance_service.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/api/leave-balance-accruals")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class LeaveBalanceAccrualController {

    private final LeaveBalanceAccrualRepository leaveBalanceAccrualRepository;
    private final AttendanceAuthorizationService authz;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER')")
    public ResponseEntity<List<LeaveBalanceAccrual>> getAllAccruals(
            @RequestParam(required = false) UUID centerId,
            Pageable pageable,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertAuthenticated(authUser);
        if (centerId != null) {
            UUID eff = authz.effectiveQueryCenterId(authUser, centerId);
            return ResponseEntity.ok(leaveBalanceAccrualRepository.findByCenterIdOrderByYearDescMonthDesc(eff));
        }
        if (!authz.isOrgWide(authUser)) {
            UUID jwtCenter = authUser.getCenterId();
            if (jwtCenter != null) {
                return ResponseEntity.ok(leaveBalanceAccrualRepository.findByCenterIdOrderByYearDescMonthDesc(jwtCenter));
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "centerId is required for accrual list queries");
        }
        return ResponseEntity.ok(leaveBalanceAccrualRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeaveBalanceAccrual> getAccrualById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return leaveBalanceAccrualRepository.findById(id)
                .map(a -> {
                    authz.assertCanAccessAccrual(authUser, a);
                    return ResponseEntity.ok(a);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<LeaveBalanceAccrual>> getAccrualsByUser(
            @PathVariable UUID userId,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertCanQueryLeaveBalance(authUser, userId);
        List<LeaveBalanceAccrual> rows =
                leaveBalanceAccrualRepository.findByUserIdOrderByYearDescMonthDesc(userId);
        if (!authz.isOrgWide(authUser) && authUser.getCenterId() != null) {
            rows = rows.stream().filter(a -> authUser.getCenterId().equals(a.getCenterId())).toList();
        }
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/user/{userId}/year/{year}")
    public ResponseEntity<List<LeaveBalanceAccrual>> getAccrualsByUserAndYear(
            @PathVariable UUID userId,
            @PathVariable Integer year,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertCanQueryLeaveBalance(authUser, userId);
        List<LeaveBalanceAccrual> rows = leaveBalanceAccrualRepository.findByUserIdAndYear(userId, year);
        if (!authz.isOrgWide(authUser) && authUser.getCenterId() != null) {
            rows = rows.stream().filter(a -> authUser.getCenterId().equals(a.getCenterId())).toList();
        }
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/user/{userId}/year/{year}/month/{month}")
    public ResponseEntity<LeaveBalanceAccrual> getAccrualByUserYearMonth(
            @PathVariable UUID userId,
            @PathVariable Integer year,
            @PathVariable Integer month,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertCanQueryLeaveBalance(authUser, userId);
        return leaveBalanceAccrualRepository.findByUserIdAndYearAndMonth(userId, year, month)
                .map(a -> {
                    authz.assertCanAccessAccrual(authUser, a);
                    return ResponseEntity.ok(a);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}/year/{year}/total-available")
    public ResponseEntity<Double> getTotalAvailableLeaves(
            @PathVariable UUID userId,
            @PathVariable Integer year,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertCanQueryLeaveBalance(authUser, userId);
        return ResponseEntity.ok(
                leaveBalanceAccrualRepository.getTotalAvailableLeavesByUserAndYear(userId, year));
    }

    @GetMapping("/center/{centerId}/users")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER')")
    public ResponseEntity<List<UUID>> getUsersByCenter(
            @PathVariable UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        authz.assertCenterAccessOrOrg(authUser, centerId);
        return ResponseEntity.ok(leaveBalanceAccrualRepository.findDistinctUserIdsByCenterId(centerId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    public ResponseEntity<LeaveBalanceAccrual> createAccrual(
            @Valid @RequestBody LeaveBalanceAccrual accrual,
            @AuthenticationPrincipal AuthUser authUser) {
        if (accrual.getCenterId() != null) {
            authz.assertCenterAccessOrOrg(authUser, accrual.getCenterId());
        }
        return ResponseEntity.ok(leaveBalanceAccrualRepository.save(accrual));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN')")
    public ResponseEntity<LeaveBalanceAccrual> updateAccrual(
            @PathVariable UUID id,
            @Valid @RequestBody LeaveBalanceAccrual accrualDetails,
            @AuthenticationPrincipal AuthUser authUser) {
        return leaveBalanceAccrualRepository.findById(id).map(accrual -> {
            authz.assertCanAccessAccrual(authUser, accrual);
            if (accrualDetails.getLeavesAccrued() != null) {
                accrual.setLeavesAccrued(accrualDetails.getLeavesAccrued());
            }
            if (accrualDetails.getLeavesUsed() != null) {
                accrual.setLeavesUsed(accrualDetails.getLeavesUsed());
            }
            if (accrualDetails.getLeavesCarriedForward() != null) {
                accrual.setLeavesCarriedForward(accrualDetails.getLeavesCarriedForward());
            }
            if (accrualDetails.getTotalAvailable() != null) {
                accrual.setTotalAvailable(accrualDetails.getTotalAvailable());
            }
            return ResponseEntity.ok(leaveBalanceAccrualRepository.save(accrual));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> deleteAccrual(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return leaveBalanceAccrualRepository.findById(id)
                .map(a -> {
                    authz.assertCanAccessAccrual(authUser, a);
                    leaveBalanceAccrualRepository.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
