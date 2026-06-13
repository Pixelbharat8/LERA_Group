package com.lera.social_media_service.service;

import com.lera.social_media_service.entity.MarketingCampaign;
import com.lera.social_media_service.repository.MarketingCampaignRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MarketingCampaignService {
    private final MarketingCampaignRepository repo;

    @Cacheable("marketingCampaigns")
    public Page<MarketingCampaign> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<MarketingCampaign> getById(UUID id) { return repo.findById(id); }
    public List<MarketingCampaign> getByStatus(String status) { return repo.findByStatus(status); }
    public List<MarketingCampaign> getByType(String type) { return repo.findByCampaignType(type); }
    public List<MarketingCampaign> getByCreator(UUID createdBy) { return repo.findByCreatedBy(createdBy); }
    public List<MarketingCampaign> getByDateRange(LocalDate start, LocalDate end) { return repo.findByStartDateBetween(start, end); }

    @CacheEvict(value = "marketingCampaigns", allEntries = true) @Transactional
    public MarketingCampaign save(MarketingCampaign entity) { return repo.save(entity); }

    @CacheEvict(value = "marketingCampaigns", allEntries = true) @Transactional
    public void deleteById(UUID id) { repo.deleteById(id); }
}
