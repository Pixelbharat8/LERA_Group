package com.lera.identity_service.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** A configurable dropdown option (e.g. leave types, staff positions). DB-backed. */
@Entity
@Table(name = "dropdown_options", indexes = {
        @Index(name = "idx_dropdown_category", columnList = "category")
})
@Data
public class DropdownOption {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String category;

    @Column(name = "value")
    private String value;

    @Column(name = "label")
    private String label;

    @Column(name = "label_vi")
    private String labelVi;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (isActive == null) isActive = true;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }
}
