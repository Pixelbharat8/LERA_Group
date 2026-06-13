package com.lera.academy_service.service;
import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.entity.ClassSession;
import com.lera.academy_service.entity.Enrollment;
import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.repository.ClassSessionRepository;
import com.lera.academy_service.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
@Service @RequiredArgsConstructor
public class ClassProfileService {
    private final ClassRepository classRepo;
    private final EnrollmentRepository enrollmentRepo;
    private final ClassSessionRepository sessionRepo;
    public Optional<ClassEntity> getClassById(UUID id) { return classRepo.findById(id); }
    public List<Enrollment> getEnrollmentsByClass(UUID classId) { return enrollmentRepo.findByClassId(classId); }
    public List<ClassSession> getSessionsByClass(UUID classId) { return sessionRepo.findByClassId(classId); }
}
