package com.lera.payment_service.controller;

import com.lera.payment_service.security.AuthUser;
import com.lera.payment_service.security.PaymentAccessService;
import com.lera.payment_service.service.FinanceDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
public class FinanceDashboardController {

    private final FinanceDashboardService financeDashboardService;
    private final PaymentAccessService paymentAccess;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam(required = false) UUID centerId) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        paymentAccess.assertPrivilegedStaff(authUser);
        UUID effCenter = paymentAccess.effectiveCenterId(authUser, centerId);
        return ResponseEntity.ok(financeDashboardService.getDashboardSummary(effCenter));
    }

    @GetMapping("/revenue/by-center")
    public ResponseEntity<?> getRevenueByCenter(@AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        paymentAccess.assertPrivilegedStaff(authUser);
        if (!paymentAccess.isOrgWide(authUser.getRoleName())) {
            UUID center = paymentAccess.effectiveCenterId(authUser, null);
            return ResponseEntity.ok(financeDashboardService.getRevenueByCenterId(center));
        }
        return ResponseEntity.ok(financeDashboardService.getRevenueByCenter());
    }

    @GetMapping("/revenue/monthly")
    public ResponseEntity<?> getMonthlyRevenue(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam(required = false) UUID centerId) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        paymentAccess.assertPrivilegedStaff(authUser);
        UUID effCenter = paymentAccess.effectiveCenterId(authUser, centerId);
        return ResponseEntity.ok(financeDashboardService.getMonthlyRevenue(effCenter));
    }

    @GetMapping("/revenue/center/{centerId}")
    public ResponseEntity<Map<String, Object>> getRevenueBySpecificCenter(
            @PathVariable UUID centerId,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        paymentAccess.assertPrivilegedStaff(authUser);
        UUID effCenter = paymentAccess.effectiveCenterId(authUser, centerId);
        return ResponseEntity.ok(financeDashboardService.getRevenueByCenterId(effCenter));
    }
}
