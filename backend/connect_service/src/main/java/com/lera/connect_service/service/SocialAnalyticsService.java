package com.lera.connect_service.service;

import com.lera.connect_service.entity.SocialAnalytics;
import com.lera.connect_service.repository.SocialAnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class SocialAnalyticsService {
    private final SocialAnalyticsRepository repo;

    public Page<SocialAnalytics> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<SocialAnalytics> getById(UUID id) { return repo.findById(id); }

    @Transactional public SocialAnalytics save(SocialAnalytics entity) { return repo.save(entity); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
