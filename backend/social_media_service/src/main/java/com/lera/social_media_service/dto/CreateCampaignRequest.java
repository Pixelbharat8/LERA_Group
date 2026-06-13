package com.lera.social_media_service.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCampaignRequest {
    private String name;
    private String description;
    private String campaignType;
    private BigDecimal budget;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String[] platforms;
    private String targetAudience;
    private String objective;
}
