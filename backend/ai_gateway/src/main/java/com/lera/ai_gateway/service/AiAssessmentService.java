package com.lera.ai_gateway.service;

import com.lera.ai_gateway.entity.AiAssessment;
import com.lera.ai_gateway.repository.AiAssessmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AiAssessmentService {
    private final AiAssessmentRepository repo;

    public Page<AiAssessment> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<AiAssessment> getById(UUID id) { return repo.findById(id); }
    public List<AiAssessment> getByStudent(UUID studentId) { return repo.findByStudentId(studentId); }
    public List<AiAssessment> getByType(String type) { return repo.findByAssessmentType(type); }
    public List<AiAssessment> getBySubject(String subject) { return repo.findBySubject(subject); }
    public List<AiAssessment> getByStudentAndSubject(UUID studentId, String subject) { return repo.findByStudentIdAndSubject(studentId, subject); }

    @Transactional public AiAssessment save(AiAssessment entity) { return repo.save(entity); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
