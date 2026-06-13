package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "class_group_chats", indexes = {
    @Index(name = "idx_class_group_chat_class", columnList = "class_id"),
    @Index(name = "idx_class_group_chat_academy", columnList = "academy_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassGroupChat {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "class_id", nullable = false)
    private UUID classId;

    @Column(name = "academy_id", nullable = false)
    private UUID academyId;

    @Column(name = "group_id", nullable = false)
    private UUID groupId; // Reference to ChatGroup

    @Column(name = "class_name")
    private String className;

    @Column(name = "grade_level")
    private String gradeLevel;

    @Column(name = "section")
    private String section;

    @Column(name = "academic_year")
    private String academicYear;

    @Column(name = "group_type", length = 30)
    @Builder.Default
    private String groupType = "CLASS"; // CLASS, SUBJECT, ACTIVITY

    @Column(name = "include_parents")
    @Builder.Default
    private Boolean includeParents = true;

    @Column(name = "include_students")
    @Builder.Default
    private Boolean includeStudents = true;

    @Column(name = "auto_sync_members")
    @Builder.Default
    private Boolean autoSyncMembers = true; // Auto-add new students

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
