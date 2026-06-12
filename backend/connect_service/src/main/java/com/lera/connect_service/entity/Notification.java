package com.lera.connect_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "user_id")
    private UUID userId;
    
    @Column(nullable = false)
    private String title;
    
    @Column(name = "title_vi")
    private String titleVi;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;
    
    @Column(name = "message_vi", columnDefinition = "TEXT")
    private String messageVi;
    
    private String type;
    
    @Column(name = "reference_type")
    private String referenceType;
    
    @Column(name = "reference_id")
    private UUID referenceId;
    
    @Column(name = "is_read")
    private Boolean isRead;
    
    @Column(name = "center_id")
    private UUID centerId;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isRead == null) isRead = false;
    }
}
