package com.lera.social_media_service.service;

import com.lera.social_media_service.entity.SocialMediaPost;
import com.lera.social_media_service.repository.SocialMediaPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SocialMediaPostService {
    private final SocialMediaPostRepository repo;

    public Page<SocialMediaPost> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<SocialMediaPost> getById(UUID id) { return repo.findById(id); }
    public List<SocialMediaPost> getByStatus(String status) { return repo.findByStatusOrderByScheduledAtDesc(status); }
    public List<SocialMediaPost> getByCreator(UUID createdBy) { return repo.findByCreatedBy(createdBy); }
    public List<SocialMediaPost> getByCampaign(UUID campaignId) { return repo.findByCampaignId(campaignId); }
    public List<SocialMediaPost> getScheduledBetween(LocalDateTime start, LocalDateTime end) { return repo.findByScheduledAtBetweenOrderByScheduledAtAsc(start, end); }

    @Transactional
    public SocialMediaPost save(SocialMediaPost entity) { return repo.save(entity); }

    @Transactional
    public void deleteById(UUID id) { repo.deleteById(id); }
}
