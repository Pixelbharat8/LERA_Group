package com.lera.academy_service.service;

import com.lera.academy_service.entity.StudentParent;
import com.lera.academy_service.repository.StudentParentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentParentService {

    private final StudentParentRepository studentParentRepository;

    @Transactional(readOnly = true)
    public List<StudentParent> getStudentParents(UUID studentId) {
        log.info("Fetching parents for student: {}", studentId);
        return studentParentRepository.findByStudentId(studentId);
    }

    @Transactional(readOnly = true)
    public List<StudentParent> getParentStudents(UUID parentId) {
        log.info("Fetching students for parent: {}", parentId);
        return studentParentRepository.findByParentId(parentId);
    }

    @Transactional
    public StudentParent addParent(UUID studentId, UUID parentId, String relationship, Boolean isPrimary) {
        log.info("Adding parent {} to student {} with relationship {}", parentId, studentId, relationship);
        
        if (studentParentRepository.existsByStudentIdAndParentId(studentId, parentId)) {
            throw new IllegalArgumentException("Parent already linked to this student");
        }
        
        // If setting as primary, remove primary flag from others
        if (Boolean.TRUE.equals(isPrimary)) {
            List<StudentParent> existingParents = studentParentRepository.findByStudentId(studentId);
            existingParents.forEach(sp -> {
                sp.setIsPrimary(false);
                studentParentRepository.save(sp);
            });
        }
        
        StudentParent studentParent = StudentParent.builder()
            .studentId(studentId)
            .parentId(parentId)
            .relationship(relationship)
            .isPrimary(isPrimary != null ? isPrimary : false)
            .isEmergencyContact(true)
            .canPickup(true)
            .createdAt(LocalDateTime.now())
            .build();
        
        return studentParentRepository.save(studentParent);
    }

    @Transactional
    public void removeParent(UUID studentId, UUID parentId) {
        log.info("Removing parent {} from student {}", parentId, studentId);
        
        if (!studentParentRepository.existsByStudentIdAndParentId(studentId, parentId)) {
            throw new IllegalArgumentException("Parent not linked to this student");
        }
        
        studentParentRepository.deleteByStudentIdAndParentId(studentId, parentId);
    }

    @Transactional
    public StudentParent updateParentRelationship(UUID id, String relationship, Boolean isPrimary, 
                                                  Boolean isEmergencyContact, Boolean canPickup) {
        StudentParent studentParent = studentParentRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Student-parent relationship not found"));
        
        studentParent.setRelationship(relationship);
        studentParent.setIsPrimary(isPrimary);
        studentParent.setIsEmergencyContact(isEmergencyContact);
        studentParent.setCanPickup(canPickup);
        
        return studentParentRepository.save(studentParent);
    }

    @Transactional(readOnly = true)
    public StudentParent getPrimaryParent(UUID studentId) {
        return studentParentRepository.findByStudentIdAndIsPrimaryTrue(studentId)
            .stream()
            .findFirst()
            .orElse(null);
    }
}
