package com.lera.social_media_service.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsRequest {
    private Long platformId;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String reportType; // engagement, growth, leads, summary
    private String[] metrics; // impressions, reach, engagement, followers
    private String granularity; // daily, weekly, monthly
}
