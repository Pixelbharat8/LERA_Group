package com.lera.attendance_service.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
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

    /** Same property name as connect_service — required in production when JWT is not used. */
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
        HttpHeaders headers = connectHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private void postTriggerSubpath(String url) {
        restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(connectHeaders()), Object.class);
    }

    /**
     * Send leave application notification to managers
     */
    public void notifyLeaveApplication(UUID employeeId, String employeeName,
                                       String leaveType, String startDate, String endDate, UUID leaveId) {
        try {
            String url = connectServiceUrl + "/api/notifications/trigger/leave-application" +
                    "?employeeId=" + employeeId +
                    "&employeeName=" + employeeName +
                    "&leaveType=" + leaveType +
                    "&startDate=" + startDate +
                    "&endDate=" + endDate +
                    (leaveId != null ? "&leaveId=" + leaveId : "");

            postTriggerSubpath(url);
            log.info("Sent leave application notification for employee: {}", employeeName);
        } catch (Exception e) {
            log.error("Failed to send leave application notification", e);
            // Don't throw - notification failure shouldn't fail the leave application
        }
    }

    /**
     * Send leave approval notification to employee
     */
    public void notifyLeaveApproved(UUID employeeId, String leaveType,
                                    String startDate, String endDate, String approverName) {
        try {
            String url = connectServiceUrl + "/api/notifications/trigger/leave-approved" +
                    "?employeeId=" + employeeId +
                    "&leaveType=" + leaveType +
                    "&startDate=" + startDate +
                    "&endDate=" + endDate +
                    "&approverName=" + approverName;

            postTriggerSubpath(url);
            log.info("Sent leave approval notification to employee: {}", employeeId);
        } catch (Exception e) {
            log.error("Failed to send leave approval notification", e);
        }
    }

    /**
     * Send leave rejection notification to employee
     */
    public void notifyLeaveRejected(UUID employeeId, String leaveType,
                                    String startDate, String endDate,
                                    String approverName, String reason) {
        try {
            String url = connectServiceUrl + "/api/notifications/trigger/leave-rejected" +
                    "?employeeId=" + employeeId +
                    "&leaveType=" + leaveType +
                    "&startDate=" + startDate +
                    "&endDate=" + endDate +
                    "&approverName=" + approverName +
                    (reason != null ? "&reason=" + reason : "");

            postTriggerSubpath(url);
            log.info("Sent leave rejection notification to employee: {}", employeeId);
        } catch (Exception e) {
            log.error("Failed to send leave rejection notification", e);
        }
    }

    /**
     * Generic notification trigger using the /trigger endpoint
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
     * In-app reminder for a single parent (e.g. class tomorrow).
     */
    public void notifyUserDigest(
            UUID userId,
            String title,
            String titleVi,
            String message,
            String messageVi,
            String referenceType) {
        Map<String, Object> req = new HashMap<>();
        req.put("userIds", List.of(userId));
        req.put("title", title);
        req.put("titleVi", titleVi);
        req.put("message", message);
        req.put("messageVi", messageVi);
        req.put("type", "info");
        req.put("referenceType", referenceType != null ? referenceType : "schedule");
        triggerNotification(req);
    }

    /**
     * Send low attendance notification
     */
    public void notifyLowAttendance(UUID parentId, String studentName,
                                    double attendancePercentage, String className) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("notificationType", "ATTENDANCE_LOW");
            request.put("userId", parentId);
            request.put("studentName", studentName);
            request.put("attendancePercentage", attendancePercentage);
            request.put("className", className);

            triggerNotification(request);
            log.info("Sent low attendance notification for student: {}", studentName);
        } catch (Exception e) {
            log.error("Failed to send low attendance notification", e);
        }
    }
}
