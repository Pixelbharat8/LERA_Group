package com.lera.academy.service;

import com.lera.academy.entity.UserActivity;
import com.lera.academy.repository.UserActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLoggingService {
    
    private final UserActivityRepository userActivityRepository;
    
    /**
     * Log user activity asynchronously
     */
    @Async
    public void logActivity(UUID userId, String activityType, String title, String description) {
        logActivity(userId, activityType, null, null, title, description, null);
    }
    
    /**
     * Log user activity with entity reference
     */
    @Async
    public void logActivity(UUID userId, String activityType, String entityType, UUID entityId, 
                           String title, String description, Map<String, Object> metadata) {
        try {
            UserActivity activity = UserActivity.builder()
                .userId(userId)
                .activityType(activityType)
                .entityType(entityType)
                .entityId(entityId)
                .title(title)
                .description(description)
                .metadata(metadata)
                .build();
            
            userActivityRepository.save(activity);
            log.debug("Logged activity for user {}: {}", userId, activityType);
        } catch (Exception e) {
            log.error("Failed to log activity for user {}: {}", userId, e.getMessage());
        }
    }
    
    // Activity type constants
    public static final String ACTIVITY_ENROLLMENT = "ENROLLMENT";
    public static final String ACTIVITY_PAYMENT = "PAYMENT";
    public static final String ACTIVITY_ATTENDANCE = "ATTENDANCE";
    public static final String ACTIVITY_CLASS_SWITCH = "CLASS_SWITCH";
    public static final String ACTIVITY_DOCUMENT = "DOCUMENT";
    public static final String ACTIVITY_LOGIN = "LOGIN";
    public static final String ACTIVITY_PROFILE_UPDATE = "PROFILE_UPDATE";
    public static final String ACTIVITY_GRADE = "GRADE";
    public static final String ACTIVITY_REFERRAL = "REFERRAL";
    
    // Entity type constants
    public static final String ENTITY_STUDENT = "STUDENT";
    public static final String ENTITY_TEACHER = "TEACHER";
    public static final String ENTITY_CLASS = "CLASS";
    public static final String ENTITY_PAYMENT = "PAYMENT";
    public static final String ENTITY_ENROLLMENT = "ENROLLMENT";
    public static final String ENTITY_DOCUMENT = "DOCUMENT";
    
    /**
     * Log student enrollment
     */
    public void logEnrollment(UUID studentId, UUID classId, String className) {
        logActivity(
            studentId,
            ACTIVITY_ENROLLMENT,
            ENTITY_CLASS,
            classId,
            "Enrolled in Class",
            "Enrolled in " + className,
            Map.of("className", className, "classId", classId.toString())
        );
    }
    
    /**
     * Log class switch
     */
    public void logClassSwitch(UUID studentId, UUID oldClassId, String oldClassName, 
                               UUID newClassId, String newClassName, String reason) {
        logActivity(
            studentId,
            ACTIVITY_CLASS_SWITCH,
            ENTITY_CLASS,
            newClassId,
            "Changed Class",
            "Switched from " + (oldClassName != null ? oldClassName : "N/A") + " to " + newClassName,
            Map.of(
                "oldClassId", oldClassId != null ? oldClassId.toString() : "",
                "oldClassName", oldClassName != null ? oldClassName : "",
                "newClassId", newClassId.toString(),
                "newClassName", newClassName,
                "reason", reason != null ? reason : ""
            )
        );
    }
    
    /**
     * Log payment made
     */
    public void logPayment(UUID userId, UUID paymentId, double amount, String paymentType) {
        logActivity(
            userId,
            ACTIVITY_PAYMENT,
            ENTITY_PAYMENT,
            paymentId,
            "Payment Made",
            String.format("Paid $%.2f for %s", amount, paymentType),
            Map.of("amount", amount, "paymentType", paymentType)
        );
    }
    
    /**
     * Log attendance
     */
    public void logAttendance(UUID userId, String status, String date) {
        logActivity(
            userId,
            ACTIVITY_ATTENDANCE,
            null,
            null,
            "Attendance Marked",
            "Marked " + status + " for " + date,
            Map.of("status", status, "date", date)
        );
    }
    
    /**
     * Log document upload
     */
    public void logDocumentUpload(UUID userId, UUID documentId, String documentName) {
        logActivity(
            userId,
            ACTIVITY_DOCUMENT,
            ENTITY_DOCUMENT,
            documentId,
            "Document Uploaded",
            "Uploaded " + documentName,
            Map.of("documentName", documentName)
        );
    }
    
    /**
     * Log profile update
     */
    public void logProfileUpdate(UUID userId, String fieldsUpdated) {
        logActivity(
            userId,
            ACTIVITY_PROFILE_UPDATE,
            null,
            null,
            "Profile Updated",
            "Updated profile: " + fieldsUpdated,
            Map.of("fieldsUpdated", fieldsUpdated)
        );
    }
}
