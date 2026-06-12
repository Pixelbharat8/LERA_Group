package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "transport_routes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransportRoute {
    @Id
    private String id;
    
    @Column(name = "route_code", nullable = false, unique = true)
    private String routeCode;
    
    @Column(name = "route_name", nullable = false)
    private String routeName;
    
    @Column(name = "route_name_vi")
    private String routeNameVi;
    
    @Column(name = "route_type")
    private String routeType;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "start_location", nullable = false)
    private String startLocation;
    
    @Column(name = "end_location", nullable = false)
    private String endLocation;
    
    @Column(name = "total_distance")
    private Double totalDistance;
    
    @Column(name = "estimated_duration")
    private Integer estimatedDuration;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        if (id == null) id = java.util.UUID.randomUUID().toString();
        createdAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
