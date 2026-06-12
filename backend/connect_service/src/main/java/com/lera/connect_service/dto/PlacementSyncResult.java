package com.lera.connect_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/** Result of attempting to copy informal placement from lead notes into Academy skill levels. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementSyncResult {

    /** True when a student id was supplied and sync logic ran (may still skip if notes lack placement). */
    private boolean attempted;

    /** True when Academy accepted the placement record (insert or update). */
    private boolean success;

    /** Machine-readable reason for dashboards and alerts: {@link PlacementSyncReasons}. */
    private String reason;

    /** Short detail for staff (e.g. HTTP status message). */
    private String detail;

    /** CRM lead id (always set when returned from convert). */
    private UUID leadId;

    /** Linked academy student when supplied for sync; may be null if convert ran without a student. */
    private UUID studentId;

    /**
     * When {@link #success} is true: whether Academy updated an existing placement row for this lead
     * instead of inserting (see Academy dedupe by {@code source_lead_id}). Null when sync did not reach Academy.
     */
    private Boolean updatedExisting;
}
