package com.lera.connect_service.service.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * WhatsApp channel via the Meta WhatsApp Cloud API. Business-initiated messages (onboarding) must use
 * an APPROVED message template — free text isn't allowed outside the 24h service window — so the body
 * is passed as the template's single body parameter ({{1}}), same shape as Zalo ZNS.
 *
 * Configure messaging.whatsapp.token + phone-number-id + template-name to enable; otherwise SKIPPED.
 */
@Slf4j
@Component
public class WhatsAppChannel implements MessageChannel {

    @Value("${messaging.whatsapp.token:}")
    private String token;

    @Value("${messaging.whatsapp.phone-number-id:}")
    private String phoneNumberId;

    @Value("${messaging.whatsapp.template-name:}")
    private String templateName;

    @Value("${messaging.whatsapp.lang:vi}")
    private String lang;

    @Value("${messaging.whatsapp.api-version:v20.0}")
    private String apiVersion;

    private final RestTemplate rest = new RestTemplate();

    @Override public String name() { return "WHATSAPP"; }

    @Override
    public boolean isConfigured() {
        return allPresent(token, phoneNumberId, templateName);
    }

    @Override
    public SendResult send(String toPhone, String body) {
        if (!isConfigured()) {
            log.info("[WhatsApp SKIPPED] would send to {}: {}", toPhone, body);
            return SendResult.skipped("whatsapp-cloud");
        }
        try {
            String url = "https://graph.facebook.com/" + apiVersion + "/" + phoneNumberId + "/messages";
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            h.setBearerAuth(token);
            Map<String, Object> payload = Map.of(
                    "messaging_product", "whatsapp",
                    "to", toPhone,
                    "type", "template",
                    "template", Map.of(
                            "name", templateName,
                            "language", Map.of("code", lang),
                            "components", List.of(Map.of(
                                    "type", "body",
                                    "parameters", List.of(Map.of("type", "text", "text", body))
                            ))
                    )
            );
            rest.postForEntity(url, new HttpEntity<>(payload, h), String.class);
            return SendResult.sent("whatsapp-cloud");
        } catch (Exception e) {
            log.warn("[WhatsApp FAILED] {}: {}", toPhone, e.getMessage());
            return SendResult.failed("whatsapp-cloud", e.getMessage());
        }
    }

    private static boolean allPresent(String... vals) {
        for (String v : vals) {
            if (v == null || v.isBlank()) return false;
        }
        return true;
    }
}
