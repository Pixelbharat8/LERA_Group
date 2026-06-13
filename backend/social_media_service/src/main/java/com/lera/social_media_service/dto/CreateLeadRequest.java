package com.lera.social_media_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLeadRequest {
    private String name;
    private String email;
    private String phone;
    private String source;
    private String utmSource;
    private String utmMedium;
    private String utmCampaign;
    private String landingPage;
    private String notes;
    private Long campaignId;
    private Long assignedTo;
}
