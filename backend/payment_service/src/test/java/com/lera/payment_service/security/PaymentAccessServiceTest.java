package com.lera.payment_service.security;

import com.lera.payment_service.entity.Payment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentAccessServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    private PaymentAccessService service;

    private final UUID parentUser = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID studentEntity = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private final UUID centerA = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

    @BeforeEach
    void setUp() {
        service = new PaymentAccessService(jdbcTemplate);
    }

    @Test
    void canViewPayment_parent_linked() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class), eq(studentEntity), eq(parentUser)))
                .thenReturn(1L);
        AuthUser parent = AuthUser.builder().userId(parentUser).roleName("PARENT").build();
        Payment p = new Payment();
        p.setStudentId(studentEntity);
        p.setCenterId(centerA);
        assertTrue(service.canViewPayment(parent, p));
    }

    @Test
    void canViewStudentEntity_student_self() {
        UUID studentUser = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
        when(jdbcTemplate.queryForObject(anyString(), eq(UUID.class), eq(studentUser)))
                .thenReturn(studentEntity);
        AuthUser student = AuthUser.builder().userId(studentUser).roleName("STUDENT").build();
        assertTrue(service.canViewStudentEntity(student, studentEntity));
    }

    @Test
    void canViewPayment_parent_notLinked() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class), eq(studentEntity), eq(parentUser)))
                .thenReturn(0L);
        AuthUser parent = AuthUser.builder().userId(parentUser).roleName("PARENT").build();
        Payment p = new Payment();
        p.setStudentId(studentEntity);
        assertFalse(service.canViewPayment(parent, p));
    }
}
