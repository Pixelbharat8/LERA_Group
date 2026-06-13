package com.lera.payment_service.controller;

import com.lera.payment_service.entity.FeeReceipt;
import com.lera.payment_service.security.AuthUser;
import com.lera.payment_service.security.PaymentAccessService;
import com.lera.payment_service.service.FeeReceiptService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FeeReceiptControllerAuthorizationTest {

    @Mock
    private FeeReceiptService feeReceiptService;

    @Mock
    private PaymentAccessService paymentAccess;

    private FeeReceiptController controller;

    private final UUID parentUser = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID studentEntity = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private final UUID otherStudent = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

    @BeforeEach
    void setUp() {
        controller = new FeeReceiptController(feeReceiptService, paymentAccess);
    }

    @Test
    void getReceiptsByStudent_parentLinked_ok() {
        AuthUser parent = AuthUser.builder().userId(parentUser).roleName("PARENT").build();
        when(feeReceiptService.getReceiptsByStudent(studentEntity)).thenReturn(List.of());
        var res = controller.getReceiptsByStudent(studentEntity, parent);
        assertEquals(200, res.getStatusCode().value());
    }

    @Test
    void getReceiptsByStudent_parentNotLinked_forbidden() {
        AuthUser parent = AuthUser.builder().userId(parentUser).roleName("PARENT").build();
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN))
                .when(paymentAccess)
                .assertCanViewStudentEntity(eq(parent), eq(otherStudent));
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getReceiptsByStudent(otherStudent, parent));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void getAllReceipts_parent_forbidden() {
        AuthUser parent = AuthUser.builder().userId(parentUser).roleName("PARENT").build();
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN))
                .when(paymentAccess)
                .assertPrivilegedStaff(parent);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getAllReceipts(parent, null));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void getReceiptById_parentOwnStudent_ok() {
        AuthUser parent = AuthUser.builder().userId(parentUser).roleName("PARENT").build();
        UUID receiptId = UUID.randomUUID();
        FeeReceipt receipt = new FeeReceipt();
        receipt.setId(receiptId);
        receipt.setStudentId(studentEntity);
        when(feeReceiptService.getReceiptById(receiptId)).thenReturn(Optional.of(receipt));
        when(paymentAccess.canViewStudentEntity(parent, studentEntity)).thenReturn(true);
        var res = controller.getReceiptById(receiptId, parent);
        assertEquals(200, res.getStatusCode().value());
    }
}
