package com.lera.identity_service.service;

import com.lera.identity_service.entity.CustomField;
import com.lera.identity_service.entity.CustomFieldValue;
import com.lera.identity_service.repository.CustomFieldRepository;
import com.lera.identity_service.repository.CustomFieldValueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CustomFieldValueService {

    @Autowired
    private CustomFieldValueRepository customFieldValueRepository;

    @Autowired
    private CustomFieldRepository customFieldRepository;

    public List<CustomFieldValue> getValuesByEntityId(String entityId) {
        return customFieldValueRepository.findByEntityId(entityId);
    }

    public List<CustomFieldValue> getValuesByEntityIdAndType(String entityId, String entityType) {
        return customFieldValueRepository.findByEntityIdAndEntityType(entityId, entityType);
    }

    public Optional<CustomFieldValue> getValueByFieldAndEntity(String customFieldId, String entityId) {
        return customFieldValueRepository.findByCustomFieldIdAndEntityId(customFieldId, entityId);
    }

    /**
     * Get all custom field values for an entity as a map (fieldName -> value)
     */
    public Map<String, String> getValuesAsMap(String entityId, String entityType) {
        List<CustomFieldValue> values = customFieldValueRepository.findByEntityIdAndEntityType(entityId, entityType);
        Map<String, String> result = new HashMap<>();
        
        for (CustomFieldValue value : values) {
            CustomField field = value.getCustomField();
            if (field != null) {
                result.put(field.getFieldName(), value.getFieldValue());
            }
        }
        
        return result;
    }

    @Transactional
    public CustomFieldValue saveValue(String customFieldId, String entityId, String fieldValue) {
        // Verify the custom field exists
        CustomField field = customFieldRepository.findById(customFieldId)
            .orElseThrow(() -> new IllegalArgumentException("Custom field not found: " + customFieldId));

        // Check if value already exists
        Optional<CustomFieldValue> existing = customFieldValueRepository
            .findByCustomFieldIdAndEntityId(customFieldId, entityId);

        if (existing.isPresent()) {
            // Update existing value
            CustomFieldValue value = existing.get();
            value.setFieldValue(fieldValue);
            value.setUpdatedAt(LocalDateTime.now());
            return customFieldValueRepository.save(value);
        } else {
            // Create new value
            CustomFieldValue value = new CustomFieldValue();
            value.setCustomFieldId(customFieldId);
            value.setEntityId(entityId);
            value.setFieldValue(fieldValue);
            value.setCreatedAt(LocalDateTime.now());
            value.setUpdatedAt(LocalDateTime.now());
            return customFieldValueRepository.save(value);
        }
    }

    /**
     * Save multiple custom field values for an entity at once
     */
    @Transactional
    public void saveValues(String entityId, String entityType, Map<String, String> fieldValues) {
        List<CustomField> fields = customFieldRepository.findByEntityTypeAndIsActiveOrderBySortOrder(entityType, true);
        
        for (CustomField field : fields) {
            String value = fieldValues.get(field.getFieldName());
            if (value != null) {
                saveValue(field.getId(), entityId, value);
            }
        }
    }

    @Transactional
    public void deleteValue(String customFieldId, String entityId) {
        Optional<CustomFieldValue> existing = customFieldValueRepository
            .findByCustomFieldIdAndEntityId(customFieldId, entityId);
        existing.ifPresent(customFieldValueRepository::delete);
    }

    @Transactional
    public void deleteAllValuesForEntity(String entityId) {
        customFieldValueRepository.deleteByEntityId(entityId);
    }

    @Transactional
    public void deleteAllValuesForField(String customFieldId) {
        customFieldValueRepository.deleteByCustomFieldId(customFieldId);
    }

    public Long countValuesForField(String customFieldId) {
        return customFieldValueRepository.countByCustomFieldId(customFieldId);
    }
}
