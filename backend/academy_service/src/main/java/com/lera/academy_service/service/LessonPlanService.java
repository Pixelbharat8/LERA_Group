package com.lera.academy_service.service;
import com.lera.academy_service.entity.LessonPlan;
import com.lera.academy_service.repository.LessonPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class LessonPlanService {
    private final LessonPlanRepository repo;
    public Page<LessonPlan> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<LessonPlan> getById(UUID id) { return repo.findById(id); }
    @Transactional public LessonPlan save(LessonPlan e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
