package com.lera.payment_service.controller;

import com.lera.payment_service.entity.StudentDiscount;
import com.lera.payment_service.security.AuthUser;
import com.lera.payment_service.security.PaymentAccessService;
import com.lera.payment_service.service.StudentDiscountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/student-discounts")
@RequiredArgsConstructor
public class StudentDiscountController {

    private final StudentDiscountService studentDiscountService;
    private final PaymentAccessService paymentAccess;

    @GetMapping
    public ResponseEntity<?> getAll(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) UUID discountId,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (studentId != null) {
            paymentAccess.assertCanViewStudentEntity(authUser, studentId);
            return ResponseEntity.ok(studentDiscountService.getByStudent(studentId));
        }
        if (discountId != null || status != null) {
            paymentAccess.assertPrivilegedStaff(authUser);
            if (discountId != null) {
                return ResponseEntity.ok(studentDiscountService.getByDiscount(discountId));
            }
        }
        paymentAccess.assertPrivilegedStaff(authUser);
        return ResponseEntity.ok(studentDiscountService.getAllStudentDiscounts(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentDiscount> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return studentDiscountService.getById(id)
                .filter(d -> paymentAccess.canViewStudentEntity(authUser, d.getStudentId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<?> create(@Valid @RequestBody StudentDiscount studentDiscount) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentDiscountService.create(studentDiscount));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<?> update(@PathVariable UUID id, @Valid @RequestBody StudentDiscount studentDiscount) {
        return studentDiscountService.update(id, studentDiscount)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<?> toggleStatus(@PathVariable UUID id) {
        return studentDiscountService.toggleStatus(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        return studentDiscountService.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
