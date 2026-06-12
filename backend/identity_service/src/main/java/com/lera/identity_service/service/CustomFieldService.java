package com.lera.identity_service.service;

import com.lera.identity_service.entity.CustomField;
import com.lera.identity_service.repository.CustomFieldRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CustomFieldService {

    @Autowired
    private CustomFieldRepository customFieldRepository;

    public List<CustomField> getAllFields() {
        return customFieldRepository.findAll();
    }

    public List<CustomField> getFieldsByEntityType(String entityType) {
        return customFieldRepository.findByEntityTypeOrderBySortOrder(entityType);
    }

    public List<CustomField> getActiveFieldsByEntityType(String entityType) {
        return customFieldRepository.findByEntityTypeAndIsActiveOrderBySortOrder(entityType, true);
    }

    public List<CustomField> getTableFieldsByEntityType(String entityType) {
        return customFieldRepository.findByEntityTypeAndShowInTableAndIsActiveOrderBySortOrder(
            entityType, true, true);
    }

    public List<CustomField> getFormFieldsByEntityType(String entityType) {
        return customFieldRepository.findByEntityTypeAndShowInFormAndIsActiveOrderBySortOrder(
            entityType, true, true);
    }

    public List<CustomField> getFieldsByEntityTypeAndCenter(String entityType, String centerId) {
        return customFieldRepository.findByEntityTypeAndCenterId(entityType, centerId);
    }

    public Optional<CustomField> getFieldById(String id) {
        return customFieldRepository.findById(id);
    }

    public Optional<CustomField> getFieldByEntityTypeAndName(String entityType, String fieldName) {
        return customFieldRepository.findByEntityTypeAndFieldName(entityType, fieldName);
    }

    @Transactional
    public CustomField createField(CustomField field) {
        // Validate that field name is unique for the entity type
        if (customFieldRepository.existsByEntityTypeAndFieldName(field.getEntityType(), field.getFieldName())) {
            throw new IllegalArgumentException("Field with name '" + field.getFieldName() + 
                "' already exists for entity type '" + field.getEntityType() + "'");
        }
        
        // Set default values
        if (field.getSortOrder() == null) {
            Long count = customFieldRepository.countByEntityType(field.getEntityType());
            field.setSortOrder(count.intValue() + 1);
        }
        if (field.getIsActive() == null) {
            field.setIsActive(true);
        }
        if (field.getShowInTable() == null) {
            field.setShowInTable(true);
        }
        if (field.getShowInForm() == null) {
            field.setShowInForm(true);
        }
        if (field.getIsRequired() == null) {
            field.setIsRequired(false);
        }
        
        field.setCreatedAt(LocalDateTime.now());
        field.setUpdatedAt(LocalDateTime.now());
        
        return customFieldRepository.save(field);
    }

    @Transactional
    public CustomField updateField(String id, CustomField updatedField) {
        CustomField existingField = customFieldRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Custom field not found with id: " + id));
        
        // Check if field name is being changed to an existing name
        if (!existingField.getFieldName().equals(updatedField.getFieldName())) {
            if (customFieldRepository.existsByEntityTypeAndFieldName(
                    existingField.getEntityType(), updatedField.getFieldName())) {
                throw new IllegalArgumentException("Field with name '" + updatedField.getFieldName() + 
                    "' already exists for entity type '" + existingField.getEntityType() + "'");
            }
        }
        
        // Update fields
        existingField.setFieldName(updatedField.getFieldName());
        existingField.setFieldLabel(updatedField.getFieldLabel());
        existingField.setFieldLabelVi(updatedField.getFieldLabelVi());
        existingField.setFieldType(updatedField.getFieldType());
        existingField.setOptions(updatedField.getOptions());
        existingField.setIsRequired(updatedField.getIsRequired());
        existingField.setIsActive(updatedField.getIsActive());
        existingField.setShowInTable(updatedField.getShowInTable());
        existingField.setShowInForm(updatedField.getShowInForm());
        existingField.setSortOrder(updatedField.getSortOrder());
        existingField.setDefaultValue(updatedField.getDefaultValue());
        existingField.setValidationRegex(updatedField.getValidationRegex());
        existingField.setMinValue(updatedField.getMinValue());
        existingField.setMaxValue(updatedField.getMaxValue());
        existingField.setUpdatedAt(LocalDateTime.now());
        
        return customFieldRepository.save(existingField);
    }

    @Transactional
    public CustomField toggleFieldActive(String id) {
        CustomField field = customFieldRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Custom field not found with id: " + id));
        
        field.setIsActive(!field.getIsActive());
        field.setUpdatedAt(LocalDateTime.now());
        
        return customFieldRepository.save(field);
    }

    @Transactional
    public void deleteField(String id) {
        if (!customFieldRepository.existsById(id)) {
            throw new IllegalArgumentException("Custom field not found with id: " + id);
        }
        customFieldRepository.deleteById(id);
    }

    public List<String> getAllEntityTypes() {
        return customFieldRepository.findAllEntityTypes();
    }

    public Long countFieldsByEntityType(String entityType) {
        return customFieldRepository.countByEntityType(entityType);
    }

    @Transactional
    public void reorderFields(String entityType, List<String> fieldIds) {
        for (int i = 0; i < fieldIds.size(); i++) {
            String fieldId = fieldIds.get(i);
            CustomField field = customFieldRepository.findById(fieldId).orElse(null);
            if (field != null && field.getEntityType().equals(entityType)) {
                field.setSortOrder(i + 1);
                field.setUpdatedAt(LocalDateTime.now());
                customFieldRepository.save(field);
            }
        }
    }
}
