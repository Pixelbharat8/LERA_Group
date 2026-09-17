package com.lera.identity_service.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The superadmin approvals screen filters the /api/users response on approvalStatus. UserDTO
 * did not carry the field at all, so every pending registration was dropped client-side even
 * once the query behind it was fixed. This asserts the field survives serialization — the one
 * link in that chain that the database-level check cannot cover.
 */
class UserDTOApprovalSerializationTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void approvalFieldsAreSerialized() throws Exception {
        UserDTO dto = UserDTO.builder()
                .email("applicant@example.test")
                .fullname("Applicant")
                .status("PENDING")
                .approvalStatus("PENDING")
                .requestedAt("2026-09-17T10:00:00")
                .build();

        @SuppressWarnings("unchecked")
        Map<String, Object> json = mapper.readValue(mapper.writeValueAsString(dto), Map.class);

        assertEquals("PENDING", json.get("approvalStatus"),
                "the approvals screen filters on this key");
        assertEquals("2026-09-17T10:00:00", json.get("requestedAt"),
                "the Date column reads this key");
    }

    @Test
    void rejectionReasonReachesTheClient() throws Exception {
        UserDTO dto = UserDTO.builder()
                .approvalStatus("REJECTED")
                .rejectionReason("Duplicate application")
                .build();

        @SuppressWarnings("unchecked")
        Map<String, Object> json = mapper.readValue(mapper.writeValueAsString(dto), Map.class);

        assertEquals("Duplicate application", json.get("rejectionReason"));
    }
}
