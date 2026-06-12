package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "certificate_templates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CertificateTemplate {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "template_name", nullable = false)
    private String templateName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "template_type", length = 50)
    private String templateType; // COMPLETION, ACHIEVEMENT, PARTICIPATION, MERIT

    @Column(name = "template_url", columnDefinition = "TEXT")
    private String templateUrl; // PDF/Image template URL

    @Column(name = "html_template", columnDefinition = "TEXT")
    private String htmlTemplate; // HTML template for PDF generation

    @Column(name = "background_image", columnDefinition = "TEXT")
    private String backgroundImage;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(name = "signature_1_url", columnDefinition = "TEXT")
    private String signature1Url;

    @Column(name = "signature_1_title", length = 100)
    private String signature1Title;

    @Column(name = "signature_2_url", columnDefinition = "TEXT")
    private String signature2Url;

    @Column(name = "signature_2_title", length = 100)
    private String signature2Title;

    @Column(name = "layout_config", columnDefinition = "TEXT")
    private String layoutConfig; // JSON for positioning

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
