package com.lera.connect_service.service;

import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
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

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Resolves {@code students.id} access for Connect chat features via Academy internal APIs.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AcademyStudentAccessClient {

    private final RestTemplate restTemplate;

    @Value("${lera.internal.api-key:}")
    private String internalApiKey;

    @Value("${lera.academy.base-url:http://localhost:8082}")
    private String academyBaseUrl;

    /**
     * Staff may access any student entity; students/parents must be linked in Academy.
     */
    public void assertCanAccessStudentEntity(AuthUser user, UUID studentEntityId) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        if (studentEntityId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "studentId required");
        }
        if (ConnectSecurity.isAcademyStaff(user)) {
            return;
        }
        UUID authUserId = ConnectSecurity.requireUserId(user);
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
            log.warn("Academy student access check failed: {} {}", ex.getStatusCode(), ex.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Academy access check failed");
        } catch (RestClientException ex) {
            log.warn("Academy unreachable for student access check: {}", ex.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Academy service unreachable");
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access this student");
    }

    /** Auth user → academy {@code students.id}, when the caller is the student. */
    public Optional<UUID> findStudentEntityIdForAuthUser(UUID authUserId) {
        if (authUserId == null || internalApiKey == null || internalApiKey.isBlank()) {
            return Optional.empty();
        }
        String url = academyBaseUrl.replaceAll("/$", "") + "/api/internal/students/by-user/" + authUserId;
        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, internalHeaders(), Map.class);
            Map<?, ?> body = response.getBody();
            if (body != null && body.get("id") != null) {
                return Optional.of(UUID.fromString(body.get("id").toString()));
            }
        } catch (HttpStatusCodeException ex) {
            if (ex.getStatusCode() != HttpStatus.NOT_FOUND) {
                log.debug("Academy by-user lookup: {} {}", ex.getStatusCode(), ex.getMessage());
            }
        } catch (RestClientException ex) {
            log.debug("Academy by-user lookup failed: {}", ex.getMessage());
        }
        return Optional.empty();
    }

    private HttpEntity<Void> internalHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Key", internalApiKey.trim());
        return new HttpEntity<>(headers);
    }
}
