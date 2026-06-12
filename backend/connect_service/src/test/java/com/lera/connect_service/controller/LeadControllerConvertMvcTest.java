package com.lera.connect_service.controller;

import com.lera.connect_service.dto.PlacementSyncReasons;
import com.lera.connect_service.dto.PlacementSyncResult;
import com.lera.connect_service.entity.Lead;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectTestAuth;
import com.lera.connect_service.repository.FollowupRepository;
import com.lera.connect_service.repository.LeadRepository;
import com.lera.connect_service.service.JdbcAuditWriter;
import com.lera.connect_service.service.LeadPlacementSyncService;
import com.lera.connect_service.service.NotificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * HTTP-level contract: {@code PUT /api/leads/{id}/convert} returns {@code lead} and
 * {@code placementSync} for the CRM dashboard (no Testcontainers; controllers are mocked at the service boundary).
 */
@WebMvcTest(controllers = LeadController.class)
@AutoConfigureMockMvc(addFilters = false)
class LeadControllerConvertMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void staffLogin() {
        AuthUser actor = ConnectTestAuth.orgWide();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                actor,
                "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_CEO"))));
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    @MockBean
    private LeadRepository leadRepository;
    @MockBean
    private FollowupRepository followupRepository;
    @MockBean
    private JdbcAuditWriter auditWriter;
    @MockBean
    private LeadPlacementSyncService leadPlacementSyncService;
    @MockBean
    private NotificationService notificationService;
    @MockBean
    private com.lera.connect_service.service.LeadScoringService leadScoringService;

    @Test
    void convert_put_json_includes_placement_sync() throws Exception {
        UUID leadId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        UUID studentId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Lead lead = Lead.builder()
                .id(leadId)
                .parentName("Parent")
                .parentPhone("1")
                .status("QUALIFIED")
                .notes("[placement] scoreOutOf16=10/16")
                .build();
        when(leadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));
        when(leadPlacementSyncService.trySyncPlacementFromLead(eq(studentId), any(), eq(leadId)))
                .thenReturn(PlacementSyncResult.builder()
                        .attempted(true)
                        .success(true)
                        .reason(PlacementSyncReasons.SYNC_OK)
                        .detail("Placement saved to Academy.")
                        .leadId(leadId)
                        .studentId(studentId)
                        .updatedExisting(false)
                        .build());

        mockMvc.perform(put("/api/leads/{id}/convert", leadId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":\"" + studentId + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.placementSync.attempted").value(true))
                .andExpect(jsonPath("$.placementSync.success").value(true))
                .andExpect(jsonPath("$.placementSync.reason").value(PlacementSyncReasons.SYNC_OK))
                .andExpect(jsonPath("$.placementSync.leadId").value(leadId.toString()))
                .andExpect(jsonPath("$.placementSync.studentId").value(studentId.toString()))
                .andExpect(jsonPath("$.placementSync.updatedExisting").value(false))
                .andExpect(jsonPath("$.lead.status").value("CONVERTED"));

        verify(leadPlacementSyncService).trySyncPlacementFromLead(eq(studentId), any(), eq(leadId));
    }
}
