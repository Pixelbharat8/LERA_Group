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
public class ScheduleFollowupRequest {
    private Long leadId;
    private String type; // CALL, EMAIL, MEETING, MESSAGE
    private String notes;
    private LocalDateTime scheduledAt;
    private Long assignedTo;
    private Integer priority; // 1-5
    private Integer reminderMinutes; // How many minutes before to send reminder
}
