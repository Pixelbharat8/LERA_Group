package com.lera.ai_gateway.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.GenericGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A request to render a promo video. Students/customers create these (status PENDING); the
 * marketing/manager team approves (→ render) or rejects. This is the cost guard — only an
 * approval triggers the paid provider call.
 */
@Entity
@Table(name = "video_requests", indexes = {
        @Index(name = "idx_video_requests_status", columnList = "status"),
        @Index(name = "idx_video_requests_requester", columnList = "requester_id")
})
@Data
public class VideoRequest {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "requester_id")
    private UUID requesterId;

    @Column(name = "requester_label", length = 200)
    private String requesterLabel;

    @Column(name = "prompt", nullable = false, columnDefinition = "text")
    private String prompt;

    /** Newline-separated source image URLs. */
    @Column(name = "images", columnDefinition = "text")
    private String images;

    @Column(name = "aspect_ratio", length = 20)
    private String aspectRatio;

    /** PENDING, APPROVED, RENDERED, REJECTED. */
    @Column(name = "status", length = 20, nullable = false)
    private String status = "PENDING";

    @Column(name = "result_url", columnDefinition = "text")
    private String resultUrl;

    @Column(name = "cost")
    private BigDecimal cost = BigDecimal.ZERO;

    @Column(name = "decided_by")
    private UUID decidedBy;

    @Column(name = "note", columnDefinition = "text")
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;
}
