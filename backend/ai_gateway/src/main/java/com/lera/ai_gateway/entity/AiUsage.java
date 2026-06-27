package com.lera.ai_gateway.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Per-user AI token consumption, bucketed by calendar month ({@code period} = "YYYY-MM").
 * One row per (user, month); {@code tokensUsed} accumulates as the user makes AI calls.
 */
@Entity
@Table(name = "ai_usage", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "period"}))
public class AiUsage {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /** Calendar month, "YYYY-MM". */
    @Column(nullable = false, length = 7)
    private String period;

    @Column(name = "tokens_used", nullable = false)
    private long tokensUsed = 0;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }
    public long getTokensUsed() { return tokensUsed; }
    public void setTokensUsed(long tokensUsed) { this.tokensUsed = tokensUsed; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
