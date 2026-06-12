package com.lera.ai_gateway.service;

import com.lera.ai_gateway.entity.AiRecommendation;
import com.lera.ai_gateway.repository.AiRecommendationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AiRecommendationService {
    private final AiRecommendationRepository repo;

    public Page<AiRecommendation> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<AiRecommendation> getById(UUID id) { return repo.findById(id); }
    public List<AiRecommendation> getByStudent(UUID studentId) { return repo.findByStudentId(studentId); }
    public List<AiRecommendation> getByType(String type) { return repo.findByRecommendationType(type); }
    public List<AiRecommendation> getByStatus(String status) { return repo.findByStatus(status); }

    @Transactional public AiRecommendation save(AiRecommendation entity) { return repo.save(entity); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
