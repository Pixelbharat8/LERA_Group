package com.lera.ai_gateway.service;

import com.lera.ai_gateway.security.AiGatewaySecurity;
import com.lera.ai_gateway.security.AuthUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AcademyStudentAccessClient {

    private final RestTemplate restTemplate;

    @Value("${lera.internal.api-key:}")
    private String internalApiKey;

    @Value("${lera.academy.base-url:http://localhost:8082}")
    private String academyBaseUrl;

    public void assertCanAccessStudentEntity(AuthUser user, UUID studentEntityId) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        if (studentEntityId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "studentId required");
        }
        if (AiGatewaySecurity.isAcademyStaff(user)) {
            return;
        }
        UUID authUserId = AiGatewaySecurity.requireUserId(user);
        if (internalApiKey == null || internalApiKey.isBlank()) {
            log.warn("Student entity access check skipped — lera.internal.api-key not set");
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Student access verification unavailable");
        }
        String url = academyBaseUrl.replaceAll("/$", "")
                + "/api/internal/students/" + studentEntityId + "/visible-to-user/" + authUserId;
        try {
            ResponseEntity<Void> response = restTemplate.exchange(
                    url, HttpMethod.GET, internalHeaders(), Void.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                return;
            }
        } catch (HttpStatusCodeException ex) {
            if (ex.getStatusCode() == HttpStatus.FORBIDDEN || ex.getStatusCode() == HttpStatus.NOT_FOUND) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access this student");
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Academy access check failed");
        } catch (RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Academy service unreachable");
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access this student");
    }

    private HttpEntity<Void> internalHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Key", internalApiKey.trim());
        return new HttpEntity<>(headers);
    }
}
