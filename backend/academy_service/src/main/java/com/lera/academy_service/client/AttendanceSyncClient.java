package com.lera.academy_service.client;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceSyncClient {

    private final RestTemplate restTemplate;

    @Value("${attendance.service.url:http://localhost:8085}")
    private String attendanceServiceUrl;

    @Value("${lera.internal.api-key:}")
    private String internalApiKey;

    public void syncCompletedClassSession(Map<String, Object> payload) {
        if (internalApiKey == null || internalApiKey.isBlank()) {
            log.debug("Skipping class-session payroll sync — lera.internal.api-key not set");
            return;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Internal-Key", internalApiKey.trim());
            restTemplate.postForEntity(
                    attendanceServiceUrl + "/api/internal/class-session-sync",
                    new HttpEntity<>(payload, headers),
                    Map.class);
            log.info("Synced class session {} to attendance_service", payload.get("classSessionId"));
        } catch (Exception e) {
            log.warn("Failed to sync class session to attendance_service: {}", e.getMessage());
        }
    }

    public static Map<String, Object> buildPayload(
            UUID classSessionId,
            UUID classId,
            UUID teacherId,
            UUID centerId,
            Object sessionDate,
            Object startTime,
            Object endTime,
            List<Map<String, Object>> attendance) {
        Map<String, Object> body = new HashMap<>();
        body.put("classSessionId", classSessionId);
        body.put("classId", classId);
        body.put("teacherId", teacherId);
        body.put("centerId", centerId);
        body.put("sessionDate", sessionDate);
        body.put("startTime", startTime);
        body.put("endTime", endTime);
        body.put("attendance", attendance);
        return body;
    }
}
