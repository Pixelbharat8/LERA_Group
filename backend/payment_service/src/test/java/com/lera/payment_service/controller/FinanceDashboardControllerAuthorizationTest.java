package com.lera.payment_service.controller;

import com.lera.payment_service.security.AuthUser;
import com.lera.payment_service.security.PaymentAccessService;
import com.lera.payment_service.service.FinanceDashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FinanceDashboardControllerAuthorizationTest {

    @Mock
    private FinanceDashboardService financeDashboardService;

    @Mock
    private PaymentAccessService paymentAccess;

    private FinanceDashboardController controller;

    private final UUID centerA = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

    @BeforeEach
    void setUp() {
        controller = new FinanceDashboardController(financeDashboardService, paymentAccess);
    }

    @Test
    void getDashboard_staff_ok() {
        AuthUser accountant = AuthUser.builder().roleName("ACCOUNTANT").centerId(centerA).build();
        when(financeDashboardService.getDashboardSummary(centerA)).thenReturn(Map.of("total", 0));
        when(paymentAccess.effectiveCenterId(accountant, null)).thenReturn(centerA);
        var res = controller.getDashboard(accountant, null);
        assertEquals(200, res.getStatusCode().value());
    }

    @Test
    void getDashboard_parent_forbidden() {
        AuthUser parent = AuthUser.builder().roleName("PARENT").build();
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN))
                .when(paymentAccess)
                .assertPrivilegedStaff(parent);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getDashboard(parent, null));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }
}
