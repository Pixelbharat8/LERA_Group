package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "campaign_leads", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"campaign_id", "lead_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignLead {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "campaign_id", nullable = false)
    private UUID campaignId;

    @Column(name = "lead_id", nullable = false)
    private UUID leadId;

    @Column(name = "added_at", nullable = false)
    @Builder.Default
    private LocalDateTime addedAt = LocalDateTime.now();

    @Column(length = 50)
    private String status; // PENDING, CONTACTED, CONVERTED, UNRESPONSIVE

    @Column(name = "email_sent")
    @Builder.Default
    private Boolean emailSent = false;

    @Column(name = "email_opened")
    @Builder.Default
    private Boolean emailOpened = false;

    @Column(name = "email_clicked")
    @Builder.Default
    private Boolean emailClicked = false;

    @Column(name = "converted_at")
    private LocalDateTime convertedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
