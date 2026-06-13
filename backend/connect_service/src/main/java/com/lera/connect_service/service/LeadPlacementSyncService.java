package com.lera.connect_service.service;

import com.lera.connect_service.dto.AcademyPlacementRpcResponse;
import com.lera.connect_service.dto.PlacementSyncReasons;
import com.lera.connect_service.dto.PlacementSyncResult;
import com.lera.connect_service.util.LeadPlacementNotesParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * After CRM lead conversion, copies informal placement quiz data into Academy {@code student_skill_levels}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LeadPlacementSyncService {

    private final RestTemplate restTemplate;

    @Value("${lera.internal.api-key:}")
    private String internalApiKey;

    @Value("${lera.academy.base-url:http://localhost:8082}")
    private String academyBaseUrl;

    /**
     * @param leadId used for dedupe marker on Academy side when placement sync runs
     */
    public PlacementSyncResult trySyncPlacementFromLead(UUID studentId, String notes, UUID leadId) {
        if (studentId == null) {
            log.info("placement_sync leadId={} studentId=null attempted=false reason={}", leadId, PlacementSyncReasons.NO_STUDENT_LINKED);
            return PlacementSyncResult.builder()
                    .attempted(false)
                    .success(false)
                    .reason(PlacementSyncReasons.NO_STUDENT_LINKED)
                    .detail("No student linked — placement import skipped.")
                    .leadId(leadId)
                    .studentId(null)
                    .updatedExisting(null)
                    .build();
        }

        if (internalApiKey == null || internalApiKey.isBlank()) {
            log.warn("placement_sync leadId={} studentId={} attempted=true success=false reason={}", leadId, studentId, PlacementSyncReasons.INTERNAL_KEY_MISSING);
            return PlacementSyncResult.builder()
                    .attempted(true)
                    .success(false)
                    .reason(PlacementSyncReasons.INTERNAL_KEY_MISSING)
                    .detail("Set lera.internal.api-key on connect_service and academy_service.")
                    .leadId(leadId)
                    .studentId(studentId)
                    .updatedExisting(null)
                    .build();
        }

        Optional<LeadPlacementNotesParser.ParsedPlacement> parsed = LeadPlacementNotesParser.parse(notes);
        if (parsed.isEmpty()) {
            log.info("placement_sync leadId={} studentId={} attempted=true success=false reason={} (no block in notes)", leadId, studentId, PlacementSyncReasons.NO_PLACEMENT_IN_NOTES);
            return PlacementSyncResult.builder()
                    .attempted(true)
                    .success(false)
                    .reason(PlacementSyncReasons.NO_PLACEMENT_IN_NOTES)
                    .detail("Lead notes have no informal placement score block.")
                    .leadId(leadId)
                    .studentId(studentId)
                    .updatedExisting(null)
                    .build();
        }
        LeadPlacementNotesParser.ParsedPlacement p = parsed.get();

        BigDecimal scoreOutOf100 = null;
        if (p.scoreOutOf16() != null) {
            scoreOutOf100 = BigDecimal.valueOf(p.scoreOutOf16() * 100.0 / 16.0)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("studentId", studentId.toString());
        body.put("score", scoreOutOf100);
        body.put("level", null);
        body.put("bandOrTrack", p.trackEn() != null ? p.trackEn() : "Placement / diagnostic");
        body.put("notes", "Imported from CRM lead conversion (informal placement self-check).");
        body.put("sourceLeadId", leadId.toString());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Key", internalApiKey.trim());

        String url = academyBaseUrl.replaceAll("/$", "")
                + "/api/internal/student-skill-levels/placement-record";
        try {
            ResponseEntity<AcademyPlacementRpcResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    AcademyPlacementRpcResponse.class);
            AcademyPlacementRpcResponse rpc = response.getBody();
            boolean updated = rpc != null && rpc.isUpdatedExisting();
            String reason = updated ? PlacementSyncReasons.SYNC_UPDATED : PlacementSyncReasons.SYNC_OK;
            String detail = updated
                    ? "Updated existing placement record for this lead in Academy."
                    : "Placement saved to Academy.";
            log.info("placement_sync leadId={} studentId={} attempted=true success=true reason={}", leadId, studentId, reason);
            return PlacementSyncResult.builder()
                    .attempted(true)
                    .success(true)
                    .reason(reason)
                    .detail(detail)
                    .leadId(leadId)
                    .studentId(studentId)
                    .updatedExisting(updated)
                    .build();
        } catch (HttpStatusCodeException ex) {
            String d = ex.getStatusCode().value() + ": "
                    + (ex.getResponseBodyAsString() != null && ex.getResponseBodyAsString().length() < 500
                    ? ex.getResponseBodyAsString() : ex.getMessage());
            log.warn("placement_sync leadId={} studentId={} attempted=true success=false reason={} detail={}", leadId, studentId, PlacementSyncReasons.ACADEMY_HTTP_ERROR, d);
            return PlacementSyncResult.builder()
                    .attempted(true)
                    .success(false)
                    .reason(PlacementSyncReasons.ACADEMY_HTTP_ERROR)
                    .detail(d)
                    .leadId(leadId)
                    .studentId(studentId)
                    .updatedExisting(null)
                    .build();
        } catch (RestClientException ex) {
            log.warn("placement_sync leadId={} studentId={} attempted=true success=false reason={} detail={}", leadId, studentId, PlacementSyncReasons.ACADEMY_UNREACHABLE, ex.getMessage());
            return PlacementSyncResult.builder()
                    .attempted(true)
                    .success(false)
                    .reason(PlacementSyncReasons.ACADEMY_UNREACHABLE)
                    .detail(ex.getMessage())
                    .leadId(leadId)
                    .studentId(studentId)
                    .updatedExisting(null)
                    .build();
        }
    }
}
