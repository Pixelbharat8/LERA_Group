package com.lera.connect_service.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lera.connect_service.entity.Lead;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/** Documents the convert API contract: {@code lead} + {@code placementSync}. */
class ConvertLeadResponseJsonTest {

    private static final ObjectMapper MAPPER = new ObjectMapper().findAndRegisterModules();

    @Test
    void serializes_placement_sync_for_dashboard() throws Exception {
        UUID id = UUID.fromString("11111111-1111-1111-1111-111111111111");
        Lead lead = new Lead();
        lead.setId(id);
        lead.setStatus("CONVERTED");

        UUID leadUuid = UUID.fromString("22222222-2222-2222-2222-222222222222");
        UUID studentUuid = UUID.fromString("33333333-3333-3333-3333-333333333333");
        PlacementSyncResult sync = PlacementSyncResult.builder()
                .attempted(true)
                .success(false)
                .reason(PlacementSyncReasons.NO_PLACEMENT_IN_NOTES)
                .detail("Lead notes have no informal placement score block.")
                .leadId(leadUuid)
                .studentId(studentUuid)
                .updatedExisting(null)
                .build();

        ConvertLeadResponse body = new ConvertLeadResponse(lead, sync);
        String json = MAPPER.writeValueAsString(body);

        assertThat(json).contains("\"placementSync\"");
        JsonNode root = MAPPER.readTree(json);
        JsonNode ps = root.get("placementSync");
        assertThat(ps.get("attempted").asBoolean()).isTrue();
        assertThat(ps.get("success").asBoolean()).isFalse();
        assertThat(ps.get("reason").asText()).isEqualTo(PlacementSyncReasons.NO_PLACEMENT_IN_NOTES);
        assertThat(ps.get("leadId").asText()).isEqualTo(leadUuid.toString());
        assertThat(ps.get("studentId").asText()).isEqualTo(studentUuid.toString());
        JsonNode ue = ps.get("updatedExisting");
        assertThat(ue == null || ue.isNull()).isTrue();
    }

    @Test
    void serializes_updated_existing_on_success() throws Exception {
        UUID leadUuid = UUID.fromString("22222222-2222-2222-2222-222222222222");
        UUID studentUuid = UUID.fromString("33333333-3333-3333-3333-333333333333");
        PlacementSyncResult sync = PlacementSyncResult.builder()
                .attempted(true)
                .success(true)
                .reason(PlacementSyncReasons.SYNC_UPDATED)
                .detail("Updated.")
                .leadId(leadUuid)
                .studentId(studentUuid)
                .updatedExisting(true)
                .build();

        ConvertLeadResponse body = new ConvertLeadResponse(new Lead(), sync);
        JsonNode ps = MAPPER.readTree(MAPPER.writeValueAsString(body)).get("placementSync");
        assertThat(ps.get("updatedExisting").asBoolean()).isTrue();
    }
}
