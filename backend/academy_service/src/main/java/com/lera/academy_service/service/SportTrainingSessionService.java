package com.lera.academy_service.service;
import com.lera.academy_service.entity.SportTrainingSession;
import com.lera.academy_service.repository.SportTrainingSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class SportTrainingSessionService {
    private final SportTrainingSessionRepository repo;
    public Page<SportTrainingSession> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<SportTrainingSession> getById(UUID id) { return repo.findById(id); }
    @Transactional public SportTrainingSession save(SportTrainingSession e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
