package com.lera.ai_gateway.service;

import com.lera.ai_gateway.entity.AiLearningProgress;
import com.lera.ai_gateway.repository.AiLearningProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AiLearningProgressService {
    private final AiLearningProgressRepository repo;

    public Page<AiLearningProgress> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<AiLearningProgress> getById(UUID id) { return repo.findById(id); }
    public List<AiLearningProgress> getByStudent(UUID studentId) { return repo.findByStudentId(studentId); }
    public List<AiLearningProgress> getByStudentAndSubject(UUID studentId, String subject) { return repo.findByStudentIdAndSubject(studentId, subject); }

    @Transactional public AiLearningProgress save(AiLearningProgress entity) { return repo.save(entity); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
