package com.lera.payment_service.controller;

import com.lera.payment_service.entity.EnrolmentOrder;
import com.lera.payment_service.repository.EnrolmentOrderRepository;
import com.lera.payment_service.service.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Public, unauthenticated payment endpoints for the website enrolment funnel.
 *
 * When VNPay is configured this creates a pending order and returns a real VNPay payment URL;
 * when it isn't, it reports {enabled:false} so the website falls back to the "reserve a place,
 * pay later" flow. No money can move until a VNPay merchant account is wired in via env.
 */
@RestController
@RequestMapping("/api/public/payment")
@RequiredArgsConstructor
@Slf4j
public class PublicPaymentController {

    private final VnPayService vnPayService;
    private final EnrolmentOrderRepository orderRepository;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    /** Is online payment available right now? Lets the website show/hide the "Pay online" option. */
    @GetMapping("/status")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of("enabled", vnPayService.isEnabled(), "provider", "vnpay"));
    }

    /**
     * Create a pending enrolment order. If VNPay is enabled, also return a signed payment URL the
     * browser should redirect to. Body: courseCode, amount (đồng), studentName, parentName, phone,
     * email, locale.
     */
    @PostMapping("/enrolment")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Map<String, Object>> createEnrolmentPayment(
            @RequestBody Map<String, Object> body, HttpServletRequest request) {
        long amount = parseAmount(body.get("amount"));
        if (amount <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "A positive amount is required"));
        }
        String txnRef = "LERA" + System.currentTimeMillis() + String.format("%04d", new Random().nextInt(10000));

        EnrolmentOrder order = EnrolmentOrder.builder()
                .txnRef(txnRef)
                .courseCode(str(body.get("courseCode")))
                .amount(BigDecimal.valueOf(amount))
                .studentName(str(body.get("studentName")))
                .parentName(str(body.get("parentName")))
                .phone(str(body.get("phone")))
                .email(str(body.get("email")))
                .status("PENDING")
                .build();
        orderRepository.save(order);

        if (!vnPayService.isEnabled()) {
            // Honest: nothing to pay against yet — the website keeps the "reserve, pay later" flow.
            return ResponseEntity.ok(Map.of("enabled", false, "txnRef", txnRef));
        }

        String orderInfo = "LERA enrolment " + (order.getCourseCode() != null ? order.getCourseCode() : "") + " " + txnRef;
        String paymentUrl = vnPayService.buildPaymentUrl(txnRef, amount, orderInfo.trim(),
                str(body.get("locale")), clientIp(request));
        return ResponseEntity.ok(Map.of("enabled", true, "txnRef", txnRef, "paymentUrl", paymentUrl));
    }

    /**
     * VNPay return URL — the browser is redirected here after payment. Verify the signature, update
     * the order, then redirect the user to the website result page. Never trust the status without a
     * valid signature.
     */
    @GetMapping("/vnpay-return")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Void> vnpayReturn(@RequestParam Map<String, String> params) {
        String result = "failed";
        String txnRef = params.get("vnp_TxnRef");
        boolean valid = vnPayService.verifyReturn(params);

        if (valid && txnRef != null) {
            EnrolmentOrder order = orderRepository.findByTxnRef(txnRef).orElse(null);
            if (order != null && !"PAID".equals(order.getStatus())) {
                order.setVnpResponseCode(params.get("vnp_ResponseCode"));
                order.setVnpTransactionNo(params.get("vnp_TransactionNo"));
                if (vnPayService.isSuccess(params)) {
                    order.setStatus("PAID");
                    order.setPaidAt(LocalDateTime.now());
                    result = "success";
                } else {
                    order.setStatus("FAILED");
                }
                orderRepository.save(order);
            } else if (order != null && "PAID".equals(order.getStatus())) {
                result = "success";
            }
        } else {
            log.warn("VNPay return with invalid signature for txnRef={}", txnRef);
            result = "invalid";
        }

        URI redirect = URI.create(frontendUrl + "/enroll/result?status=" + result
                + (txnRef != null ? "&ref=" + txnRef : ""));
        return ResponseEntity.status(HttpStatus.FOUND).location(redirect).build();
    }

    // ---- helpers ----
    private static String str(Object o) { return o == null ? null : String.valueOf(o); }

    private static long parseAmount(Object o) {
        if (o == null) return 0;
        try {
            return (long) Double.parseDouble(String.valueOf(o));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private static String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
