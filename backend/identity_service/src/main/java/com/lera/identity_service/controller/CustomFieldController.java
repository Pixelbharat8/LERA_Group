package com.lera.identity_service.controller;

import com.lera.identity_service.entity.CustomField;
import com.lera.identity_service.service.CustomFieldService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/custom-fields")
public class CustomFieldController {

    @Autowired
    private CustomFieldService customFieldService;

    // Get all custom fields
    @GetMapping
    public ResponseEntity<List<CustomField>> getAllFields() {
        return ResponseEntity.ok(customFieldService.getAllFields());
    }

    // Get custom fields by entity type
    @GetMapping("/entity/{entityType}")
    public ResponseEntity<List<CustomField>> getFieldsByEntityType(
            @PathVariable String entityType,
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        List<CustomField> fields;
        if (activeOnly) {
            fields = customFieldService.getActiveFieldsByEntityType(entityType);
        } else {
            fields = customFieldService.getFieldsByEntityType(entityType);
        }
        return ResponseEntity.ok(fields);
    }

    // Get custom fields for table display
    @GetMapping("/entity/{entityType}/table")
    public ResponseEntity<List<CustomField>> getTableFields(@PathVariable String entityType) {
        return ResponseEntity.ok(customFieldService.getTableFieldsByEntityType(entityType));
    }

    // Get custom fields for form display
    @GetMapping("/entity/{entityType}/form")
    public ResponseEntity<List<CustomField>> getFormFields(@PathVariable String entityType) {
        return ResponseEntity.ok(customFieldService.getFormFieldsByEntityType(entityType));
    }

    // Get custom fields by entity type and center
    @GetMapping("/entity/{entityType}/center/{centerId}")
    public ResponseEntity<List<CustomField>> getFieldsByEntityTypeAndCenter(
            @PathVariable String entityType,
            @PathVariable String centerId) {
        return ResponseEntity.ok(customFieldService.getFieldsByEntityTypeAndCenter(entityType, centerId));
    }

    // Get a single custom field by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getFieldById(@PathVariable String id) {
        return customFieldService.getFieldById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Create a new custom field
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<?> createField(@Valid @RequestBody CustomField field) {
        try {
            CustomField created = customFieldService.createField(field);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "Invalid request");
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Update an existing custom field
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<?> updateField(@PathVariable String id, @Valid @RequestBody CustomField field) {
        try {
            CustomField updated = customFieldService.updateField(id, field);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "Invalid request");
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Toggle field active status
    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<?> toggleFieldActive(@PathVariable String id) {
        try {
            CustomField toggled = customFieldService.toggleFieldActive(id);
            return ResponseEntity.ok(toggled);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "Invalid request");
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Delete a custom field
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<?> deleteField(@PathVariable String id) {
        try {
            customFieldService.deleteField(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Custom field deleted successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage() != null && !e.getMessage().isBlank() ? e.getMessage() : "Invalid request");
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Get all entity types that have custom fields
    @GetMapping("/entity-types")
    public ResponseEntity<List<String>> getAllEntityTypes() {
        return ResponseEntity.ok(customFieldService.getAllEntityTypes());
    }

    // Get count of custom fields for an entity type
    @GetMapping("/entity/{entityType}/count")
    public ResponseEntity<Map<String, Long>> getFieldCount(@PathVariable String entityType) {
        Map<String, Long> response = new HashMap<>();
        response.put("count", customFieldService.countFieldsByEntityType(entityType));
        return ResponseEntity.ok(response);
    }

    // Reorder custom fields
    @PostMapping("/entity/{entityType}/reorder")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<Map<String, String>> reorderFields(
            @PathVariable String entityType,
            @Valid @RequestBody List<String> fieldIds) {
        customFieldService.reorderFields(entityType, fieldIds);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Fields reordered successfully");
        return ResponseEntity.ok(response);
    }
}
