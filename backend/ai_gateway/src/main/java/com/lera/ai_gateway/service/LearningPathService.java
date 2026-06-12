package com.lera.ai_gateway.service;

import com.lera.ai_gateway.entity.LearningPath;
import com.lera.ai_gateway.repository.LearningPathRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class LearningPathService {
    private final LearningPathRepository repo;

    public Page<LearningPath> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<LearningPath> getById(UUID id) { return repo.findById(id); }
    public List<LearningPath> getByStudent(UUID studentId) { return repo.findByStudentId(studentId); }
    public List<LearningPath> getByStatus(String status) { return repo.findByStatus(status); }
    public List<LearningPath> getByStudentAndStatus(UUID studentId, String status) { return repo.findByStudentIdAndStatus(studentId, status); }

    @Transactional public LearningPath save(LearningPath entity) { return repo.save(entity); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
