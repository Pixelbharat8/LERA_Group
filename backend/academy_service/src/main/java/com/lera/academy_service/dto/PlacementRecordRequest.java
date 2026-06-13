package com.lera.academy_service.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Persists an English placement / diagnostic into {@code student_skill_levels} for reporting and class matching.
 */
@Data
public class PlacementRecordRequest {

    @NotNull
    private UUID studentId;

    /** Holistic score 0–100, optional. */
    private BigDecimal score;

    /** e.g. beginner, intermediate, advanced */
    @Size(max = 50)
    private String level;

    /** e.g. CEFR B1, IELTS 6.0, or internal track name */
    @Size(max = 200)
    private String bandOrTrack;

    @Size(max = 2000)
    private String notes;

    /**
     * When set (e.g. CRM lead id), internal import upserts a single row per (student, lead) to avoid duplicates.
     */
    private UUID sourceLeadId;
}
