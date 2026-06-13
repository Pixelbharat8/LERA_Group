package com.lera.identity_service.controller;

import com.lera.identity_service.entity.CustomFieldValue;
import com.lera.identity_service.service.CustomFieldValueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/custom-field-values")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class CustomFieldValueController {

    @Autowired
    private CustomFieldValueService customFieldValueService;

    // Get all custom field values for an entity
    @GetMapping("/entity/{entityId}")
    public ResponseEntity<List<CustomFieldValue>> getValuesByEntityId(@PathVariable String entityId) {
        return ResponseEntity.ok(customFieldValueService.getValuesByEntityId(entityId));
    }

    // Get custom field values for an entity filtered by entity type
    @GetMapping("/entity/{entityId}/type/{entityType}")
    public ResponseEntity<List<CustomFieldValue>> getValuesByEntityIdAndType(
            @PathVariable String entityId,
            @PathVariable String entityType) {
        return ResponseEntity.ok(customFieldValueService.getValuesByEntityIdAndType(entityId, entityType));
    }

    // Get custom field values as a map (fieldName -> value) for easy form population
    @GetMapping("/entity/{entityId}/type/{entityType}/map")
    public ResponseEntity<Map<String, String>> getValuesAsMap(
            @PathVariable String entityId,
            @PathVariable String entityType) {
        return ResponseEntity.ok(customFieldValueService.getValuesAsMap(entityId, entityType));
    }

    // Save a single custom field value
    @PostMapping
    public ResponseEntity<?> saveValue(@Valid @RequestBody SaveValueRequest request) {
        try {
            CustomFieldValue saved = customFieldValueService.saveValue(
                request.getCustomFieldId(),
                request.getEntityId(),
                request.getFieldValue()
            );
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "Invalid request");
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Save multiple custom field values at once
    @PostMapping("/bulk")
    public ResponseEntity<Map<String, String>> saveValues(@Valid @RequestBody SaveBulkValuesRequest request) {
        customFieldValueService.saveValues(
            request.getEntityId(),
            request.getEntityType(),
            request.getFieldValues()
        );
        Map<String, String> response = new HashMap<>();
        response.put("message", "Custom field values saved successfully");
        return ResponseEntity.ok(response);
    }

    // Deleting custom-field data is a staff action, not student/parent self-service.
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER','STAFF')")
    @DeleteMapping("/field/{customFieldId}/entity/{entityId}")
    public ResponseEntity<Map<String, String>> deleteValue(
            @PathVariable String customFieldId,
            @PathVariable String entityId) {
        customFieldValueService.deleteValue(customFieldId, entityId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Custom field value deleted successfully");
        return ResponseEntity.ok(response);
    }

    // Delete all custom field values for an entity
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','CENTER_ADMIN','ACADEMIC_MANAGER','TEACHER','STAFF')")
    @DeleteMapping("/entity/{entityId}")
    public ResponseEntity<Map<String, String>> deleteAllValuesForEntity(@PathVariable String entityId) {
        customFieldValueService.deleteAllValuesForEntity(entityId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "All custom field values deleted for entity");
        return ResponseEntity.ok(response);
    }

    // Inner class for save value request
    public static class SaveValueRequest {
        private String customFieldId;
        private String entityId;
        private String fieldValue;

        public String getCustomFieldId() { return customFieldId; }
        public void setCustomFieldId(String customFieldId) { this.customFieldId = customFieldId; }
        public String getEntityId() { return entityId; }
        public void setEntityId(String entityId) { this.entityId = entityId; }
        public String getFieldValue() { return fieldValue; }
        public void setFieldValue(String fieldValue) { this.fieldValue = fieldValue; }
    }

    // Inner class for bulk save request
    public static class SaveBulkValuesRequest {
        private String entityId;
        private String entityType;
        private Map<String, String> fieldValues;

        public String getEntityId() { return entityId; }
        public void setEntityId(String entityId) { this.entityId = entityId; }
        public String getEntityType() { return entityType; }
        public void setEntityType(String entityType) { this.entityType = entityType; }
        public Map<String, String> getFieldValues() { return fieldValues; }
        public void setFieldValues(Map<String, String> fieldValues) { this.fieldValues = fieldValues; }
    }
}
