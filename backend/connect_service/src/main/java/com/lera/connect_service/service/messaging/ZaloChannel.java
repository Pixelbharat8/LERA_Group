package com.lera.connect_service.service.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Zalo channel. Real sending to Vietnamese parents is via Zalo ZNS (phone + template).
 * Configure messaging.zalo.access-token (+ endpoint + template) to enable; otherwise SKIPPED.
 */
@Slf4j
@Component
public class ZaloChannel implements MessageChannel {

    @Value("${messaging.zalo.access-token:}")
    private String accessToken;

    @Value("${messaging.zalo.endpoint:https://business.openapi.zalo.me/message/template}")
    private String endpoint;

    @Value("${messaging.zalo.template-id:}")
    private String templateId;

    private final RestTemplate rest = new RestTemplate();

    @Override public String name() { return "ZALO"; }

    @Override
    public boolean isConfigured() {
        return accessToken != null && !accessToken.isBlank() && templateId != null && !templateId.isBlank();
    }

    @Override
    public SendResult send(String toPhone, String body) {
        if (!isConfigured()) {
            log.info("[Zalo SKIPPED] would send to {}: {}", toPhone, body);
            return SendResult.skipped("zalo-zns");
        }
        try {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            h.set("access_token", accessToken);
            // ZNS template payload — adjust template_data keys to your approved template.
            Map<String, Object> payload = Map.of(
                    "phone", toPhone,
                    "template_id", templateId,
                    "template_data", Map.of("message", body)
            );
            rest.postForEntity(endpoint, new HttpEntity<>(payload, h), String.class);
            return SendResult.sent("zalo-zns");
        } catch (Exception e) {
            log.warn("[Zalo FAILED] {}: {}", toPhone, e.getMessage());
            return SendResult.failed("zalo-zns", e.getMessage());
        }
    }
}
