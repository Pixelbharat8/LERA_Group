package com.lera.social_media_service.service;

import com.lera.social_media_service.entity.HashtagGroup;
import com.lera.social_media_service.repository.HashtagGroupRepository;
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
public class HashtagGroupService {
    private final HashtagGroupRepository hashtagGroupRepository;

    @Cacheable("hashtagGroups")
    public Page<HashtagGroup> getAll(Pageable pageable) { return hashtagGroupRepository.findAll(pageable); }
    public Optional<HashtagGroup> getById(UUID id) { return hashtagGroupRepository.findById(id); }
    public List<HashtagGroup> getActive() { return hashtagGroupRepository.findByIsActiveTrueOrderByUseCountDesc(); }
    public List<HashtagGroup> getByCategory(String category) { return hashtagGroupRepository.findByCategory(category); }

    @CacheEvict(value = "hashtagGroups", allEntries = true)
    @Transactional
    public HashtagGroup save(HashtagGroup entity) { return hashtagGroupRepository.save(entity); }

    @CacheEvict(value = "hashtagGroups", allEntries = true)
    @Transactional
    public void deleteById(UUID id) { hashtagGroupRepository.deleteById(id); }
}
