package com.lera.attendance_service.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

/**
 * Resolves student ownership via academy_service (which holds the parent↔student link), so the
 * attendance service can stop a STUDENT/PARENT from reading another student's attendance.
 * Fails closed: any error → denied. The internal key (LERA_INTERNAL_API_KEY) is required.
 */
@Service
@Slf4j
public class StudentAccessClient {

    private final RestTemplate restTemplate;

    @Value("${academy.service.url:http://localhost:8082}")
    private String academyUrl;

    @Value("${lera.internal.api-key:}")
    private String internalApiKey;

    public StudentAccessClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /** True iff {@code userId} may view {@code studentId} (their own student record or a linked child). */
    public boolean canUserViewStudent(UUID studentId, UUID userId) {
        if (studentId == null || userId == null) return false;
        try {
            HttpHeaders headers = new HttpHeaders();
            if (StringUtils.hasText(internalApiKey)) {
                headers.set("X-Internal-Key", internalApiKey.trim());
            }
            String url = academyUrl + "/api/internal/students/" + studentId + "/visible-to-user/" + userId;
            ResponseEntity<Void> resp = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), Void.class);
            return resp.getStatusCode().is2xxSuccessful(); // 204 = allowed
        } catch (Exception e) {
            // 403/401/404/network → fail closed (deny).
            log.debug("Student-access check denied for student {} / user {}: {}", studentId, userId, e.getMessage());
            return false;
        }
    }
}
