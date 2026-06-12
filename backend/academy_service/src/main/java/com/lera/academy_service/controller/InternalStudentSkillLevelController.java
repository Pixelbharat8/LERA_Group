package com.lera.academy_service.controller;

import com.lera.academy_service.dto.InternalPlacementRecordResponse;
import com.lera.academy_service.dto.PlacementRecordRequest;
import com.lera.academy_service.entity.StudentSkillLevel;
import com.lera.academy_service.repository.StudentSkillLevelRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

/**
 * Machine-to-machine placement writes (Connect calls after CRM lead conversion).
 * Secured by {@link com.lera.academy_service.security.InternalApiKeyAuthFilter}.
 */
@RestController
@RequestMapping("/api/internal/student-skill-levels")
@RequiredArgsConstructor
public class InternalStudentSkillLevelController {

    private final StudentSkillLevelRepository studentSkillLevelRepository;

    static String leadImportMarker(UUID leadId) {
        return "[lead-import:" + leadId + "]";
    }

    @PostMapping("/placement-record")
    public ResponseEntity<InternalPlacementRecordResponse> recordPlacement(@Valid @RequestBody PlacementRecordRequest req) {
        String skillName = StringUtils.hasText(req.getBandOrTrack())
                ? req.getBandOrTrack().trim()
                : "Placement / diagnostic";

        String marker = req.getSourceLeadId() != null ? leadImportMarker(req.getSourceLeadId()) : null;
        String notes = req.getNotes();
        if (marker != null) {
            notes = (notes != null && !notes.isBlank() ? notes.trim() + " " : "") + marker;
        }

        if (req.getSourceLeadId() != null) {
            Optional<StudentSkillLevel> bySource = studentSkillLevelRepository
                    .findByStudentIdAndSourceLeadId(req.getStudentId(), req.getSourceLeadId());
            if (bySource.isPresent()) {
                StudentSkillLevel u = bySource.get();
                u.setSkillName(skillName);
                u.setLevel(req.getLevel());
                u.setScore(req.getScore());
                u.setAssessedAt(LocalDate.now());
                u.setNotes(notes);
                StudentSkillLevel saved = studentSkillLevelRepository.save(u);
                return ResponseEntity.ok(new InternalPlacementRecordResponse(saved, true));
            }
        }

        if (req.getSourceLeadId() != null && marker != null) {
            Optional<StudentSkillLevel> legacy = studentSkillLevelRepository
                    .findFirstByStudentIdAndSkillCategoryAndNotesContaining(
                            req.getStudentId(), "ENGLISH", marker);
            if (legacy.isPresent()) {
                StudentSkillLevel u = legacy.get();
                u.setSourceLeadId(req.getSourceLeadId());
                u.setSkillName(skillName);
                u.setLevel(req.getLevel());
                u.setScore(req.getScore());
                u.setAssessedAt(LocalDate.now());
                u.setNotes(notes);
                StudentSkillLevel saved = studentSkillLevelRepository.save(u);
                return ResponseEntity.ok(new InternalPlacementRecordResponse(saved, true));
            }
        }

        StudentSkillLevel row = StudentSkillLevel.builder()
                .studentId(req.getStudentId())
                .skillCategory("ENGLISH")
                .skillName(skillName)
                .level(req.getLevel())
                .score(req.getScore())
                .assessedBy(null)
                .assessedAt(LocalDate.now())
                .notes(notes)
                .sourceLeadId(req.getSourceLeadId())
                .build();
        if (req.getSourceLeadId() != null) {
            try {
                StudentSkillLevel saved = studentSkillLevelRepository.save(row);
                return ResponseEntity.ok(new InternalPlacementRecordResponse(saved, false));
            } catch (DataIntegrityViolationException ex) {
                Optional<StudentSkillLevel> lostRace = studentSkillLevelRepository
                        .findByStudentIdAndSourceLeadId(req.getStudentId(), req.getSourceLeadId());
                if (lostRace.isEmpty()) {
                    throw ex;
                }
                StudentSkillLevel u = lostRace.get();
                u.setSkillName(skillName);
                u.setLevel(req.getLevel());
                u.setScore(req.getScore());
                u.setAssessedAt(LocalDate.now());
                u.setNotes(notes);
                StudentSkillLevel saved = studentSkillLevelRepository.save(u);
                return ResponseEntity.ok(new InternalPlacementRecordResponse(saved, true));
            }
        }
        StudentSkillLevel saved = studentSkillLevelRepository.save(row);
        return ResponseEntity.ok(new InternalPlacementRecordResponse(saved, false));
    }
}
