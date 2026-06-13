package com.lera.academy_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sport_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SportType {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "sport_name", nullable = false, unique = true, length = 100)
    private String sportName; // Football, Basketball, Swimming, Tennis, etc.

    @Column(name = "sport_code", unique = true, length = 50)
    private String sportCode;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "category", length = 50)
    private String category; // TEAM, INDIVIDUAL, INDOOR, OUTDOOR, WATER, COMBAT

    @Column(name = "min_players")
    private Integer minPlayers;

    @Column(name = "max_players")
    private Integer maxPlayers;

    @Column(name = "icon_url", columnDefinition = "TEXT")
    private String iconUrl;

    @Column(name = "rules", columnDefinition = "TEXT")
    private String rules; // JSON

    @Column(name = "equipment_needed", columnDefinition = "TEXT")
    private String equipmentNeeded; // JSON array

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
