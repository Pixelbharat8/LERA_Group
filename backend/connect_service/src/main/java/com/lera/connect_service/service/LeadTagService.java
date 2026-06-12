package com.lera.connect_service.service;

import com.lera.connect_service.entity.LeadTag;
import com.lera.connect_service.repository.LeadTagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class LeadTagService {

    private final LeadTagRepository leadTagRepository;

    @Cacheable(value = "leadTags", key = "'page:' + #pageable.pageNumber")
    public Page<LeadTag> getAll(Pageable pageable) {
        return leadTagRepository.findAll(pageable);
    }

    @Cacheable(value = "leadTags", key = "#id")
    public Optional<LeadTag> getById(UUID id) {
        return leadTagRepository.findById(id);
    }

    @Transactional
    @CacheEvict(value = "leadTags", allEntries = true)
    public LeadTag create(LeadTag tag) {
        log.info("Creating lead tag: {}", tag.getTagName());
        return leadTagRepository.save(tag);
    }

    @Transactional
    @CacheEvict(value = "leadTags", allEntries = true)
    public Optional<LeadTag> update(UUID id, LeadTag details) {
        return leadTagRepository.findById(id).map(tag -> {
            if (details.getTagName() != null) tag.setTagName(details.getTagName());
            if (details.getColorCode() != null) tag.setColorCode(details.getColorCode());
            return leadTagRepository.save(tag);
        });
    }

    @Transactional
    @CacheEvict(value = "leadTags", allEntries = true)
    public boolean delete(UUID id) {
        if (leadTagRepository.existsById(id)) {
            leadTagRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
