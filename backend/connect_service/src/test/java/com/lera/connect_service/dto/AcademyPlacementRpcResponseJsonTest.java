package com.lera.connect_service.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** Academy internal placement endpoint returns skillLevel + updatedExisting; connect only maps updatedExisting. */
class AcademyPlacementRpcResponseJsonTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Test
    void deserializes_academy_response_with_nested_skillLevel() throws Exception {
        String json = """
                {
                  "skillLevel": {
                    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
                    "studentId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
                    "skillCategory": "ENGLISH",
                    "skillName": "Placement / diagnostic",
                    "level": null,
                    "score": 50.00,
                    "assessedBy": null,
                    "assessedAt": "2026-05-01",
                    "notes": "Imported from CRM. [lead-import:6ba7b810-9dad-11d1-80b4-00c04fd430c8]",
                    "sourceLeadId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
                    "createdAt": "2026-05-01T12:00:00"
                  },
                  "updatedExisting": true
                }
                """;
        AcademyPlacementRpcResponse r = MAPPER.readValue(json, AcademyPlacementRpcResponse.class);
        assertThat(r.isUpdatedExisting()).isTrue();
    }

    @Test
    void deserializes_minimal_response() throws Exception {
        String json = "{\"updatedExisting\":false}";
        AcademyPlacementRpcResponse r = MAPPER.readValue(json, AcademyPlacementRpcResponse.class);
        assertThat(r.isUpdatedExisting()).isFalse();
    }
}
