package com.lera.identity_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "website_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebsiteSettings {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "setting_key", unique = true)
    private String settingKey;
    
    @Column(name = "setting_value", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String settingValue;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    @PreUpdate
    public void updateTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }
}
