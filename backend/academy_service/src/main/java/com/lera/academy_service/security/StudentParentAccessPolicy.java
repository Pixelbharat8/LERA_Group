package com.lera.academy_service.security;

import com.lera.academy_service.entity.Student;
import com.lera.academy_service.entity.StudentParent;
import com.lera.academy_service.repository.StudentParentRepository;
import com.lera.academy_service.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Shared authorization for {@code StudentParent} reads — used by both
 * {@code /api/student-parents} and {@code /api/parent-students}.
 */
@Component
@RequiredArgsConstructor
public class StudentParentAccessPolicy {

    private final StudentParentRepository studentParentRepository;
    private final StudentRepository studentRepository;

    public boolean canAccessStudentLinkData(UUID studentId) {
        if (CurrentUser.isStaff()) {
            return true;
        }
        return CurrentUser.id()
                .map(uid -> studentParentRepository.existsByStudentIdAndParentId(studentId, uid)
                        || studentRepository.findById(studentId)
                            .map(Student::getUserId)
                            .map(uid::equals)
                            .orElse(false))
                .orElse(false);
    }

    public boolean canAccessStudentParentRow(StudentParent sp) {
        if (CurrentUser.isStaff()) {
            return true;
        }
        return CurrentUser.id()
                .map(uid -> sp.getParentId().equals(uid)
                        || studentParentRepository.existsByStudentIdAndParentId(sp.getStudentId(), uid)
                        || studentRepository.findById(sp.getStudentId())
                            .map(Student::getUserId)
                            .map(uid::equals)
                            .orElse(false))
                .orElse(false);
    }
}
