package com.lera.payment_service.controller;

import com.lera.payment_service.entity.Discount;
import com.lera.payment_service.security.AuthUser;
import com.lera.payment_service.security.PaymentAccessService;
import com.lera.payment_service.service.DiscountService;
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
@RequestMapping("/api/discounts")
@RequiredArgsConstructor
public class DiscountController {

    private final DiscountService discountService;
    private final PaymentAccessService paymentAccess;

    @GetMapping
    public ResponseEntity<?> getAllDiscounts(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean isActive,
            Pageable pageable) {
        if (Boolean.TRUE.equals(isActive)) {
            return ResponseEntity.ok(discountService.getActiveDiscounts());
        }
        if (type != null) {
            paymentAccess.assertPrivilegedStaff(authUser);
            return ResponseEntity.ok(discountService.getDiscountsByType(Discount.DiscountType.valueOf(type)));
        }
        paymentAccess.assertPrivilegedStaff(authUser);
        return ResponseEntity.ok(discountService.getAllDiscounts(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Discount> getDiscountById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return discountService.getDiscountById(id)
                .map(d -> {
                    if (Boolean.TRUE.equals(d.getIsActive())) {
                        return ResponseEntity.ok(d);
                    }
                    paymentAccess.assertPrivilegedStaff(authUser);
                    return ResponseEntity.ok(d);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<Discount> getDiscountByCode(@PathVariable String code) {
        return discountService.getDiscountByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Discount> createDiscount(@Valid @RequestBody Discount discount) {
        return ResponseEntity.status(HttpStatus.CREATED).body(discountService.createDiscount(discount));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Discount> updateDiscount(@PathVariable UUID id, @Valid @RequestBody Discount discount) {
        return discountService.updateDiscount(id, discount)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> deleteDiscount(@PathVariable UUID id) {
        return discountService.deleteDiscount(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validatePromoCode(@Valid @RequestBody Map<String, Object> request) {
        String code = (String) request.get("code");
        return ResponseEntity.ok(discountService.validatePromoCode(code));
    }

    @PostMapping("/{id}/apply")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Discount> applyDiscount(@PathVariable UUID id) {
        return discountService.applyDiscount(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Discount> toggleActive(@PathVariable UUID id) {
        return discountService.toggleActive(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Discount> updateDiscountStatus(@PathVariable UUID id, @Valid @RequestBody Map<String, String> body) {
        return discountService.updateStatus(id, body.get("status"))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/types")
    public ResponseEntity<Discount.DiscountType[]> getTypes() {
        return ResponseEntity.ok(Discount.DiscountType.values());
    }
}
