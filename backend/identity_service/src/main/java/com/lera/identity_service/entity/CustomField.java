package com.lera.identity_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "custom_fields")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomField {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private String entityType; // student, teacher, course, etc.
    
    @Column(nullable = false)
    private String fieldName; // unique identifier within entity type
    
    @Column(nullable = false)
    private String fieldLabel; // display label in English
    
    private String fieldLabelVi; // display label in Vietnamese
    
    @Column(nullable = false)
    private String fieldType; // text, number, date, select, multiselect, checkbox, textarea, email, phone, url, file
    
    @ElementCollection
    @CollectionTable(name = "custom_field_options", joinColumns = @JoinColumn(name = "field_id"))
    @Column(name = "option_value")
    private List<String> options; // for select/multiselect types
    
    @Column(nullable = false)
    private Boolean isRequired = false;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @Column(nullable = false)
    private Boolean showInTable = true;
    
    @Column(nullable = false)
    private Boolean showInForm = true;
    
    private Integer sortOrder = 0;
    
    private String placeholder;
    
    private String defaultValue;
    
    private String validationRegex;
    
    private Double minValue;
    
    private Double maxValue;
    
    private String helpText;
    
    private String centerId; // optional: center-specific field
    
    private String createdBy;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
