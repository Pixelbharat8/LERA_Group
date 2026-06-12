package com.lera.connect_service.service;

import com.lera.connect_service.dto.AcademyPlacementRpcResponse;
import com.lera.connect_service.dto.PlacementSyncReasons;
import com.lera.connect_service.dto.PlacementSyncResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeadPlacementSyncServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private LeadPlacementSyncService leadPlacementSyncService;

    private final UUID leadId = UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private final UUID studentId = UUID.fromString("11111111-2222-3333-4444-555555555555");

    @BeforeEach
    void wireProps() {
        ReflectionTestUtils.setField(leadPlacementSyncService, "internalApiKey", "test-internal-key");
        ReflectionTestUtils.setField(leadPlacementSyncService, "academyBaseUrl", "http://academy.test");
    }

    @Test
    void skips_when_no_student() {
        PlacementSyncResult r = leadPlacementSyncService.trySyncPlacementFromLead(null, "[placement] scoreOutOf16=10/16", leadId);
        assertThat(r.isAttempted()).isFalse();
        assertThat(r.getReason()).isEqualTo(PlacementSyncReasons.NO_STUDENT_LINKED);
        assertThat(r.getLeadId()).isEqualTo(leadId);
        assertThat(r.getStudentId()).isNull();
    }

    @Test
    void fails_when_internal_key_missing() {
        ReflectionTestUtils.setField(leadPlacementSyncService, "internalApiKey", " ");
        PlacementSyncResult r = leadPlacementSyncService.trySyncPlacementFromLead(studentId, "[placement] scoreOutOf16=10/16", leadId);
        assertThat(r.isAttempted()).isTrue();
        assertThat(r.isSuccess()).isFalse();
        assertThat(r.getReason()).isEqualTo(PlacementSyncReasons.INTERNAL_KEY_MISSING);
    }

    @Test
    void fails_when_notes_have_no_placement_block() {
        PlacementSyncResult r = leadPlacementSyncService.trySyncPlacementFromLead(studentId, "Just a phone follow-up.", leadId);
        assertThat(r.isAttempted()).isTrue();
        assertThat(r.isSuccess()).isFalse();
        assertThat(r.getReason()).isEqualTo(PlacementSyncReasons.NO_PLACEMENT_IN_NOTES);
    }

    @Test
    void success_on_academy_ok() {
        AcademyPlacementRpcResponse body = new AcademyPlacementRpcResponse();
        body.setUpdatedExisting(false);
        when(restTemplate.exchange(
                eq("http://academy.test/api/internal/student-skill-levels/placement-record"),
                ArgumentMatchers.any(),
                any(),
                eq(AcademyPlacementRpcResponse.class)))
                .thenReturn(ResponseEntity.ok(body));

        PlacementSyncResult r = leadPlacementSyncService.trySyncPlacementFromLead(
                studentId, "[placement] scoreOutOf16=8/16; trackEn=Starter", leadId);
        assertThat(r.isSuccess()).isTrue();
        assertThat(r.getReason()).isEqualTo(PlacementSyncReasons.SYNC_OK);
        assertThat(r.getStudentId()).isEqualTo(studentId);
        assertThat(r.getLeadId()).isEqualTo(leadId);
        assertThat(r.getUpdatedExisting()).isFalse();
    }

    @Test
    void success_maps_updated_existing_from_academy() {
        AcademyPlacementRpcResponse body = new AcademyPlacementRpcResponse();
        body.setUpdatedExisting(true);
        when(restTemplate.exchange(
                eq("http://academy.test/api/internal/student-skill-levels/placement-record"),
                ArgumentMatchers.any(),
                any(),
                eq(AcademyPlacementRpcResponse.class)))
                .thenReturn(ResponseEntity.ok(body));

        PlacementSyncResult r = leadPlacementSyncService.trySyncPlacementFromLead(
                studentId, "[placement] scoreOutOf16=12/16", leadId);
        assertThat(r.isSuccess()).isTrue();
        assertThat(r.getReason()).isEqualTo(PlacementSyncReasons.SYNC_UPDATED);
        assertThat(r.getUpdatedExisting()).isTrue();
    }

    @Test
    @SuppressWarnings("unchecked")
    void posts_student_and_source_lead_id_to_academy() {
        AcademyPlacementRpcResponse body = new AcademyPlacementRpcResponse();
        body.setUpdatedExisting(false);
        ArgumentCaptor<HttpEntity<?>> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        when(restTemplate.exchange(
                eq("http://academy.test/api/internal/student-skill-levels/placement-record"),
                eq(HttpMethod.POST),
                entityCaptor.capture(),
                eq(AcademyPlacementRpcResponse.class)))
                .thenReturn(ResponseEntity.ok(body));

        leadPlacementSyncService.trySyncPlacementFromLead(
                studentId, "[placement] scoreOutOf16=8/16", leadId);

        Object raw = entityCaptor.getValue().getBody();
        assertThat(raw).isInstanceOf(Map.class);
        Map<?, ?> map = (Map<?, ?>) raw;
        assertThat(map.get("studentId")).isEqualTo(studentId.toString());
        assertThat(map.get("sourceLeadId")).isEqualTo(leadId.toString());
    }

    @Test
    void maps_http_error_from_academy() {
        when(restTemplate.exchange(
                eq("http://academy.test/api/internal/student-skill-levels/placement-record"),
                ArgumentMatchers.any(),
                any(),
                eq(AcademyPlacementRpcResponse.class)))
                .thenThrow(HttpClientErrorException.create(
                        HttpStatus.BAD_REQUEST, "Bad Request", null, "{}".getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8));

        PlacementSyncResult r = leadPlacementSyncService.trySyncPlacementFromLead(
                studentId, "[placement] scoreOutOf16=12/16", leadId);
        assertThat(r.isSuccess()).isFalse();
        assertThat(r.getReason()).isEqualTo(PlacementSyncReasons.ACADEMY_HTTP_ERROR);
        assertThat(r.getDetail()).contains("400");
    }

    @Test
    void maps_unreachable_academy() {
        when(restTemplate.exchange(
                eq("http://academy.test/api/internal/student-skill-levels/placement-record"),
                ArgumentMatchers.any(),
                any(),
                eq(AcademyPlacementRpcResponse.class)))
                .thenThrow(new RestClientException("Connection refused"));

        PlacementSyncResult r = leadPlacementSyncService.trySyncPlacementFromLead(
                studentId, "[placement] scoreOutOf16=12/16", leadId);
        assertThat(r.isSuccess()).isFalse();
        assertThat(r.getReason()).isEqualTo(PlacementSyncReasons.ACADEMY_UNREACHABLE);
    }
}
