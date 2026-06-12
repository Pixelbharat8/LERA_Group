package com.lera.connect_service.service;

import com.lera.connect_service.entity.ContentModerationRule;
import com.lera.connect_service.repository.ContentModerationRuleRepository;
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
public class ContentModerationRuleService {

    private final ContentModerationRuleRepository ruleRepository;

    @Cacheable(value = "moderationRules", key = "'page:' + #pageable.pageNumber")
    public Page<ContentModerationRule> getAll(Pageable pageable) {
        return ruleRepository.findAll(pageable);
    }

    public Optional<ContentModerationRule> getById(UUID id) {
        return ruleRepository.findById(id);
    }

    @Transactional
    @CacheEvict(value = "moderationRules", allEntries = true)
    public ContentModerationRule create(ContentModerationRule rule) {
        log.info("Creating content moderation rule");
        return ruleRepository.save(rule);
    }

    @Transactional
    @CacheEvict(value = "moderationRules", allEntries = true)
    public boolean delete(UUID id) {
        if (ruleRepository.existsById(id)) {
            ruleRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
