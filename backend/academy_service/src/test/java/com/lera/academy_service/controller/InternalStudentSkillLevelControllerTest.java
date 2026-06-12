package com.lera.academy_service.controller;

import com.lera.academy_service.dto.InternalPlacementRecordResponse;
import com.lera.academy_service.dto.PlacementRecordRequest;
import com.lera.academy_service.entity.StudentSkillLevel;
import com.lera.academy_service.repository.StudentSkillLevelRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InternalStudentSkillLevelControllerTest {

    @Mock
    private StudentSkillLevelRepository studentSkillLevelRepository;

    @InjectMocks
    private InternalStudentSkillLevelController controller;

    @Test
    void creates_new_row_when_no_prior_import() {
        UUID studentId = UUID.randomUUID();
        UUID leadId = UUID.randomUUID();
        PlacementRecordRequest req = new PlacementRecordRequest();
        req.setStudentId(studentId);
        req.setSourceLeadId(leadId);
        req.setScore(new BigDecimal("50.00"));

        when(studentSkillLevelRepository.findByStudentIdAndSourceLeadId(studentId, leadId))
                .thenReturn(Optional.empty());
        when(studentSkillLevelRepository.findFirstByStudentIdAndSkillCategoryAndNotesContaining(
                studentId, "ENGLISH", InternalStudentSkillLevelController.leadImportMarker(leadId)))
                .thenReturn(Optional.empty());
        when(studentSkillLevelRepository.save(any(StudentSkillLevel.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<InternalPlacementRecordResponse> res = controller.recordPlacement(req);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().isUpdatedExisting()).isFalse();

        ArgumentCaptor<StudentSkillLevel> cap = ArgumentCaptor.forClass(StudentSkillLevel.class);
        verify(studentSkillLevelRepository).save(cap.capture());
        assertThat(cap.getValue().getSourceLeadId()).isEqualTo(leadId);
        assertThat(cap.getValue().getStudentId()).isEqualTo(studentId);
    }

    @Test
    void updates_when_same_lead_import_exists_by_column() {
        UUID studentId = UUID.randomUUID();
        UUID leadId = UUID.randomUUID();
        PlacementRecordRequest req = new PlacementRecordRequest();
        req.setStudentId(studentId);
        req.setSourceLeadId(leadId);
        req.setScore(new BigDecimal("60.00"));

        StudentSkillLevel existing = StudentSkillLevel.builder()
                .id(UUID.randomUUID())
                .studentId(studentId)
                .skillCategory("ENGLISH")
                .skillName("Old")
                .score(new BigDecimal("40.00"))
                .sourceLeadId(leadId)
                .build();

        when(studentSkillLevelRepository.findByStudentIdAndSourceLeadId(studentId, leadId))
                .thenReturn(Optional.of(existing));
        when(studentSkillLevelRepository.save(any(StudentSkillLevel.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<InternalPlacementRecordResponse> res = controller.recordPlacement(req);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().isUpdatedExisting()).isTrue();
        assertThat(res.getBody().getSkillLevel().getScore()).isEqualByComparingTo(new BigDecimal("60.00"));
    }

    @Test
    void updates_legacy_row_found_only_via_notes_marker() {
        UUID studentId = UUID.randomUUID();
        UUID leadId = UUID.randomUUID();
        String marker = InternalStudentSkillLevelController.leadImportMarker(leadId);
        PlacementRecordRequest req = new PlacementRecordRequest();
        req.setStudentId(studentId);
        req.setSourceLeadId(leadId);
        req.setScore(new BigDecimal("70.00"));
        req.setNotes("Prior import");

        StudentSkillLevel legacy = StudentSkillLevel.builder()
                .id(UUID.randomUUID())
                .studentId(studentId)
                .skillCategory("ENGLISH")
                .skillName("Placement / diagnostic")
                .score(new BigDecimal("30.00"))
                .notes("Imported earlier " + marker)
                .sourceLeadId(null)
                .build();

        when(studentSkillLevelRepository.findByStudentIdAndSourceLeadId(studentId, leadId))
                .thenReturn(Optional.empty());
        when(studentSkillLevelRepository.findFirstByStudentIdAndSkillCategoryAndNotesContaining(
                studentId, "ENGLISH", marker))
                .thenReturn(Optional.of(legacy));
        when(studentSkillLevelRepository.save(any(StudentSkillLevel.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<InternalPlacementRecordResponse> res = controller.recordPlacement(req);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().isUpdatedExisting()).isTrue();
        assertThat(res.getBody().getSkillLevel().getSourceLeadId()).isEqualTo(leadId);
        assertThat(res.getBody().getSkillLevel().getScore()).isEqualByComparingTo(new BigDecimal("70.00"));
    }

    @Test
    void insert_retries_as_update_when_unique_index_races() {
        UUID studentId = UUID.randomUUID();
        UUID leadId = UUID.randomUUID();
        PlacementRecordRequest req = new PlacementRecordRequest();
        req.setStudentId(studentId);
        req.setSourceLeadId(leadId);
        req.setScore(new BigDecimal("55.00"));

        StudentSkillLevel concurrentRow = StudentSkillLevel.builder()
                .id(UUID.randomUUID())
                .studentId(studentId)
                .skillCategory("ENGLISH")
                .skillName("Old track")
                .score(new BigDecimal("10.00"))
                .sourceLeadId(leadId)
                .build();

        when(studentSkillLevelRepository.findByStudentIdAndSourceLeadId(studentId, leadId))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(concurrentRow));
        when(studentSkillLevelRepository.findFirstByStudentIdAndSkillCategoryAndNotesContaining(
                studentId, "ENGLISH", InternalStudentSkillLevelController.leadImportMarker(leadId)))
                .thenReturn(Optional.empty());
        when(studentSkillLevelRepository.save(any(StudentSkillLevel.class)))
                .thenThrow(new DataIntegrityViolationException("uq_student_skill_levels_lead_import", null))
                .thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<InternalPlacementRecordResponse> res = controller.recordPlacement(req);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().isUpdatedExisting()).isTrue();
        assertThat(res.getBody().getSkillLevel().getScore()).isEqualByComparingTo(new BigDecimal("55.00"));
    }
}
