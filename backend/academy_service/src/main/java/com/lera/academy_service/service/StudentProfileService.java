package com.lera.academy_service.service;
import com.lera.academy_service.entity.*;
import com.lera.academy_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.*;
@Service @RequiredArgsConstructor
public class StudentProfileService {
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentDocumentRepository studentDocumentRepository;

    public Optional<Student> getStudentById(UUID id) { return studentRepository.findById(id); }
    public List<Enrollment> getEnrollmentsByStudentId(UUID studentId) {
        return enrollmentRepository.findByStudentId(studentId);
    }
    public List<StudentDocument> getDocumentsByStudentId(UUID studentId) {
        return studentDocumentRepository.findByStudentId(studentId);
    }
}
