package com.lera.social_media_service.service;

import com.lera.social_media_service.entity.SocialAnalytics;
import com.lera.social_media_service.repository.SocialAnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SocialAnalyticsService {
    private final SocialAnalyticsRepository repo;

    public Page<SocialAnalytics> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<SocialAnalytics> getById(UUID id) { return repo.findById(id); }
    public List<SocialAnalytics> getByPlatform(String platform) { return repo.findByPlatformOrderByMetricDateDesc(platform); }
    public List<SocialAnalytics> getByDate(LocalDate date) { return repo.findByMetricDate(date); }
    public List<SocialAnalytics> getByDateRange(LocalDate start, LocalDate end) { return repo.findByDateRange(start, end); }
    public List<SocialAnalytics> getByPlatformAndRange(String platform, LocalDate start, LocalDate end) { return repo.findByPlatformAndDateRange(platform, start, end); }

    @Transactional
    public SocialAnalytics save(SocialAnalytics entity) { return repo.save(entity); }

    @Transactional
    public void deleteById(UUID id) { repo.deleteById(id); }
}
