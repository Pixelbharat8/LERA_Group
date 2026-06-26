package com.lera.payment_service.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * VNPay (vnpayment.vn) payment-URL builder and return-signature verifier.
 *
 * Provider-gated: does nothing until VNPAY_TMN_CODE + VNPAY_HASH_SECRET are set (mirrors how
 * the AI gateway / mail / Facebook integrations stay dormant until configured). No real money
 * can move until a merchant account is wired in, so this is safe to ship disabled.
 *
 * Signature: HMAC-SHA512 over the URL-encoded, field-name-sorted query string, per the
 * official VNPay spec (https://sandbox.vnpayment.vn).
 */
@Service
public class VnPayService {

    @Value("${vnpay.tmn-code:}")
    private String tmnCode;

    @Value("${vnpay.hash-secret:}")
    private String hashSecret;

    @Value("${vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String payUrl;

    @Value("${vnpay.return-url:http://localhost:8083/api/public/payment/vnpay-return}")
    private String returnUrl;

    @Value("${vnpay.version:2.1.0}")
    private String version;

    /** Configured only when both a terminal code and a hash secret are present. */
    public boolean isEnabled() {
        return tmnCode != null && !tmnCode.isBlank()
                && hashSecret != null && !hashSecret.isBlank();
    }

    /**
     * Build a signed VNPay payment URL for {@code amountVnd} (whole đồng).
     * @param txnRef unique merchant transaction reference
     * @param orderInfo human-readable order description
     * @param locale "vn" or "en"
     * @param clientIp payer IP (for VNPay risk checks)
     */
    public String buildPaymentUrl(String txnRef, long amountVnd, String orderInfo, String locale, String clientIp) {
        if (!isEnabled()) {
            throw new IllegalStateException("VNPay is not configured");
        }
        Map<String, String> params = new TreeMap<>(); // sorted by field name
        params.put("vnp_Version", version);
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", String.valueOf(amountVnd * 100L)); // VNPay expects amount ×100
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", orderInfo);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", (locale != null && locale.equalsIgnoreCase("en")) ? "en" : "vn");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", clientIp != null && !clientIp.isBlank() ? clientIp : "127.0.0.1");
        params.put("vnp_CreateDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));

        String hashData = buildEncodedQuery(params);
        String secureHash = hmacSha512(hashSecret, hashData);
        return payUrl + "?" + hashData + "&vnp_SecureHash=" + secureHash;
    }

    /**
     * Verify a VNPay return/IPN: recompute the signature over every {@code vnp_*} param except the
     * hash fields and compare. Returns true only when the signature matches.
     */
    public boolean verifyReturn(Map<String, String> allParams) {
        if (!isEnabled() || allParams == null) return false;
        String received = allParams.get("vnp_SecureHash");
        if (received == null || received.isBlank()) return false;

        Map<String, String> signed = new TreeMap<>();
        for (Map.Entry<String, String> e : allParams.entrySet()) {
            String k = e.getKey();
            if (k == null || !k.startsWith("vnp_")) continue;
            if (k.equals("vnp_SecureHash") || k.equals("vnp_SecureHashType")) continue;
            if (e.getValue() != null && !e.getValue().isEmpty()) signed.put(k, e.getValue());
        }
        String hashData = buildEncodedQuery(signed);
        String expected = hmacSha512(hashSecret, hashData);
        return expected.equalsIgnoreCase(received);
    }

    /** "01"/"00" success per VNPay (vnp_ResponseCode AND vnp_TransactionStatus == "00"). */
    public boolean isSuccess(Map<String, String> p) {
        return "00".equals(p.get("vnp_ResponseCode")) && "00".equals(p.get("vnp_TransactionStatus"));
    }

    // ---- helpers ----

    /** field=value joined by & in sorted order, both URL-encoded (US-ASCII), per VNPay spec. */
    private String buildEncodedQuery(Map<String, String> sortedParams) {
        StringBuilder sb = new StringBuilder();
        for (Iterator<Map.Entry<String, String>> it = sortedParams.entrySet().iterator(); it.hasNext(); ) {
            Map.Entry<String, String> e = it.next();
            sb.append(enc(e.getKey())).append('=').append(enc(e.getValue()));
            if (it.hasNext()) sb.append('&');
        }
        return sb.toString();
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.US_ASCII).replace("+", "%20");
    }

    private static String hmacSha512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(2 * bytes.length);
            for (byte b : bytes) hex.append(Character.forDigit((b >> 4) & 0xF, 16)).append(Character.forDigit(b & 0xF, 16));
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to sign VNPay request", e);
        }
    }
}
