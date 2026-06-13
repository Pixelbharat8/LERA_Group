package com.lera.academy.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "class_switch_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassSwitchHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "student_id", nullable = false)
    private UUID studentId;
    
    @Column(name = "old_class_id")
    private UUID oldClassId;
    
    @Column(name = "new_class_id", nullable = false)
    private UUID newClassId;
    
    @Column(name = "old_class_name")
    private String oldClassName;
    
    @Column(name = "new_class_name")
    private String newClassName;
    
    @Column(name = "reason")
    private String reason;
    
    @Column(name = "switched_by")
    private UUID switchedBy;
    
    @Column(name = "switched_at")
    private LocalDateTime switchedAt;
    
    @PrePersist
    protected void onCreate() {
        switchedAt = LocalDateTime.now();
    }
}
