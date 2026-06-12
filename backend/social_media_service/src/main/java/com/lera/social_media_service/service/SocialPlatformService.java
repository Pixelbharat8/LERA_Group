package com.lera.social_media_service.service;

import com.lera.social_media_service.entity.SocialPlatform;
import com.lera.social_media_service.repository.SocialPlatformRepository;
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
public class SocialPlatformService {
    private final SocialPlatformRepository repo;

    @Cacheable("socialPlatforms")
    public Page<SocialPlatform> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<SocialPlatform> getById(UUID id) { return repo.findById(id); }
    public Optional<SocialPlatform> getByName(String name) { return repo.findByPlatformName(name); }
    public List<SocialPlatform> getActive() { return repo.findByIsActiveTrueOrderByPlatformName(); }
    public List<SocialPlatform> getConnected() { return repo.findByIsConnectedTrue(); }

    @CacheEvict(value = "socialPlatforms", allEntries = true) @Transactional
    public SocialPlatform save(SocialPlatform entity) { return repo.save(entity); }

    @CacheEvict(value = "socialPlatforms", allEntries = true) @Transactional
    public void deleteById(UUID id) { repo.deleteById(id); }
}
