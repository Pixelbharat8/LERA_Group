package com.lera.payment_service.controller;

import com.lera.payment_service.entity.Refund;
import com.lera.payment_service.security.AuthUser;
import com.lera.payment_service.security.PaymentAccessService;
import com.lera.payment_service.service.RefundService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefundControllerAuthorizationTest {

    @Mock
    private RefundService refundService;

    @Mock
    private PaymentAccessService paymentAccess;

    private RefundController controller;

    private final UUID paymentVisible = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID paymentHidden = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @BeforeEach
    void setUp() {
        controller = new RefundController(refundService, paymentAccess);
    }

    @Test
    void getAllRefunds_centerManager_filtersByPaymentAccess() {
        AuthUser manager = AuthUser.builder().roleName("CENTER_MANAGER").build();
        Refund visible = new Refund();
        visible.setPaymentId(paymentVisible);
        Refund hidden = new Refund();
        hidden.setPaymentId(paymentHidden);
        Page<Refund> page = new PageImpl<>(List.of(visible, hidden));
        when(refundService.getAllRefunds(any(Pageable.class))).thenReturn(page);
        when(paymentAccess.isOrgWide("CENTER_MANAGER")).thenReturn(false);
        when(paymentAccess.canViewPaymentId(manager, paymentVisible)).thenReturn(true);
        when(paymentAccess.canViewPaymentId(manager, paymentHidden)).thenReturn(false);

        var res = controller.getAllRefunds(manager, Pageable.unpaged());
        assertEquals(200, res.getStatusCode().value());
        Page<?> body = (Page<?>) res.getBody();
        assertEquals(1, body.getContent().size());
    }

    @Test
    void getAllRefunds_parent_forbidden() {
        AuthUser parent = AuthUser.builder().roleName("PARENT").build();
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN))
                .when(paymentAccess)
                .assertPrivilegedStaff(parent);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getAllRefunds(parent, Pageable.unpaged()));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }
}
