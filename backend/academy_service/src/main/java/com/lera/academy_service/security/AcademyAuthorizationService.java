package com.lera.academy_service.security;

import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.entity.ClassSession;
import com.lera.academy_service.entity.Enrollment;
import com.lera.academy_service.entity.Student;
import com.lera.academy_service.entity.Teacher;
import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.repository.ClassSessionRepository;
import com.lera.academy_service.repository.EnrollmentRepository;
import com.lera.academy_service.repository.StudentParentRepository;
import com.lera.academy_service.repository.StudentRepository;
import com.lera.academy_service.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Centralised checks for student/center/class scoped data — closes IDOR on APIs that
 * mix staff and family roles.
 */
@Service
@RequiredArgsConstructor
public class AcademyAuthorizationService {

    private static final Set<String> ORG_WIDE = Set.of(
            "SUPER_ADMIN", "SUPERADMIN", "CHAIRMAN", "CEO", "DIRECTOR");

    private final StudentRepository studentRepository;
    private final StudentParentRepository studentParentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ClassRepository classRepository;
    private final ClassSessionRepository classSessionRepository;
    private final TeacherRepository teacherRepository;

    public void assertStaff() {
        if (!CurrentUser.isStaff()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    public boolean isOrgWide() {
        String role = CurrentUser.role();
        return role != null && ORG_WIDE.contains(role.toUpperCase());
    }

    /**
     * Centre-scoping for STAFF in a multi-centre deployment:
     * org-wide roles see everything; a centre-bound staff member (their JWT carries a
     * {@code centerId}) may only access entities in their own centre. Staff whose token
     * carries no centre claim are treated as broad (org-level) and allowed through.
     * Callers must have already established that the current user is staff.
     */
    private boolean staffCanAccessCenter(UUID entityCenterId) {
        if (isOrgWide()) {
            return true;
        }
        UUID jwtCenter = CurrentUser.get().map(AuthUser::getCenterId).orElse(null);
        if (jwtCenter == null) {
            return true;
        }
        return jwtCenter.equals(entityCenterId);
    }

    /**
     * List endpoints: org-wide may omit {@code centerId}; center-bound staff use JWT center;
     * other staff must pass an explicit {@code centerId} they are allowed to access.
     */
    public UUID effectiveListCenterId(UUID requestedCenterId) {
        if (isOrgWide()) {
            return requestedCenterId;
        }
        UUID jwtCenter = CurrentUser.get().map(AuthUser::getCenterId).orElse(null);
        if (jwtCenter != null) {
            if (requestedCenterId != null && !Objects.equals(requestedCenterId, jwtCenter)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot list another center's data");
            }
            return jwtCenter;
        }
        if (requestedCenterId != null) {
            assertStaffOrCenter(requestedCenterId);
            return requestedCenterId;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "centerId is required for this list query unless you have an org-wide role");
    }

    /** Staff or JWT {@code centerId} matches (centre managers). */
    public void assertStaffOrCenter(UUID centerId) {
        if (centerId == null) {
            assertStaff();
            return;
        }
        if (CurrentUser.isStaff()) {
            return;
        }
        UUID jwtCenter = CurrentUser.get().map(AuthUser::getCenterId).orElse(null);
        if (jwtCenter != null && jwtCenter.equals(centerId)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    public boolean canViewStudent(UUID studentId) {
        if (studentId == null) {
            return false;
        }
        if (CurrentUser.isStaff()) {
            // Multi-centre: a centre-bound staff member may only view students in their centre.
            UUID studentCenter = studentRepository.findById(studentId)
                    .map(Student::getCenterId)
                    .orElse(null);
            return staffCanAccessCenter(studentCenter);
        }
        return CurrentUser.id()
                .map(uid -> studentParentRepository.existsByStudentIdAndParentId(studentId, uid)
                        || studentRepository.findById(studentId)
                            .map(s -> uid.equals(s.getUserId()))
                            .orElse(false))
                .orElse(false);
    }

    public void assertCanViewStudent(UUID studentId) {
        if (!canViewStudent(studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    public void assertSelfOrStaffParent(UUID parentUserId) {
        if (parentUserId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (!CurrentUser.isSelfOrStaff(parentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    /**
     * View roster / enrolments for a class: staff, class teacher, or a parent/student
     * linked to any enrolment in that class.
     */
    public void assertCanViewClassRoster(UUID classId) {
        if (classId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (CurrentUser.isStaff()) {
            return;
        }
        ClassEntity clazz = classRepository.findById(classId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        UUID uid = CurrentUser.id().orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        if (isTeacherAssignedToClass(clazz, uid)) {
            return;
        }
        for (Enrollment e : enrollmentRepository.findByClassId(classId)) {
            if (e.getStudentId() != null) {
                if (studentParentRepository.existsByStudentIdAndParentId(e.getStudentId(), uid)) {
                    return;
                }
                if (studentRepository.findById(e.getStudentId())
                        .map(s -> uid.equals(s.getUserId()))
                        .orElse(false)) {
                    return;
                }
            }
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    public void assertCanViewTeacherProfile(UUID teacherId) {
        Teacher t = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (CurrentUser.isStaff() && staffCanAccessCenter(t.getCenterId())) {
            return;
        }
        if (CurrentUser.id().map(u -> u.equals(t.getUserId())).orElse(false)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    /** {@code teacherEntityId} is the {@code teachers.id} row, not the auth user id. */
    public void assertStaffOrOwnTeacherEntity(UUID teacherEntityId) {
        if (teacherEntityId == null) {
            assertStaff();
            return;
        }
        Teacher t = teacherRepository.findById(teacherEntityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (CurrentUser.isStaff() && staffCanAccessCenter(t.getCenterId())) {
            return;
        }
        if (CurrentUser.id().map(u -> u.equals(t.getUserId())).orElse(false)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    public void assertCanViewEnrollment(Enrollment enrollment) {
        if (enrollment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        assertCanViewStudent(enrollment.getStudentId());
    }

    /** LMS session row: staff or anyone who may view the class roster (student / parent). */
    public void assertCanViewClassSession(UUID sessionId) {
        if (sessionId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (CurrentUser.isStaff()) {
            return;
        }
        ClassSession session = classSessionRepository
                .findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        assertCanViewClassRoster(session.getClassId());
    }

    /** {@code clazz.teacherId} / {@code assistantTeacherId} are {@code teachers.id}, not auth user ids. */
    private boolean isTeacherAssignedToClass(ClassEntity clazz, UUID authUserId) {
        return teacherRepository.findByUserId(authUserId)
                .map(t -> {
                    UUID entityId = t.getId();
                    return (clazz.getTeacherId() != null && clazz.getTeacherId().equals(entityId))
                            || (clazz.getAssistantTeacherId() != null
                                    && clazz.getAssistantTeacherId().equals(entityId));
                })
                .orElse(false);
    }
}
