package com.lera.payment_service.controller;

import com.lera.payment_service.entity.LedgerEntry;
import com.lera.payment_service.security.AuthUser;
import com.lera.payment_service.security.PaymentAccessService;
import com.lera.payment_service.service.LedgerEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ledger")
@RequiredArgsConstructor
public class LedgerEntryController {

    private final LedgerEntryService ledgerEntryService;
    private final PaymentAccessService paymentAccess;

    @GetMapping
    public ResponseEntity<?> getAll(
            @AuthenticationPrincipal AuthUser authUser,
            Pageable pageable) {
        paymentAccess.assertPrivilegedStaff(authUser);
        return ResponseEntity.ok(ledgerEntryService.getAllEntries(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        paymentAccess.assertPrivilegedStaff(authUser);
        return ledgerEntryService.getEntryById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/range")
    public ResponseEntity<?> getByDateRange(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        paymentAccess.assertPrivilegedStaff(authUser);
        return ResponseEntity.ok(ledgerEntryService.getEntriesByDateRange(startDate, endDate));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(@AuthenticationPrincipal AuthUser authUser) {
        paymentAccess.assertPrivilegedStaff(authUser);
        return ResponseEntity.ok(ledgerEntryService.getFinancialSummary());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<?> create(@Valid @RequestBody LedgerEntry entry) {
        return ResponseEntity.ok(ledgerEntryService.createEntry(entry));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<?> update(@PathVariable UUID id, @Valid @RequestBody LedgerEntry entry) {
        return ledgerEntryService.updateEntry(id, entry)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<?> approve(@PathVariable UUID id, @Valid @RequestBody Map<String, String> body) {
        return ledgerEntryService.approveEntry(id, body.get("approvedBy") != null ? UUID.fromString(body.get("approvedBy")) : null)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/post")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','ACCOUNTANT')")
    public ResponseEntity<?> post(@PathVariable UUID id) {
        return ledgerEntryService.postEntry(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.badRequest().body(Map.of("success", false, "message", "Must be approved first or not found")));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        return ledgerEntryService.deleteEntry(id)
                ? ResponseEntity.ok(Map.of("success", true, "message", "Deleted"))
                : ResponseEntity.badRequest().body(Map.of("success", false, "message", "Only pending entries can be deleted or not found"));
    }
}
