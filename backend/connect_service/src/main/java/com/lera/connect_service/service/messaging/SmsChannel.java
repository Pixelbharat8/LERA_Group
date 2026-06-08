package com.lera.connect_service.service.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Generic SMS channel. Configure messaging.sms.api-key + endpoint for your provider
 * (eSMS, Twilio, …); otherwise SKIPPED. The POST body is a simple {to, message} — adapt
 * the field names to the provider if needed.
 */
@Slf4j
@Component
public class SmsChannel implements MessageChannel {

    @Value("${messaging.sms.api-key:}")
    private String apiKey;

    @Value("${messaging.sms.endpoint:}")
    private String endpoint;

    @Value("${messaging.sms.sender:LERA}")
    private String sender;

    private final RestTemplate rest = new RestTemplate();

    @Override public String name() { return "SMS"; }

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank() && endpoint != null && !endpoint.isBlank();
    }

    @Override
    public SendResult send(String toPhone, String body) {
        if (!isConfigured()) {
            log.info("[SMS SKIPPED] would send to {}: {}", toPhone, body);
            return SendResult.skipped("sms");
        }
        try {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            h.setBearerAuth(apiKey);
            Map<String, Object> payload = Map.of("to", toPhone, "from", sender, "message", body);
            rest.postForEntity(endpoint, new HttpEntity<>(payload, h), String.class);
            return SendResult.sent("sms");
        } catch (Exception e) {
            log.warn("[SMS FAILED] {}: {}", toPhone, e.getMessage());
            return SendResult.failed("sms", e.getMessage());
        }
    }
}
