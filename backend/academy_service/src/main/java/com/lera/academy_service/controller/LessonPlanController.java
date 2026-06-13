package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.client.NotificationClient;
import com.lera.academy_service.entity.LessonPlan;
import com.lera.academy_service.repository.LessonPlanRepository;
import com.lera.academy_service.service.JdbcAuditWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

/**
 * REST controller for managing Lesson Plans.
 * Teachers create lesson plans per class per session with:
 *  - Warm-up / Main / Practice / Cool-down activities
 *  - PowerPoint & worksheet attachments
 *  - Homework description & due date
 *  - Assessment method
 *  - Differentiation notes
 *  - Post-lesson reflection
 *
 * Approval workflow: DRAFT -> SUBMITTED -> APPROVED -> IN_PROGRESS -> COMPLETED
 */
@RestController
@RequestMapping("/api/lesson-plans")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class LessonPlanController {

    private final LessonPlanRepository lessonPlanRepository;
    private final NotificationClient notificationClient;
    private final JdbcAuditWriter auditWriter;
    private final AcademyAuthorizationService authz;
    private final com.lera.academy_service.scheduler.HomeworkReminderScheduler homeworkReminderScheduler;

    /** Manually trigger homework-due reminders (the scheduler also runs daily). */
    @PostMapping("/homework-reminders/run")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<java.util.Map<String, Object>> runHomeworkReminders() {
        int sent = homeworkReminderScheduler.runReminders();
        return ResponseEntity.ok(java.util.Map.of("remindersSent", sent));
    }

    // ==================== CRUD ====================

    @GetMapping
    public ResponseEntity<List<LessonPlan>> getAllLessonPlans(
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) UUID teacherId,
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        if (classId != null) {
            authz.assertCanViewClassRoster(classId);
        }
        if (centerId != null) {
            authz.assertStaffOrCenter(centerId);
        }
        if (teacherId != null) {
            authz.assertStaff();
        }

        // Filter by teacher + date range
        if (teacherId != null && startDate != null && endDate != null) {
            return ResponseEntity.ok(lessonPlanRepository.findByTeacherIdAndPlanDateBetween(teacherId, startDate, endDate));
        }
        // Filter by class + date range
        if (classId != null && startDate != null && endDate != null) {
            return ResponseEntity.ok(lessonPlanRepository.findByClassIdAndPlanDateBetween(classId, startDate, endDate));
        }
        // Filter by center + date range
        if (centerId != null && startDate != null && endDate != null) {
            return ResponseEntity.ok(lessonPlanRepository.findByCenterIdAndPlanDateBetween(centerId, startDate, endDate));
        }
        // Filter by teacher + status
        if (teacherId != null && status != null) {
            return ResponseEntity.ok(lessonPlanRepository.findByTeacherIdAndStatus(teacherId, status));
        }
        if (classId != null && teacherId != null) {
            return ResponseEntity.ok(lessonPlanRepository.findByClassIdAndTeacherId(classId, teacherId));
        }
        if (classId != null) {
            return ResponseEntity.ok(lessonPlanRepository.findByClassIdOrderByPlanDateAsc(classId));
        }
        if (teacherId != null) {
            return ResponseEntity.ok(lessonPlanRepository.findByTeacherIdOrderByPlanDateDesc(teacherId));
        }
        if (centerId != null) {
            return ResponseEntity.ok(lessonPlanRepository.findByCenterId(centerId));
        }
        if (status != null) {
            authz.assertStaff();
            return ResponseEntity.ok(lessonPlanRepository.findByStatus(status));
        }
        if (!authz.isOrgWide()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Specify classId, teacherId, centerId, or status for lesson plan list queries");
        }
        return ResponseEntity.ok(lessonPlanRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LessonPlan> getLessonPlanById(@PathVariable UUID id) {
        return lessonPlanRepository.findById(id)
                .map(plan -> {
                    if (plan.getClassId() != null) {
                        authz.assertCanViewClassRoster(plan.getClassId());
                    } else {
                        authz.assertStaff();
                    }
                    return ResponseEntity.ok(plan);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<LessonPlan>> getLessonPlansByClass(@PathVariable UUID classId) {
        authz.assertCanViewClassRoster(classId);
        return ResponseEntity.ok(lessonPlanRepository.findByClassIdOrderByPlanDateAsc(classId));
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<LessonPlan>> getLessonPlansByTeacher(@PathVariable UUID teacherId) {
        return ResponseEntity.ok(lessonPlanRepository.findByTeacherIdOrderByPlanDateDesc(teacherId));
    }

    @GetMapping("/teacher/{teacherId}/upcoming")
    public ResponseEntity<List<LessonPlan>> getUpcomingByTeacher(@PathVariable UUID teacherId) {
        return ResponseEntity.ok(lessonPlanRepository.findUpcomingByTeacher(teacherId, LocalDate.now()));
    }

    @GetMapping("/class/{classId}/upcoming")
    public ResponseEntity<List<LessonPlan>> getUpcomingByClass(@PathVariable UUID classId) {
        return ResponseEntity.ok(lessonPlanRepository.findUpcomingByClass(classId, LocalDate.now()));
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<LessonPlan>> getLessonPlansByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(lessonPlanRepository.findByPlanDate(date));
    }

    @GetMapping("/curriculum/{curriculumId}")
    public ResponseEntity<List<LessonPlan>> getLessonPlansByCurriculum(@PathVariable UUID curriculumId) {
        return ResponseEntity.ok(lessonPlanRepository.findByCurriculumId(curriculumId));
    }

    @GetMapping("/module/{moduleId}")
    public ResponseEntity<List<LessonPlan>> getLessonPlansByModule(@PathVariable UUID moduleId) {
        return ResponseEntity.ok(lessonPlanRepository.findByModuleId(moduleId));
    }

    @GetMapping("/lesson/{lessonId}")
    public ResponseEntity<List<LessonPlan>> getLessonPlansByLesson(@PathVariable UUID lessonId) {
        return ResponseEntity.ok(lessonPlanRepository.findByLessonId(lessonId));
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<LessonPlan>> getLessonPlansBySession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(lessonPlanRepository.findBySessionId(sessionId));
    }

    @GetMapping("/term/{term}/class/{classId}")
    public ResponseEntity<List<LessonPlan>> getLessonPlansByTermAndClass(
            @PathVariable String term, @PathVariable UUID classId) {
        return ResponseEntity.ok(lessonPlanRepository.findByTermAndClassId(term, classId));
    }

    @GetMapping("/teacher/{teacherId}/stats")
    public ResponseEntity<Map<String, Object>> getTeacherStats(@PathVariable UUID teacherId) {
        long total = lessonPlanRepository.findByTeacherId(teacherId).size();
        long draft = lessonPlanRepository.countByTeacherIdAndStatus(teacherId, "DRAFT");
        long submitted = lessonPlanRepository.countByTeacherIdAndStatus(teacherId, "SUBMITTED");
        long approved = lessonPlanRepository.countByTeacherIdAndStatus(teacherId, "APPROVED");
        long completed = lessonPlanRepository.countByTeacherIdAndStatus(teacherId, "COMPLETED");
        return ResponseEntity.ok(Map.of(
                "total", total,
                "draft", draft,
                "submitted", submitted,
                "approved", approved,
                "completed", completed
        ));
    }

    @PostMapping
    public ResponseEntity<LessonPlan> createLessonPlan(@Valid @RequestBody LessonPlan lessonPlan) {
        if (lessonPlan.getStatus() == null) {
            lessonPlan.setStatus("DRAFT");
        }
        return ResponseEntity.ok(lessonPlanRepository.save(lessonPlan));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<LessonPlan>> createBulkLessonPlans(@Valid @RequestBody List<LessonPlan> lessonPlans) {
        lessonPlans.forEach(lp -> {
            if (lp.getStatus() == null) lp.setStatus("DRAFT");
        });
        return ResponseEntity.ok(lessonPlanRepository.saveAll(lessonPlans));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LessonPlan> updateLessonPlan(@PathVariable UUID id, @Valid @RequestBody LessonPlan details) {
        return lessonPlanRepository.findById(id).map(plan -> {
            // Core fields
            if (details.getTitle() != null) plan.setTitle(details.getTitle());
            if (details.getTitleVi() != null) plan.setTitleVi(details.getTitleVi());
            if (details.getPlanDate() != null) plan.setPlanDate(details.getPlanDate());
            if (details.getWeekNumber() != null) plan.setWeekNumber(details.getWeekNumber());
            if (details.getTerm() != null) plan.setTerm(details.getTerm());
            if (details.getSubject() != null) plan.setSubject(details.getSubject());
            if (details.getGradeLevel() != null) plan.setGradeLevel(details.getGradeLevel());

            // Linking
            if (details.getSessionId() != null) plan.setSessionId(details.getSessionId());
            if (details.getCurriculumId() != null) plan.setCurriculumId(details.getCurriculumId());
            if (details.getModuleId() != null) plan.setModuleId(details.getModuleId());
            if (details.getLessonId() != null) plan.setLessonId(details.getLessonId());
            if (details.getCenterId() != null) plan.setCenterId(details.getCenterId());

            // Objectives
            if (details.getObjectives() != null) plan.setObjectives(details.getObjectives());
            if (details.getObjectivesVi() != null) plan.setObjectivesVi(details.getObjectivesVi());
            if (details.getLearningOutcomes() != null) plan.setLearningOutcomes(details.getLearningOutcomes());
            if (details.getLearningOutcomesVi() != null) plan.setLearningOutcomesVi(details.getLearningOutcomesVi());

            // Activities
            if (details.getWarmUpActivity() != null) plan.setWarmUpActivity(details.getWarmUpActivity());
            if (details.getWarmUpActivityVi() != null) plan.setWarmUpActivityVi(details.getWarmUpActivityVi());
            if (details.getWarmUpDurationMinutes() != null) plan.setWarmUpDurationMinutes(details.getWarmUpDurationMinutes());
            if (details.getMainActivity() != null) plan.setMainActivity(details.getMainActivity());
            if (details.getMainActivityVi() != null) plan.setMainActivityVi(details.getMainActivityVi());
            if (details.getMainActivityDurationMinutes() != null) plan.setMainActivityDurationMinutes(details.getMainActivityDurationMinutes());
            if (details.getPracticeActivity() != null) plan.setPracticeActivity(details.getPracticeActivity());
            if (details.getPracticeActivityVi() != null) plan.setPracticeActivityVi(details.getPracticeActivityVi());
            if (details.getPracticeDurationMinutes() != null) plan.setPracticeDurationMinutes(details.getPracticeDurationMinutes());
            if (details.getCoolDownActivity() != null) plan.setCoolDownActivity(details.getCoolDownActivity());
            if (details.getCoolDownActivityVi() != null) plan.setCoolDownActivityVi(details.getCoolDownActivityVi());
            if (details.getCoolDownDurationMinutes() != null) plan.setCoolDownDurationMinutes(details.getCoolDownDurationMinutes());
            if (details.getTotalDurationMinutes() != null) plan.setTotalDurationMinutes(details.getTotalDurationMinutes());

            // Materials
            if (details.getMaterialsNeeded() != null) plan.setMaterialsNeeded(details.getMaterialsNeeded());
            if (details.getMaterialsNeededVi() != null) plan.setMaterialsNeededVi(details.getMaterialsNeededVi());
            if (details.getTextbookPages() != null) plan.setTextbookPages(details.getTextbookPages());
            if (details.getPowerpointUrl() != null) plan.setPowerpointUrl(details.getPowerpointUrl());
            if (details.getPowerpointName() != null) plan.setPowerpointName(details.getPowerpointName());
            if (details.getWorksheetUrl() != null) plan.setWorksheetUrl(details.getWorksheetUrl());
            if (details.getWorksheetName() != null) plan.setWorksheetName(details.getWorksheetName());
            if (details.getVideoUrl() != null) plan.setVideoUrl(details.getVideoUrl());
            if (details.getAudioUrl() != null) plan.setAudioUrl(details.getAudioUrl());
            if (details.getAdditionalResources() != null) plan.setAdditionalResources(details.getAdditionalResources());

            // Assessment & Homework
            if (details.getAssessmentMethod() != null) plan.setAssessmentMethod(details.getAssessmentMethod());
            if (details.getAssessmentMethodVi() != null) plan.setAssessmentMethodVi(details.getAssessmentMethodVi());
            if (details.getHomeworkDescription() != null) plan.setHomeworkDescription(details.getHomeworkDescription());
            if (details.getHomeworkDescriptionVi() != null) plan.setHomeworkDescriptionVi(details.getHomeworkDescriptionVi());
            if (details.getHomeworkDueDate() != null) plan.setHomeworkDueDate(details.getHomeworkDueDate());

            // Differentiation
            if (details.getDifferentiationNotes() != null) plan.setDifferentiationNotes(details.getDifferentiationNotes());
            if (details.getAdvancedLearnersNotes() != null) plan.setAdvancedLearnersNotes(details.getAdvancedLearnersNotes());
            if (details.getStrugglingLearnersNotes() != null) plan.setStrugglingLearnersNotes(details.getStrugglingLearnersNotes());

            // Reflection
            if (details.getTeacherReflection() != null) plan.setTeacherReflection(details.getTeacherReflection());
            if (details.getTeacherReflectionVi() != null) plan.setTeacherReflectionVi(details.getTeacherReflectionVi());
            if (details.getWhatWentWell() != null) plan.setWhatWentWell(details.getWhatWentWell());
            if (details.getAreasForImprovement() != null) plan.setAreasForImprovement(details.getAreasForImprovement());

            // Status
            if (details.getStatus() != null) plan.setStatus(details.getStatus());

            return ResponseEntity.ok(lessonPlanRepository.save(plan));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ==================== WORKFLOW ====================

    @PatchMapping("/{id}/submit")
    public ResponseEntity<LessonPlan> submitForApproval(@PathVariable UUID id) {
        return lessonPlanRepository.findById(id).map(plan -> {
            plan.setStatus("SUBMITTED");
            LessonPlan saved = lessonPlanRepository.save(plan);
            auditWriter.log("LESSON_PLAN_SUBMITTED", "LessonPlan", id, null, null,
                    "{\"status\":\"SUBMITTED\"}");
            // Notify admin/coordinator for approval
            try {
                notificationClient.notifyApprovalRequired(
                        plan.getCenterId() != null ? plan.getCenterId() : plan.getTeacherId(),
                        "Lesson Plan",
                        "Teacher",
                        plan.getTitle() + " for " + plan.getPlanDate(),
                        "lesson_plan",
                        plan.getId()
                );
            } catch (Exception e) {
                // Don't fail the submit if notification fails
            }
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<LessonPlan> approveLessonPlan(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID approvedBy) {
        return lessonPlanRepository.findById(id).map(plan -> {
            plan.setStatus("APPROVED");
            plan.setApprovedBy(approvedBy);
            plan.setApprovedAt(LocalDateTime.now());
            LessonPlan saved = lessonPlanRepository.save(plan);
            auditWriter.log("LESSON_PLAN_APPROVED", "LessonPlan", id, approvedBy, null,
                    "{\"status\":\"APPROVED\"}");
            // Notify teacher of approval
            try {
                notificationClient.notifyApprovalCompleted(
                        plan.getTeacherId(), "Lesson Plan", true,
                        "Admin", null, "lesson_plan", plan.getId()
                );
            } catch (Exception e) {
                // Don't fail
            }
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<LessonPlan> rejectLessonPlan(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) UUID rejectedBy) {
        return lessonPlanRepository.findById(id).map(plan -> {
            plan.setStatus("DRAFT"); // Send back to draft for revision
            LessonPlan saved = lessonPlanRepository.save(plan);
            String json = "{\"status\":\"DRAFT\"" +
                    (reason != null ? ",\"reason\":\"" + reason.replace("\"", "\\\"") + "\"" : "") +
                    "}";
            auditWriter.log("LESSON_PLAN_REJECTED", "LessonPlan", id, rejectedBy, null, json);
            try {
                notificationClient.notifyApprovalCompleted(
                        plan.getTeacherId(), "Lesson Plan", false,
                        "Admin", reason, "lesson_plan", plan.getId()
                );
            } catch (Exception e) {
                // Don't fail
            }
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/start")
    public ResponseEntity<LessonPlan> startLesson(@PathVariable UUID id) {
        return lessonPlanRepository.findById(id).map(plan -> {
            plan.setStatus("IN_PROGRESS");
            return ResponseEntity.ok(lessonPlanRepository.save(plan));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<LessonPlan> completeLesson(@PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> reflection) {
        return lessonPlanRepository.findById(id).map(plan -> {
            plan.setStatus("COMPLETED");
            if (reflection != null) {
                if (reflection.get("teacherReflection") != null) {
                    plan.setTeacherReflection(reflection.get("teacherReflection"));
                }
                if (reflection.get("whatWentWell") != null) {
                    plan.setWhatWentWell(reflection.get("whatWentWell"));
                }
                if (reflection.get("areasForImprovement") != null) {
                    plan.setAreasForImprovement(reflection.get("areasForImprovement"));
                }
            }
            return ResponseEntity.ok(lessonPlanRepository.save(plan));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/reflection")
    public ResponseEntity<LessonPlan> addReflection(@PathVariable UUID id,
            @Valid @RequestBody Map<String, String> reflection) {
        return lessonPlanRepository.findById(id).map(plan -> {
            if (reflection.get("teacherReflection") != null) {
                plan.setTeacherReflection(reflection.get("teacherReflection"));
            }
            if (reflection.get("teacherReflectionVi") != null) {
                plan.setTeacherReflectionVi(reflection.get("teacherReflectionVi"));
            }
            if (reflection.get("whatWentWell") != null) {
                plan.setWhatWentWell(reflection.get("whatWentWell"));
            }
            if (reflection.get("areasForImprovement") != null) {
                plan.setAreasForImprovement(reflection.get("areasForImprovement"));
            }
            return ResponseEntity.ok(lessonPlanRepository.save(plan));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLessonPlan(@PathVariable UUID id) {
        if (lessonPlanRepository.existsById(id)) {
            lessonPlanRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
