package com.lera.payment_service.controller;

import com.lera.payment_service.entity.Invoice;
import com.lera.payment_service.security.AuthUser;
import com.lera.payment_service.security.InvoiceAccessService;
import com.lera.payment_service.service.InvoiceServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceServiceImpl invoiceService;
    private final InvoiceAccessService invoiceAccess;
    private final com.lera.payment_service.scheduler.PaymentReminderScheduler paymentReminderScheduler;

    /** Manually trigger the payment-reminder run (the scheduler also runs daily). */
    @org.springframework.web.bind.annotation.PostMapping("/reminders/run")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public org.springframework.http.ResponseEntity<java.util.Map<String, Object>> runReminders() {
        int sent = paymentReminderScheduler.runReminders();
        return org.springframework.http.ResponseEntity.ok(java.util.Map.of("remindersSent", sent));
    }

    /**
     * Get invoices with various filters
     * Frontend calls with: studentId, centerId, status, or parentId
     * For parentId, it returns invoices for children linked to that parent.
     * Parent/student callers are scoped to their own rows (see {@link InvoiceAccessService}).
     */
    @GetMapping
    public ResponseEntity<?> getAllInvoices(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false) UUID parentId,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        if (authUser == null || authUser.getUserId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (invoiceAccess.isPrivilegedStaff(authUser.getRoleName())) {
            if (studentId != null) {
                return ResponseEntity.ok(invoiceService.getInvoicesByStudent(studentId));
            }
            if (parentId != null) {
                List<Invoice> invoices = invoiceService.getInvoicesForParent(parentId);
                return ResponseEntity.ok(filterByStatus(invoices, status));
            }
            if (centerId != null) {
                return ResponseEntity.ok(invoiceService.getInvoicesByCenter(centerId));
            }
            if (status != null && !status.isEmpty()) {
                return ResponseEntity.ok(invoiceService.getInvoicesByStatus(status));
            }
            return ResponseEntity.ok(invoiceService.getAllInvoices(pageable));
        }

        String role = authUser.getRoleName();
        if (role != null && "PARENT".equalsIgnoreCase(role)) {
            if (centerId != null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (parentId != null && !parentId.equals(authUser.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (studentId != null) {
                if (!invoiceAccess.isParentOfStudent(authUser.getUserId(), studentId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
                return ResponseEntity.ok(filterByStatus(invoiceService.getInvoicesByStudent(studentId), status));
            }
            List<Invoice> invoices = invoiceService.getInvoicesForParent(authUser.getUserId());
            return ResponseEntity.ok(filterByStatus(invoices, status));
        }

        if (role != null && "STUDENT".equalsIgnoreCase(role)) {
            if (centerId != null || parentId != null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Optional<UUID> ownStudentId = invoiceAccess.findStudentIdForUser(authUser.getUserId());
            if (ownStudentId.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }
            if (studentId != null && !studentId.equals(ownStudentId.get())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            UUID sid = studentId != null ? studentId : ownStudentId.get();
            return ResponseEntity.ok(filterByStatus(invoiceService.getInvoicesByStudent(sid), status));
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    private static List<Invoice> filterByStatus(List<Invoice> invoices, String status) {
        if (status == null || status.isEmpty()) {
            return invoices;
        }
        String statusUpper = status.toUpperCase();
        return invoices.stream()
                .filter(i -> statusUpper.equalsIgnoreCase(i.getStatus()))
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoiceById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<Invoice> inv = invoiceService.getInvoiceById(id);
        if (inv.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!invoiceAccess.canViewInvoice(authUser, inv.get())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(inv.get());
    }

    @GetMapping("/number/{invoiceNumber}")
    public ResponseEntity<Invoice> getByInvoiceNumber(
            @PathVariable String invoiceNumber,
            @AuthenticationPrincipal AuthUser authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<Invoice> inv = invoiceService.getInvoiceByNumber(invoiceNumber);
        if (inv.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!invoiceAccess.canViewInvoice(authUser, inv.get())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(inv.get());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Invoice> createInvoice(@Valid @RequestBody Invoice invoice) {
        return ResponseEntity.status(HttpStatus.CREATED).body(invoiceService.createInvoice(invoice));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Invoice> updateInvoice(@PathVariable UUID id, @Valid @RequestBody Invoice invoice) {
        return invoiceService.updateInvoice(id, invoice)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Void> deleteInvoice(@PathVariable UUID id) {
        return invoiceService.deleteInvoice(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')")
    public ResponseEntity<Invoice> updateStatus(@PathVariable UUID id, @Valid @RequestBody Map<String, String> request) {
        return invoiceService.updateInvoiceStatus(id, request.get("status"))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
