package com.lera.connect_service.controller;

import com.lera.connect_service.dto.ConvertLeadRequest;
import com.lera.connect_service.dto.ConvertLeadResponse;
import com.lera.connect_service.dto.PlacementSyncReasons;
import com.lera.connect_service.dto.PlacementSyncResult;
import com.lera.connect_service.entity.Lead;
import com.lera.connect_service.repository.FollowupRepository;
import com.lera.connect_service.repository.LeadRepository;
import com.lera.connect_service.service.JdbcAuditWriter;
import com.lera.connect_service.service.LeadPlacementSyncService;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectTestAuth;
import com.lera.connect_service.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeadControllerConvertTest {

    @Mock private LeadRepository leadRepository;
    @Mock private FollowupRepository followupRepository;
    @Mock private JdbcAuditWriter auditWriter;
    @Mock private LeadPlacementSyncService leadPlacementSyncService;
    @Mock private NotificationService notificationService;

    @InjectMocks private LeadController controller;

    private static final AuthUser ACTOR = ConnectTestAuth.orgWide();

    @Test
    void convert_with_empty_request_body_skips_student_sync() {
        UUID leadId = UUID.randomUUID();
        Lead lead = Lead.builder()
                .id(leadId)
                .parentName("P")
                .parentPhone("1")
                .status("QUALIFIED")
                .build();
        when(leadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));

        ConvertLeadRequest empty = new ConvertLeadRequest();
        ResponseEntity<ConvertLeadResponse> resp = controller.convertLead(leadId, empty, ACTOR);

        assertThat(resp.getBody()).isNotNull();
        assertThat(resp.getBody().getPlacementSync().isAttempted()).isFalse();
        assertThat(resp.getBody().getPlacementSync().getReason()).isEqualTo(PlacementSyncReasons.NO_STUDENT_LINKED);
        verify(leadPlacementSyncService, never()).trySyncPlacementFromLead(
                any(), any(), any());
    }

    @Test
    void convert_without_student_returns_placement_sync_skipped() {
        UUID leadId = UUID.randomUUID();
        Lead lead = Lead.builder()
                .id(leadId)
                .parentName("P")
                .parentPhone("1")
                .status("QUALIFIED")
                .build();
        when(leadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<ConvertLeadResponse> resp = controller.convertLead(leadId, null, ACTOR);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        ConvertLeadResponse body = resp.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getPlacementSync()).isNotNull();
        assertThat(body.getPlacementSync().isAttempted()).isFalse();
        assertThat(body.getPlacementSync().getReason()).isEqualTo(PlacementSyncReasons.NO_STUDENT_LINKED);
        assertThat(body.getPlacementSync().getLeadId()).isEqualTo(leadId);
        assertThat(body.getPlacementSync().getStudentId()).isNull();

        ArgumentCaptor<String> newVals = ArgumentCaptor.forClass(String.class);
        verify(auditWriter).log(eq("LEAD_CONVERTED"), eq("Lead"), eq(leadId), eq(ACTOR.getUserId()), any(), newVals.capture());
        assertThat(newVals.getValue()).contains("placementSync").contains("NO_STUDENT_LINKED").contains("\"detail\"");
    }

    @Test
    void convert_with_student_merges_sync_result_and_audits() {
        UUID leadId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();
        Lead lead = Lead.builder()
                .id(leadId)
                .parentName("P")
                .parentPhone("1")
                .status("QUALIFIED")
                .notes("[placement] scoreOutOf16=10/16")
                .build();
        when(leadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));
        PlacementSyncResult syncResult = PlacementSyncResult.builder()
                .attempted(true)
                .success(true)
                .reason(PlacementSyncReasons.SYNC_OK)
                .detail("Placement saved to Academy.")
                .leadId(leadId)
                .studentId(studentId)
                .build();
        when(leadPlacementSyncService.trySyncPlacementFromLead(studentId, lead.getNotes(), leadId))
                .thenReturn(syncResult);

        ConvertLeadRequest req = new ConvertLeadRequest();
        req.setStudentId(studentId);
        ResponseEntity<ConvertLeadResponse> resp = controller.convertLead(leadId, req, ACTOR);

        assertThat(resp.getBody()).isNotNull();
        assertThat(resp.getBody().getPlacementSync().isSuccess()).isTrue();
        assertThat(resp.getBody().getLead().getConvertedStudentId()).isEqualTo(studentId);

        ArgumentCaptor<String> newVals = ArgumentCaptor.forClass(String.class);
        verify(auditWriter).log(eq("LEAD_CONVERTED"), eq("Lead"), eq(leadId), eq(ACTOR.getUserId()), any(), newVals.capture());
        assertThat(newVals.getValue()).contains("SYNC_OK").contains("\"success\":true");
    }
}
