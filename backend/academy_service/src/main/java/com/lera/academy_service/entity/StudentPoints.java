package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "student_points")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentPoints {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "student_id", nullable = false)
    private UUID studentId;
    
    @Column(name = "center_id")
    private UUID centerId;
    
    @Column(name = "total_points")
    @Builder.Default
    private Integer totalPoints = 0;
    
    @Column(name = "current_level")
    @Builder.Default
    private Integer currentLevel = 1;
    
    @Column(name = "current_streak")
    @Builder.Default
    private Integer currentStreak = 0;
    
    @Column(name = "longest_streak")
    @Builder.Default
    private Integer longestStreak = 0;
    
    @Column(name = "badges_earned")
    @Builder.Default
    private Integer badgesEarned = 0;
    
    @Column(name = "last_activity_date")
    private LocalDateTime lastActivityDate;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
