package com.lera.identity_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(unique = true, nullable = false, length = 100)
    private String name;
    
    @Column(name = "display_name")
    private String displayName;
    
    @Column(name = "display_name_vi")
    private String displayNameVi;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Builder.Default
    private Integer level = 0;
    
    @Column(name = "is_system_role")
    @Builder.Default
    private Boolean isSystemRole = false;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
