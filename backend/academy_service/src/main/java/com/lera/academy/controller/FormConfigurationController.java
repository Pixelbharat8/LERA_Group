package com.lera.academy.controller;

import com.lera.academy.entity.FormConfiguration;
import com.lera.academy.repository.FormConfigurationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.*;

@RestController
@RequestMapping("/api/form-configs")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class FormConfigurationController {
    
    private final FormConfigurationRepository formConfigurationRepository;
    
    // Get all form configurations
    @GetMapping
    public ResponseEntity<List<FormConfiguration>> getAllFormConfigs() {
        return ResponseEntity.ok(formConfigurationRepository.findByIsActiveTrue());
    }
    
    // Get form configuration by form name
    @GetMapping("/{formName}")
    public ResponseEntity<FormConfiguration> getFormConfigByName(@PathVariable String formName) {
        return formConfigurationRepository.findByFormName(formName)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    // Get form configurations by entity type
    @GetMapping("/entity/{entityType}")
    public ResponseEntity<List<FormConfiguration>> getFormConfigsByEntityType(@PathVariable String entityType) {
        return ResponseEntity.ok(formConfigurationRepository.findByEntityTypeAndIsActiveTrue(entityType));
    }
    
    // Create new form configuration
    @PostMapping
    public ResponseEntity<?> createFormConfig(@Valid @RequestBody FormConfiguration formConfig) {
        if (formConfigurationRepository.existsByFormName(formConfig.getFormName())) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Form configuration with name '" + formConfig.getFormName() + "' already exists"));
        }
        FormConfiguration saved = formConfigurationRepository.save(formConfig);
        log.info("Created form configuration: {}", formConfig.getFormName());
        return ResponseEntity.ok(saved);
    }
    
    // Update form configuration
    @PutMapping("/{id}")
    public ResponseEntity<FormConfiguration> updateFormConfig(@PathVariable UUID id, @Valid @RequestBody FormConfiguration formConfig) {
        return formConfigurationRepository.findById(id)
            .map(existing -> {
                existing.setFormName(formConfig.getFormName());
                existing.setEntityType(formConfig.getEntityType());
                existing.setDescription(formConfig.getDescription());
                existing.setFields(formConfig.getFields());
                existing.setIsActive(formConfig.getIsActive());
                FormConfiguration updated = formConfigurationRepository.save(existing);
                log.info("Updated form configuration: {}", updated.getFormName());
                return ResponseEntity.ok(updated);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    // Add a field to form configuration
    @PostMapping("/{id}/fields")
    public ResponseEntity<FormConfiguration> addField(@PathVariable UUID id, @Valid @RequestBody Map<String, Object> newField) {
        return formConfigurationRepository.findById(id)
            .map(formConfig -> {
                List<Map<String, Object>> fields = formConfig.getFields();
                if (fields == null) {
                    fields = new ArrayList<>();
                }
                // Set order if not provided
                if (!newField.containsKey("order")) {
                    newField.put("order", fields.size() + 1);
                }
                fields.add(newField);
                formConfig.setFields(fields);
                FormConfiguration updated = formConfigurationRepository.save(formConfig);
                log.info("Added field '{}' to form '{}'", newField.get("name"), formConfig.getFormName());
                return ResponseEntity.ok(updated);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    // Update a field in form configuration
    @PutMapping("/{id}/fields/{fieldName}")
    public ResponseEntity<FormConfiguration> updateField(
            @PathVariable UUID id, 
            @PathVariable String fieldName, 
            @Valid @RequestBody Map<String, Object> updatedField) {
        return formConfigurationRepository.findById(id)
            .map(formConfig -> {
                List<Map<String, Object>> fields = formConfig.getFields();
                if (fields != null) {
                    for (int i = 0; i < fields.size(); i++) {
                        Map<String, Object> field = fields.get(i);
                        if (fieldName.equals(field.get("name"))) {
                            fields.set(i, updatedField);
                            break;
                        }
                    }
                    formConfig.setFields(fields);
                    FormConfiguration updated = formConfigurationRepository.save(formConfig);
                    log.info("Updated field '{}' in form '{}'", fieldName, formConfig.getFormName());
                    return ResponseEntity.ok(updated);
                }
                return ResponseEntity.ok(formConfig);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    // Remove a field from form configuration
    @DeleteMapping("/{id}/fields/{fieldName}")
    public ResponseEntity<FormConfiguration> removeField(@PathVariable UUID id, @PathVariable String fieldName) {
        return formConfigurationRepository.findById(id)
            .map(formConfig -> {
                List<Map<String, Object>> fields = formConfig.getFields();
                if (fields != null) {
                    fields.removeIf(field -> fieldName.equals(field.get("name")));
                    formConfig.setFields(fields);
                    FormConfiguration updated = formConfigurationRepository.save(formConfig);
                    log.info("Removed field '{}' from form '{}'", fieldName, formConfig.getFormName());
                    return ResponseEntity.ok(updated);
                }
                return ResponseEntity.ok(formConfig);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    // Reorder fields
    @PutMapping("/{id}/fields/reorder")
    public ResponseEntity<FormConfiguration> reorderFields(@PathVariable UUID id, @Valid @RequestBody List<String> fieldOrder) {
        return formConfigurationRepository.findById(id)
            .map(formConfig -> {
                List<Map<String, Object>> fields = formConfig.getFields();
                if (fields != null && !fieldOrder.isEmpty()) {
                    Map<String, Map<String, Object>> fieldMap = new HashMap<>();
                    for (Map<String, Object> field : fields) {
                        fieldMap.put((String) field.get("name"), field);
                    }
                    
                    List<Map<String, Object>> reorderedFields = new ArrayList<>();
                    int order = 1;
                    for (String name : fieldOrder) {
                        Map<String, Object> field = fieldMap.get(name);
                        if (field != null) {
                            field.put("order", order++);
                            reorderedFields.add(field);
                        }
                    }
                    
                    formConfig.setFields(reorderedFields);
                    FormConfiguration updated = formConfigurationRepository.save(formConfig);
                    log.info("Reordered fields in form '{}'", formConfig.getFormName());
                    return ResponseEntity.ok(updated);
                }
                return ResponseEntity.ok(formConfig);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    // Delete form configuration
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFormConfig(@PathVariable UUID id) {
        return formConfigurationRepository.findById(id)
            .map(formConfig -> {
                formConfigurationRepository.delete(formConfig);
                log.info("Deleted form configuration: {}", formConfig.getFormName());
                return ResponseEntity.ok(Map.of("message", "Form configuration deleted successfully"));
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    // Deactivate form configuration (soft delete)
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<FormConfiguration> deactivateFormConfig(@PathVariable UUID id) {
        return formConfigurationRepository.findById(id)
            .map(formConfig -> {
                formConfig.setIsActive(false);
                FormConfiguration updated = formConfigurationRepository.save(formConfig);
                log.info("Deactivated form configuration: {}", formConfig.getFormName());
                return ResponseEntity.ok(updated);
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
