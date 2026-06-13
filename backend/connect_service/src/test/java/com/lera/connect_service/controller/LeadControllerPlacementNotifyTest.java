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

/**
 * Notification policy: assigned-to staff get an in-app + push only when placement sync was
 * <em>attempted and failed</em>. No notification on success or when sync was skipped, and never
 * when {@code lead.assignedTo} is unset (would route to {@code null} = broadcast).
 */
@ExtendWith(MockitoExtension.class)
class LeadControllerPlacementNotifyTest {

    @Mock private LeadRepository leadRepository;
    @Mock private FollowupRepository followupRepository;
    @Mock private JdbcAuditWriter auditWriter;
    @Mock private LeadPlacementSyncService leadPlacementSyncService;
    @Mock private NotificationService notificationService;

    @InjectMocks private LeadController controller;

    private static final AuthUser ACTOR = ConnectTestAuth.orgWide();

    private static Lead lead(UUID id, UUID studentId, UUID assignedTo, String status) {
        return Lead.builder()
                .id(id)
                .parentName("Parent A")
                .parentPhone("1")
                .status(status)
                .convertedStudentId(studentId)
                .assignedTo(assignedTo)
                .notes("[placement] scoreOutOf16=10/16")
                .build();
    }

    @Test
    void convert_failure_with_assignee_notifies() {
        UUID leadId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();
        UUID assignee = UUID.randomUUID();
        Lead l = lead(leadId, null, assignee, "QUALIFIED");
        when(leadRepository.findById(leadId)).thenReturn(Optional.of(l));
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));
        when(leadPlacementSyncService.trySyncPlacementFromLead(eq(studentId), any(), eq(leadId)))
                .thenReturn(PlacementSyncResult.builder()
                        .attempted(true).success(false)
                        .reason(PlacementSyncReasons.ACADEMY_UNREACHABLE)
                        .detail("Connection refused")
                        .leadId(leadId).studentId(studentId)
                        .build());

        ConvertLeadRequest req = new ConvertLeadRequest();
        req.setStudentId(studentId);
        ResponseEntity<ConvertLeadResponse> resp = controller.convertLead(leadId, req, ACTOR);

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();

        ArgumentCaptor<String> message = ArgumentCaptor.forClass(String.class);
        verify(notificationService).createNotification(
                eq(assignee),
                eq("Placement import needs attention"),
                eq("Cần xử lý đồng bộ placement"),
                message.capture(),
                any(),
                eq("CRM_PLACEMENT_SYNC"),
                eq("Lead"),
                eq(leadId));
        assertThat(message.getValue()).contains("ACADEMY_UNREACHABLE").contains("Parent A");
    }

    @Test
    void convert_success_does_not_notify() {
        UUID leadId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();
        UUID assignee = UUID.randomUUID();
        Lead l = lead(leadId, null, assignee, "QUALIFIED");
        when(leadRepository.findById(leadId)).thenReturn(Optional.of(l));
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));
        when(leadPlacementSyncService.trySyncPlacementFromLead(eq(studentId), any(), eq(leadId)))
                .thenReturn(PlacementSyncResult.builder()
                        .attempted(true).success(true).reason(PlacementSyncReasons.SYNC_OK)
                        .leadId(leadId).studentId(studentId).updatedExisting(false).build());

        ConvertLeadRequest req = new ConvertLeadRequest();
        req.setStudentId(studentId);
        controller.convertLead(leadId, req, ACTOR);

        verify(notificationService, never()).createNotification(
                any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void convert_skipped_does_not_notify() {
        // No studentId in body -> sync is "not attempted" -> no notification, even if assignee is set.
        UUID leadId = UUID.randomUUID();
        UUID assignee = UUID.randomUUID();
        Lead l = lead(leadId, null, assignee, "QUALIFIED");
        when(leadRepository.findById(leadId)).thenReturn(Optional.of(l));
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));

        controller.convertLead(leadId, null, ACTOR);

        verify(notificationService, never()).createNotification(
                any(), any(), any(), any(), any(), any(), any(), any());
        verify(leadPlacementSyncService, never()).trySyncPlacementFromLead(any(), any(), any());
    }

    @Test
    void convert_failure_without_assignee_does_not_notify() {
        UUID leadId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();
        Lead l = lead(leadId, null, null, "QUALIFIED");
        when(leadRepository.findById(leadId)).thenReturn(Optional.of(l));
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));
        when(leadPlacementSyncService.trySyncPlacementFromLead(eq(studentId), any(), eq(leadId)))
                .thenReturn(PlacementSyncResult.builder()
                        .attempted(true).success(false)
                        .reason(PlacementSyncReasons.INTERNAL_KEY_MISSING)
                        .leadId(leadId).studentId(studentId).build());

        ConvertLeadRequest req = new ConvertLeadRequest();
        req.setStudentId(studentId);
        controller.convertLead(leadId, req, ACTOR);

        verify(notificationService, never()).createNotification(
                any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void resync_failure_with_assignee_notifies() {
        UUID leadId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();
        UUID assignee = UUID.randomUUID();
        Lead l = lead(leadId, studentId, assignee, "CONVERTED");
        when(leadRepository.findById(leadId)).thenReturn(Optional.of(l));
        when(leadPlacementSyncService.trySyncPlacementFromLead(eq(studentId), any(), eq(leadId)))
                .thenReturn(PlacementSyncResult.builder()
                        .attempted(true).success(false)
                        .reason(PlacementSyncReasons.ACADEMY_HTTP_ERROR)
                        .detail("400: validation failed")
                        .leadId(leadId).studentId(studentId).build());

        controller.resyncPlacement(leadId, null, ACTOR);

        verify(notificationService).createNotification(
                eq(assignee),
                eq("Placement import needs attention"),
                eq("Cần xử lý đồng bộ placement"),
                any(),
                any(),
                eq("CRM_PLACEMENT_SYNC"),
                eq("Lead"),
                eq(leadId));
    }

    @Test
    void resync_success_does_not_notify() {
        UUID leadId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();
        UUID assignee = UUID.randomUUID();
        Lead l = lead(leadId, studentId, assignee, "CONVERTED");
        when(leadRepository.findById(leadId)).thenReturn(Optional.of(l));
        when(leadPlacementSyncService.trySyncPlacementFromLead(eq(studentId), any(), eq(leadId)))
                .thenReturn(PlacementSyncResult.builder()
                        .attempted(true).success(true).reason(PlacementSyncReasons.SYNC_UPDATED)
                        .leadId(leadId).studentId(studentId).updatedExisting(true).build());

        controller.resyncPlacement(leadId, null, ACTOR);

        verify(notificationService, never()).createNotification(
                any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void resync_400_when_no_student_does_not_notify() {
        UUID leadId = UUID.randomUUID();
        UUID assignee = UUID.randomUUID();
        Lead l = lead(leadId, null, assignee, "CONVERTED");
        when(leadRepository.findById(leadId)).thenReturn(Optional.of(l));

        controller.resyncPlacement(leadId, null, ACTOR);

        // 400/missing-student is a "skipped" outcome (attempted=false), not a real failure.
        verify(notificationService, never()).createNotification(
                any(), any(), any(), any(), any(), any(), any(), any());
    }
}
