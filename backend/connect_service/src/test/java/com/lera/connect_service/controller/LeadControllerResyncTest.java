package com.lera.connect_service.controller;

import com.lera.connect_service.dto.ConvertLeadRequest;
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

/**
 * Locks the {@code POST /api/leads/{id}/placement-sync} contract: studentId resolution
 * (body, then {@code lead.convertedStudentId}), 400 with structured result when neither set,
 * audit row written under {@code LEAD_PLACEMENT_RESYNC}, and idempotency safety relies on the
 * Academy upsert path (covered by {@code InternalStudentSkillLevelControllerTest}).
 */
@ExtendWith(MockitoExtension.class)
class LeadControllerResyncTest {

    @Mock private LeadRepository leadRepository;
    @Mock private FollowupRepository followupRepository;
    @Mock private JdbcAuditWriter auditWriter;
    @Mock private LeadPlacementSyncService leadPlacementSyncService;
    @Mock private NotificationService notificationService;

    @InjectMocks private LeadController controller;

    private static final AuthUser ACTOR = ConnectTestAuth.orgWide();

    @Test
    void usesConvertedStudentIdWhenBodyIsEmpty() {
        UUID leadId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();
        Lead lead = Lead.builder()
                .id(leadId)
                .parentName("P")
                .parentPhone("1")
                .status("CONVERTED")
                .convertedStudentId(studentId)
                .notes("[placement] scoreOutOf16=14/16")
                .build();
        when(leadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        PlacementSyncResult ok = PlacementSyncResult.builder()
                .attempted(true).success(true).reason(PlacementSyncReasons.SYNC_UPDATED)
                .detail("Updated.").leadId(leadId).studentId(studentId).updatedExisting(true)
                .build();
        when(leadPlacementSyncService.trySyncPlacementFromLead(eq(studentId), eq(lead.getNotes()), eq(leadId)))
                .thenReturn(ok);

        ResponseEntity<PlacementSyncResult> resp = controller.resyncPlacement(leadId, null, ACTOR);

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody()).isNotNull();
        assertThat(resp.getBody().isSuccess()).isTrue();
        assertThat(resp.getBody().getUpdatedExisting()).isTrue();

        ArgumentCaptor<String> nv = ArgumentCaptor.forClass(String.class);
        verify(auditWriter).log(eq("LEAD_PLACEMENT_RESYNC"), eq("Lead"), eq(leadId), eq(ACTOR.getUserId()), eq(null), nv.capture());
        assertThat(nv.getValue()).contains("CONVERTED").contains("SYNC_UPDATED");
    }

    @Test
    void bodyStudentIdOverridesLeadField() {
        UUID leadId = UUID.randomUUID();
        UUID storedStudent = UUID.randomUUID();
        UUID newStudent = UUID.randomUUID();
        Lead lead = Lead.builder()
                .id(leadId).parentName("P").parentPhone("1").status("CONVERTED")
                .convertedStudentId(storedStudent)
                .notes("[placement] scoreOutOf16=10/16")
                .build();
        when(leadRepository.findById(leadId)).thenReturn(Optional.of(lead));
        when(leadPlacementSyncService.trySyncPlacementFromLead(eq(newStudent), any(), eq(leadId)))
                .thenReturn(PlacementSyncResult.builder()
                        .attempted(true).success(true).reason(PlacementSyncReasons.SYNC_OK)
                        .leadId(leadId).studentId(newStudent).updatedExisting(false).build());

        ConvertLeadRequest body = new ConvertLeadRequest();
        body.setStudentId(newStudent);
        ResponseEntity<PlacementSyncResult> resp = controller.resyncPlacement(leadId, body, ACTOR);

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody()).isNotNull();
        assertThat(resp.getBody().getStudentId()).isEqualTo(newStudent);
        verify(leadPlacementSyncService).trySyncPlacementFromLead(eq(newStudent), any(), eq(leadId));
    }

    @Test
    void returns400WhenNoStudentAvailable() {
        UUID leadId = UUID.randomUUID();
        Lead lead = Lead.builder()
                .id(leadId).parentName("P").parentPhone("1").status("CONVERTED")
                .build();
        when(leadRepository.findById(leadId)).thenReturn(Optional.of(lead));

        ResponseEntity<PlacementSyncResult> resp = controller.resyncPlacement(leadId, null, ACTOR);

        assertThat(resp.getStatusCode().value()).isEqualTo(400);
        assertThat(resp.getBody()).isNotNull();
        assertThat(resp.getBody().isAttempted()).isFalse();
        assertThat(resp.getBody().getReason()).isEqualTo(PlacementSyncReasons.NO_STUDENT_LINKED);
        verify(leadPlacementSyncService, never()).trySyncPlacementFromLead(any(), any(), any());

        ArgumentCaptor<String> nv = ArgumentCaptor.forClass(String.class);
        verify(auditWriter).log(eq("LEAD_PLACEMENT_RESYNC"), eq("Lead"), eq(leadId), eq(ACTOR.getUserId()), eq(null), nv.capture());
        assertThat(nv.getValue()).contains("NO_STUDENT_LINKED");
    }

    @Test
    void returns404WhenLeadMissing() {
        UUID leadId = UUID.randomUUID();
        when(leadRepository.findById(leadId)).thenReturn(Optional.empty());
        ResponseEntity<PlacementSyncResult> resp = controller.resyncPlacement(leadId, null, ACTOR);
        assertThat(resp.getStatusCode().value()).isEqualTo(404);
    }
}
