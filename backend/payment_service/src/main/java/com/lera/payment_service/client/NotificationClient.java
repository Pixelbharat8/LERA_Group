package com.lera.payment_service.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Client to communicate with Connect Service for sending notifications
 */
@Service
@Slf4j
public class NotificationClient {

    private final RestTemplate restTemplate;

    @Value("${connect.service.url:http://localhost:8086}")
    private String connectServiceUrl;

    @Value("${lera.internal.api-key:}")
    private String internalApiKey;

    public NotificationClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    private HttpHeaders connectHeaders() {
        HttpHeaders headers = new HttpHeaders();
        if (StringUtils.hasText(internalApiKey)) {
            headers.set("X-Internal-Key", internalApiKey.trim());
        }
        return headers;
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders h = connectHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        return h;
    }

    private void postTriggerPath(String pathWithQuery) {
        String url = connectServiceUrl + pathWithQuery;
        restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(connectHeaders()), Object.class);
    }

    /**
     * Send payment received notification to parent
     */
    public void notifyPaymentReceived(UUID parentId, String studentName,
                                      Double amount, String currency, UUID paymentId) {
        try {
            String encName = UriUtils.encodeQueryParam(studentName != null ? studentName : "", StandardCharsets.UTF_8);
            String encCur = UriUtils.encodeQueryParam(currency != null ? currency : "VND", StandardCharsets.UTF_8);
            String url = "/api/notifications/trigger/payment-received"
                    + "?parentId=" + parentId
                    + "&studentName=" + encName
                    + "&amount=" + amount
                    + "&currency=" + encCur
                    + (paymentId != null ? "&paymentId=" + paymentId : "");
            postTriggerPath(url);
            log.info("Sent payment notification for student: {} amount: {} {}", studentName, amount, currency);
        } catch (Exception e) {
            log.error("Failed to send payment received notification", e);
        }
    }

    /**
     * Send payment due notification
     */
    public void notifyPaymentDue(UUID parentId, String studentName,
                                 Double amount, String currency, Integer daysOverdue) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "PAYMENT_DUE");
            request.put("userId", parentId);
            request.put("studentName", studentName);
            request.put("amount", amount);
            request.put("currency", currency != null ? currency : "VND");
            request.put("daysOverdue", daysOverdue);

            triggerNotification(request);
            log.info("Sent payment due notification for student: {}", studentName);
        } catch (Exception e) {
            log.error("Failed to send payment due notification", e);
        }
    }

    /**
     * Generic notification trigger
     */
    public void triggerNotification(Map<String, Object> notificationRequest) {
        try {
            String url = connectServiceUrl + "/api/notifications/trigger";
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(notificationRequest, jsonHeaders());
            restTemplate.postForEntity(url, request, Object.class);
            log.info("Triggered notification: {}", notificationRequest.get("notificationType"));
        } catch (Exception e) {
            log.error("Failed to trigger notification", e);
        }
    }

    /**
     * Notify about payment confirmation
     */
    public void notifyPaymentConfirmed(UUID userId, String description, Double amount, String currency, UUID paymentId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "PAYMENT_RECEIVED");
            request.put("userId", userId);
            request.put("studentName", description);
            request.put("amount", amount);
            request.put("currency", currency != null ? currency : "VND");
            if (paymentId != null) {
                request.put("referenceId", paymentId);
            }

            triggerNotification(request);
        } catch (Exception e) {
            log.error("Failed to send payment confirmation notification", e);
        }
    }
}
