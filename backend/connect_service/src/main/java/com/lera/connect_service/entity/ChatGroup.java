package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "chat_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatGroup {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(name = "created_by")
    private UUID createdBy;

    @ElementCollection
    @CollectionTable(name = "chat_group_members", joinColumns = @JoinColumn(name = "group_id"))
    @Column(name = "member_id")
    @Builder.Default
    private List<UUID> memberIds = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "chat_group_admins", joinColumns = @JoinColumn(name = "group_id"))
    @Column(name = "admin_id")
    @Builder.Default
    private List<UUID> adminIds = new ArrayList<>();

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
