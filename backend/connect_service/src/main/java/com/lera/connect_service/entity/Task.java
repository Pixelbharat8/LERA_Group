package com.lera.connect_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "assignee_id")
    private UUID assigneeId;
    
    @Column(name = "assigned_by")
    private UUID assignedBy;
    
    @Column(name = "center_id")
    private UUID centerId;
    
    @Column(name = "class_id")
    private UUID classId;
    
    @Column
    private String status; // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    
    @Column
    private String priority; // LOW, MEDIUM, HIGH, URGENT
    
    @Column
    private String category; // GRADING, ATTENDANCE, SUPPORT, ADMINISTRATIVE, OTHER
    
    @Column(name = "due_date")
    private LocalDate dueDate;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
        if (priority == null) priority = "MEDIUM";
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if ("COMPLETED".equals(status) && completedAt == null) {
            completedAt = LocalDateTime.now();
        }
    }
}
