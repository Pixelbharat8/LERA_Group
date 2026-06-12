package com.lera.connect_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

/** Anonymous website / placement / trial booking submissions (no JWT). */
@Data
public class PublicLeadRequest {

    @NotBlank
    @Size(max = 200)
    private String parentName;

    /** Optional for email-only contact forms; stored as "—" when blank. */
    @Size(max = 50)
    private String parentPhone;

    @Size(max = 200)
    private String parentEmail;

    @Size(max = 200)
    private String studentName;

    private Integer studentAge;

    private UUID centerId;

    private UUID interestedProgramId;

    @Size(max = 2000)
    private String preferredSchedule;

    /** Placement scores, trial notes, course interest — merged into Lead.notes */
    @Size(max = 4000)
    private String notes;

    /**
     * Hidden website form field used as a honeypot. Real users leave it blank;
     * automated spam submissions often fill it.
     */
    @Size(max = 200)
    private String website;

    /** Structured placement quiz output (merged into notes for CRM / conversion to StudentSkillLevel later). */
    private Integer placementScoreOutOf16;

    @Size(max = 120)
    private String placementTrackEn;

    @Size(max = 120)
    private String placementTrackVi;

    /** Optional e.g. A2, B1, IELTS 6.0 */
    @Size(max = 40)
    private String placementCefrOrBand;

    @Size(max = 100)
    private String utmSource;

    @Size(max = 100)
    private String utmMedium;

    @Size(max = 100)
    private String utmCampaign;
}
