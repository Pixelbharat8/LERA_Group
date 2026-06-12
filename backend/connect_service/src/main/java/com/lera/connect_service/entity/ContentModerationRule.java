package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "content_moderation_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentModerationRule {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "academy_id")
    private UUID academyId; // null = global rule

    @Column(name = "rule_name", nullable = false)
    private String ruleName;

    @Column(name = "rule_type", length = 30)
    @Builder.Default
    private String ruleType = "KEYWORD"; // KEYWORD, REGEX, AI_CATEGORY

    @Column(name = "pattern", columnDefinition = "TEXT")
    private String pattern; // Keyword list or regex

    @Column(name = "category", length = 50)
    private String category; // PROFANITY, BULLYING, etc.

    @Column(name = "action", length = 30)
    @Builder.Default
    private String action = "FLAG"; // BLOCK, FLAG, WARN, REPLACE

    @Column(name = "replacement_text")
    private String replacementText; // For REPLACE action

    @Column(name = "severity", length = 20)
    @Builder.Default
    private String severity = "MEDIUM";

    @Column(name = "applies_to_students")
    @Builder.Default
    private Boolean appliesToStudents = true;

    @Column(name = "applies_to_parents")
    @Builder.Default
    private Boolean appliesToParents = false;

    @Column(name = "applies_to_teachers")
    @Builder.Default
    private Boolean appliesToTeachers = false;

    @Column(name = "notify_parent")
    @Builder.Default
    private Boolean notifyParent = true;

    @Column(name = "notify_teacher")
    @Builder.Default
    private Boolean notifyTeacher = true;

    @Column(name = "notify_admin")
    @Builder.Default
    private Boolean notifyAdmin = false;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
