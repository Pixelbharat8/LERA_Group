package com.lera.academy_service.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "classes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ClassEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "center_id")
    private UUID centerId;
    
    @Column(name = "program_id")
    private UUID programId;
    
    @Column(name = "level_id")
    private UUID levelId;
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "teacher_id")
    private UUID teacherId;
    
    @Column(name = "assistant_teacher_id")
    private UUID assistantTeacherId;
    
    @Column(length = 100)
    private String room;
    
    @Column(name = "schedule_days", length = 50)
    private String scheduleDays;
    
    @Column(name = "schedule_time_start")
    private LocalTime scheduleTimeStart;
    
    @Column(name = "schedule_time_end")
    private LocalTime scheduleTimeEnd;
    
    @Column(name = "start_date")
    private LocalDate startDate;
    
    @Column(name = "end_date")
    private LocalDate endDate;
    
    @Column(name = "max_students")
    @Builder.Default
    private Integer maxStudents = 15;
    
    @Column(length = 20)
    @Builder.Default
    private String status = "OPEN";
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_id", insertable = false, updatable = false)
    @JsonIgnore
    private CourseProgram program;
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
