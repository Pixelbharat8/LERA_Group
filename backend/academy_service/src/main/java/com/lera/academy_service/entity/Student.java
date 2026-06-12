package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "students")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "user_id", unique = true)
    private UUID userId;
    
    @Column(name = "center_id")
    private UUID centerId;
    
    @Column(name = "student_code", unique = true, length = 50)
    private String studentCode;
    
    @Column(nullable = false)
    private String fullname;
    
    @Column(name = "fullname_vi")
    private String fullnameVi;
    
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;
    
    @Column(length = 20)
    private String gender;
    
    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;
    
    @Column(name = "school_name")
    private String schoolName;
    
    @Column(length = 50)
    private String grade;
    
    @Column
    private String email;
    
    @Column(length = 50)
    private String phone;
    
    @Column(name = "parent_id")
    private UUID parentId;
    
    @Column(name = "parent_name")
    private String parentName;
    
    @Column(name = "parent_phone", length = 50)
    private String parentPhone;
    
    @Column(name = "parent_email")
    private String parentEmail;
    
    @Column(name = "emergency_contact_name")
    private String emergencyContactName;
    
    @Column(name = "emergency_contact_phone", length = 50)
    private String emergencyContactPhone;
    
    @Column(name = "medical_notes", columnDefinition = "TEXT")
    private String medicalNotes;
    
    @Column(name = "learning_notes", columnDefinition = "TEXT")
    private String learningNotes;
    
    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE";
    
    @Column(name = "enrollment_date")
    @Builder.Default
    private LocalDate enrollmentDate = LocalDate.now();
    
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
