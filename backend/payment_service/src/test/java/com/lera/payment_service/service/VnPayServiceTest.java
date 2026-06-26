package com.lera.payment_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Locks in the VNPay signing/verification behavior. The expected signature is recomputed here
 * independently of the service, so a future change that breaks the HMAC-SHA512 scheme fails CI.
 */
class VnPayServiceTest {

    private static final String SECRET = "TESTSECRETKEY1234567890";
    private VnPayService service;

    @BeforeEach
    void setUp() {
        service = new VnPayService();
        ReflectionTestUtils.setField(service, "tmnCode", "TESTTMN01");
        ReflectionTestUtils.setField(service, "hashSecret", SECRET);
        ReflectionTestUtils.setField(service, "payUrl", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
        ReflectionTestUtils.setField(service, "returnUrl", "http://localhost:8083/api/public/payment/vnpay-return");
        ReflectionTestUtils.setField(service, "version", "2.1.0");
    }

    @Test
    void isEnabled_falseWhenUnconfigured() {
        VnPayService blank = new VnPayService();
        ReflectionTestUtils.setField(blank, "tmnCode", "");
        ReflectionTestUtils.setField(blank, "hashSecret", "");
        assertFalse(blank.isEnabled());
    }

    @Test
    void isEnabled_trueWhenConfigured() {
        assertTrue(service.isEnabled());
    }

    @Test
    void buildPaymentUrl_throwsWhenDisabled() {
        VnPayService blank = new VnPayService();
        ReflectionTestUtils.setField(blank, "tmnCode", "");
        ReflectionTestUtils.setField(blank, "hashSecret", "");
        assertThrows(IllegalStateException.class,
                () -> blank.buildPaymentUrl("REF1", 3_000_000L, "info", "vn", "127.0.0.1"));
    }

    @Test
    void buildPaymentUrl_signatureMatchesAndAmountIsScaled() {
        String url = service.buildPaymentUrl("REF123", 3_000_000L, "LERA enrolment PRIMARY", "en", "1.2.3.4");
        assertTrue(url.contains("vnp_SecureHash="), "URL must carry a signature");

        String query = url.substring(url.indexOf('?') + 1);
        int sigIdx = query.lastIndexOf("&vnp_SecureHash=");
        String hashData = query.substring(0, sigIdx);
        String sig = query.substring(sigIdx + "&vnp_SecureHash=".length());

        // VNPay expects amount ×100, sorted params, our terminal code present.
        assertTrue(hashData.contains("vnp_Amount=300000000"), "amount must be ×100");
        assertTrue(hashData.contains("vnp_TmnCode=TESTTMN01"));

        // Independently recompute the signature over the URL's hashData and compare.
        assertEquals(hmacSha512(SECRET, hashData), sig.toLowerCase());
    }

    @Test
    void verifyReturn_acceptsValidSignature() {
        Map<String, String> params = signedReturn("00", "00");
        assertTrue(service.verifyReturn(params));
        assertTrue(service.isSuccess(params));
    }

    @Test
    void verifyReturn_rejectsTamperedValue() {
        Map<String, String> params = signedReturn("00", "00");
        params.put("vnp_Amount", "999999999"); // tamper after signing
        assertFalse(service.verifyReturn(params));
    }

    @Test
    void verifyReturn_rejectsTamperedSignature() {
        Map<String, String> params = signedReturn("00", "00");
        params.put("vnp_SecureHash", params.get("vnp_SecureHash") + "deadbeef");
        assertFalse(service.verifyReturn(params));
    }

    @Test
    void isSuccess_falseForNonZeroCodes() {
        Map<String, String> failed = signedReturn("24", "02");
        assertFalse(service.isSuccess(failed));
    }

    // ---- helpers: build a return param map signed exactly like VNPay would ----

    private Map<String, String> signedReturn(String responseCode, String transactionStatus) {
        Map<String, String> p = new TreeMap<>();
        p.put("vnp_Amount", "300000000");
        p.put("vnp_BankCode", "NCB");
        p.put("vnp_ResponseCode", responseCode);
        p.put("vnp_TmnCode", "TESTTMN01");
        p.put("vnp_TransactionNo", "14000001");
        p.put("vnp_TransactionStatus", transactionStatus);
        p.put("vnp_TxnRef", "REF123");
        p.put("vnp_OrderInfo", "LERA test");
        StringBuilder sb = new StringBuilder();
        for (Iterator<Map.Entry<String, String>> it = p.entrySet().iterator(); it.hasNext(); ) {
            Map.Entry<String, String> e = it.next();
            sb.append(enc(e.getKey())).append('=').append(enc(e.getValue()));
            if (it.hasNext()) sb.append('&');
        }
        p.put("vnp_SecureHash", hmacSha512(SECRET, sb.toString()));
        return p;
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
            throw new RuntimeException(e);
        }
    }
}
