package com.lera.social_media_service.service;

import com.lera.social_media_service.entity.AdCampaign;
import com.lera.social_media_service.repository.AdCampaignRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AdCampaignService {
    private final AdCampaignRepository repo;

    @Cacheable("adCampaigns")
    public Page<AdCampaign> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<AdCampaign> getById(UUID id) { return repo.findById(id); }
    public List<AdCampaign> getByAccount(UUID accountId) { return repo.findByAdAccountId(accountId); }
    public List<AdCampaign> getByStatus(String status) { return repo.findByStatus(status); }
    public List<AdCampaign> getByObjective(String objective) { return repo.findByObjective(objective); }

    @CacheEvict(value = "adCampaigns", allEntries = true) @Transactional
    public AdCampaign save(AdCampaign entity) { return repo.save(entity); }

    @CacheEvict(value = "adCampaigns", allEntries = true) @Transactional
    public void deleteById(UUID id) { repo.deleteById(id); }
}
