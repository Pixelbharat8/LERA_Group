package com.lera.identity_service.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "departments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Department {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "department_code", unique = true, length = 50, nullable = false)
    private String departmentCode;
    
    @Column(name = "department_name", length = 200, nullable = false)
    private String departmentName;
    
    @Column(name = "department_name_vi", length = 200)
    private String departmentNameVi;
    
    @Column(name = "department_type", length = 50, nullable = false)
    private String departmentType; // 'ACADEMIC', 'ADMINISTRATIVE', 'IT', 'MARKETING', 'HR', 'FINANCE', 'OPERATIONS', 'STUDENT_SERVICES'
    
    @Column(name = "parent_department_id")
    private UUID parentDepartmentId;
    
    @Column(name = "center_id")
    private UUID centerId;
    
    @Column(name = "office_type", length = 50, nullable = false)
    private String officeType; // 'MAIN_OFFICE', 'BRANCH'
    
    @Column(name = "manager_id")
    private UUID managerId;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE";
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "center_id", insertable = false, updatable = false)
    @JsonIgnore
    private Center center;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_department_id", insertable = false, updatable = false)
    @JsonIgnore
    private Department parentDepartment;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", insertable = false, updatable = false)
    @JsonIgnore
    private User manager;
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
