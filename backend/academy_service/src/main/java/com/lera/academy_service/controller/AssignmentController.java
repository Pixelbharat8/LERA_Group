package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyAuthorizationService;
import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.security.CurrentUser;
import com.lera.academy_service.entity.Assignment;
import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.entity.Student;
import com.lera.academy_service.repository.AssignmentRepository;
import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.repository.StudentRepository;
import com.lera.academy_service.repository.TeacherRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Assignments and homework: list routes apply role-aware filtering (staff, teacher/TA scoping, student, parent).
 */
@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentRepository assignmentRepository;
    private final ClassRepository classRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final AcademyAuthorizationService authz;

    private static boolean isTeacherLikeRole(String role) {
        if (role == null) {
            return false;
        }
        return switch (role.toUpperCase()) {
            case "TEACHER", "TEACHING_ASSISTANT", "TA" -> true;
            default -> false;
        };
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllAssignments(
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) Long teacherId,
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        if (studentId != null) {
            authz.assertCanViewStudent(studentId);
            return ResponseEntity.ok(assignmentRepository.findByStudentId(studentId));
        }
        if (CurrentUser.isStaff()) {
            if (centerId != null) {
                UUID effCenter = authz.effectiveListCenterId(centerId);
                List<Assignment> assignments = new ArrayList<>();
                for (ClassEntity clazz : classRepository.findByCenterId(effCenter)) {
                    assignments.addAll(assignmentRepository.findByClassId(clazz.getId()));
                }
                return ResponseEntity.ok(assignments);
            }
            if (classId != null) {
                return ResponseEntity.ok(assignmentRepository.findByClassId(classId));
            }
            if (teacherId != null) {
                return ResponseEntity.ok(assignmentRepository.findByCreatedBy(teacherId));
            }
            String userRole = CurrentUser.role();
            if (isTeacherLikeRole(userRole)) {
                UUID uid = CurrentUser.id().orElse(null);
                if (uid != null) {
                    return teacherRepository.findByUserId(uid)
                            .map(t -> ResponseEntity.ok(
                                    assignmentRepository.findForTeacherAssignedClasses(t.getId())))
                            .orElse(ResponseEntity.ok(List.of()));
                }
                return ResponseEntity.ok(List.of());
            }
            if (!authz.isOrgWide()) {
                throw new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Specify classId, studentId, or use /api/assignments/teacher/{id} unless you have an org-wide role");
            }
            return ResponseEntity.ok(assignmentRepository.findAll());
        }

        String userRole = CurrentUser.role();
        if (classId != null || teacherId != null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        if (userRole != null && "STUDENT".equalsIgnoreCase(userRole)) {
            return studentRepository.findByUserId(CurrentUser.id().orElse(null))
                    .map(s -> ResponseEntity.ok(assignmentRepository.findByStudentId(s.getId())))
                    .orElse(ResponseEntity.ok(List.of()));
        }
        if (userRole != null && "PARENT".equalsIgnoreCase(userRole)) {
            UUID uid = CurrentUser.id().orElse(null);
            if (uid == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            return ResponseEntity.ok(mergeAssignmentsForParentChildren(uid));
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Assignment> getAssignmentById(@PathVariable Long id) {
        return assignmentRepository.findById(id)
                .filter(this::canLearnerOrStaffReadAssignment)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/class/{classId}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<List<Assignment>> getAssignmentsByClass(@PathVariable UUID classId) {
        return ResponseEntity.ok(assignmentRepository.findByClassId(classId));
    }

    @GetMapping("/teacher/{teacherId}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<List<Assignment>> getAssignmentsByTeacher(@PathVariable Long teacherId) {
        return ResponseEntity.ok(assignmentRepository.findByCreatedBy(teacherId));
    }

    @GetMapping("/type/{type}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<List<Assignment>> getAssignmentsByType(@PathVariable String type) {
        return ResponseEntity.ok(assignmentRepository.findByAssignmentType(type));
    }

    /**
     * Get all homework assignments (assignmentType = HOMEWORK)
     * Used by the Homework management page
     */
    @GetMapping("/homework")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllHomework(@RequestParam(required = false) UUID classId) {
        if (!CurrentUser.isStaff()) {
            String userRole = CurrentUser.role();
            if (classId != null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (userRole != null && "STUDENT".equalsIgnoreCase(userRole)) {
                Optional<Student> me = studentRepository.findByUserId(CurrentUser.id().orElse(null));
                if (me.isEmpty()) {
                    return ResponseEntity.ok(List.of());
                }
                return ResponseEntity.ok(assignmentRepository.findHomeworkByStudentId(me.get().getId()));
            }
            if (userRole != null && "PARENT".equalsIgnoreCase(userRole)) {
                UUID uid = CurrentUser.id().orElse(null);
                if (uid == null) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
                List<Assignment> merged = new ArrayList<>();
                Set<Long> seen = new HashSet<>();
                for (Student ch : studentRepository.findByParentId(uid)) {
                    for (Assignment a : assignmentRepository.findHomeworkByStudentId(ch.getId())) {
                        if (seen.add(a.getId())) {
                            merged.add(a);
                        }
                    }
                }
                return ResponseEntity.ok(merged);
            }
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String userRole = CurrentUser.role();
        if (isTeacherLikeRole(userRole)) {
            UUID uid = CurrentUser.id().orElse(null);
            if (uid != null) {
                return teacherRepository.findByUserId(uid).map(t -> {
                    List<Assignment> list = assignmentRepository.findHomeworkForTeacherClasses(t.getId());
                    if (classId != null) {
                        list = list.stream().filter(a -> classId.equals(a.getClassId())).toList();
                    }
                    return ResponseEntity.ok(list);
                }).orElse(ResponseEntity.ok(List.of()));
            }
            return ResponseEntity.ok(List.of());
        }
        if (classId != null) {
            return ResponseEntity.ok(assignmentRepository.findByClassIdAndAssignmentType(classId, "HOMEWORK"));
        }
        return ResponseEntity.ok(assignmentRepository.findByAssignmentType("HOMEWORK"));
    }

    /**
     * Get homework for a student based on their enrolled classes
     */
    @GetMapping("/homework/student/{studentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Assignment>> getStudentHomework(@PathVariable UUID studentId) {
        authz.assertCanViewStudent(studentId);
        return ResponseEntity.ok(assignmentRepository.findHomeworkByStudentId(studentId));
    }

    /**
     * Get assessments (quizzes, exams, projects)
     */
    @GetMapping("/assessments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllAssessments(@RequestParam(required = false) UUID classId) {
        if (!CurrentUser.isStaff()) {
            String userRole = CurrentUser.role();
            if (classId != null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (userRole != null && "STUDENT".equalsIgnoreCase(userRole)) {
                Optional<Student> me = studentRepository.findByUserId(CurrentUser.id().orElse(null));
                if (me.isEmpty()) {
                    return ResponseEntity.ok(List.of());
                }
                List<Assignment> mine = assignmentRepository.findByStudentId(me.get().getId());
                return ResponseEntity.ok(mine.stream()
                        .filter(a -> {
                            String t = a.getAssignmentType();
                            return t != null && (t.equals("QUIZ") || t.equals("PROJECT") || t.equals("EXAM_PREP"));
                        })
                        .toList());
            }
            if (userRole != null && "PARENT".equalsIgnoreCase(userRole)) {
                UUID uid = CurrentUser.id().orElse(null);
                if (uid == null) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
                List<Assignment> merged = new ArrayList<>();
                Set<Long> seen = new HashSet<>();
                for (Student ch : studentRepository.findByParentId(uid)) {
                    for (Assignment a : assignmentRepository.findByStudentId(ch.getId())) {
                        String t = a.getAssignmentType();
                        if (t != null && (t.equals("QUIZ") || t.equals("PROJECT") || t.equals("EXAM_PREP"))
                                && seen.add(a.getId())) {
                            merged.add(a);
                        }
                    }
                }
                return ResponseEntity.ok(merged);
            }
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String userRole = CurrentUser.role();
        if (isTeacherLikeRole(userRole)) {
            UUID uid = CurrentUser.id().orElse(null);
            if (uid != null) {
                return teacherRepository.findByUserId(uid).map(t -> {
                    List<Assignment> list = assignmentRepository.findAssessmentsForTeacherClasses(t.getId());
                    if (classId != null) {
                        list = list.stream().filter(a -> classId.equals(a.getClassId())).toList();
                    }
                    return ResponseEntity.ok(list);
                }).orElse(ResponseEntity.ok(List.of()));
            }
            return ResponseEntity.ok(List.of());
        }
        if (classId != null) {
            return ResponseEntity.ok(assignmentRepository.findAssessmentsByClassId(classId));
        }
        return ResponseEntity.ok(assignmentRepository.findAssessments());
    }

    @PostMapping
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<Assignment> createAssignment(@Valid @RequestBody Assignment assignment) {
        return ResponseEntity.ok(assignmentRepository.save(assignment));
    }

    @PutMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<Assignment> updateAssignment(@PathVariable Long id, @Valid @RequestBody Assignment assignmentDetails) {
        return assignmentRepository.findById(id).map(assignment -> {
            if (assignmentDetails.getTitle() != null) assignment.setTitle(assignmentDetails.getTitle());
            if (assignmentDetails.getTitleVi() != null) assignment.setTitleVi(assignmentDetails.getTitleVi());
            if (assignmentDetails.getDescription() != null) assignment.setDescription(assignmentDetails.getDescription());
            if (assignmentDetails.getDescriptionVi() != null) assignment.setDescriptionVi(assignmentDetails.getDescriptionVi());
            if (assignmentDetails.getInstructions() != null) assignment.setInstructions(assignmentDetails.getInstructions());
            if (assignmentDetails.getInstructionsVi() != null) assignment.setInstructionsVi(assignmentDetails.getInstructionsVi());
            if (assignmentDetails.getDueDate() != null) assignment.setDueDate(assignmentDetails.getDueDate());
            if (assignmentDetails.getMaxScore() != null) assignment.setMaxScore(assignmentDetails.getMaxScore());
            if (assignmentDetails.getPassingScore() != null) assignment.setPassingScore(assignmentDetails.getPassingScore());
            if (assignmentDetails.getIsGraded() != null) assignment.setIsGraded(assignmentDetails.getIsGraded());
            if (assignmentDetails.getLateSubmissionAllowed() != null) assignment.setLateSubmissionAllowed(assignmentDetails.getLateSubmissionAllowed());
            if (assignmentDetails.getLatePenaltyPercentage() != null) assignment.setLatePenaltyPercentage(assignmentDetails.getLatePenaltyPercentage());
            if (assignmentDetails.getAttachmentUrl() != null) assignment.setAttachmentUrl(assignmentDetails.getAttachmentUrl());
            if (assignmentDetails.getAttachmentName() != null) assignment.setAttachmentName(assignmentDetails.getAttachmentName());
            if (assignmentDetails.getAssignmentType() != null) assignment.setAssignmentType(assignmentDetails.getAssignmentType());
            if (assignmentDetails.getDifficultyLevel() != null) assignment.setDifficultyLevel(assignmentDetails.getDifficultyLevel());
            if (assignmentDetails.getEstimatedDurationMinutes() != null) assignment.setEstimatedDurationMinutes(assignmentDetails.getEstimatedDurationMinutes());
            if (assignmentDetails.getRubric() != null) assignment.setRubric(assignmentDetails.getRubric());
            if (assignmentDetails.getRubricVi() != null) assignment.setRubricVi(assignmentDetails.getRubricVi());
            if (assignmentDetails.getIsPublished() != null) assignment.setIsPublished(assignmentDetails.getIsPublished());
            return ResponseEntity.ok(assignmentRepository.save(assignment));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id) {
        if (assignmentRepository.existsById(id)) {
            assignmentRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    private List<Assignment> mergeAssignmentsForParentChildren(UUID parentUserId) {
        List<Assignment> out = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        for (Student ch : studentRepository.findByParentId(parentUserId)) {
            for (Assignment a : assignmentRepository.findByStudentId(ch.getId())) {
                if (seen.add(a.getId())) {
                    out.add(a);
                }
            }
        }
        return out;
    }

    private boolean canLearnerOrStaffReadAssignment(Assignment a) {
        if (CurrentUser.isStaff()) {
            return true;
        }
        return visibleToCurrentLearner(a);
    }

    private boolean visibleToCurrentLearner(Assignment assignment) {
        UUID uid = CurrentUser.id().orElse(null);
        if (uid == null) {
            return false;
        }
        String r = CurrentUser.role();
        if (r != null && "STUDENT".equalsIgnoreCase(r)) {
            return studentRepository.findByUserId(uid)
                    .map(s -> assignmentRepository.findByStudentId(s.getId()).stream()
                            .anyMatch(x -> x.getId().equals(assignment.getId())))
                    .orElse(false);
        }
        if (r != null && "PARENT".equalsIgnoreCase(r)) {
            for (Student ch : studentRepository.findByParentId(uid)) {
                if (assignmentRepository.findByStudentId(ch.getId()).stream()
                        .anyMatch(x -> x.getId().equals(assignment.getId()))) {
                    return true;
                }
            }
        }
        return false;
    }
}
