package com.lera.identity_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "centers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Center {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(unique = true, nullable = false, length = 50)
    private String code;
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "name_vi")
    private String nameVi;
    
    @Column(columnDefinition = "TEXT")
    private String address;
    
    @Column(name = "address_vi", columnDefinition = "TEXT")
    private String addressVi;
    
    @Column(length = 100)
    private String city;
    
    @Column(length = 100)
    private String district;
    
    @Column(length = 50)
    private String phone;
    
    private String email;
    
    @Column(name = "manager_id")
    private UUID managerId;
    
    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;
    
    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE";
    
    @Column(name = "opening_date")
    private java.time.LocalDate openingDate;
    
    @Builder.Default
    private Integer capacity = 500;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
