package com.lera.rule_engine.service;

import com.lera.rule_engine.entity.BusinessRule;
import com.lera.rule_engine.repository.BusinessRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class RuleService {

    private final BusinessRuleRepository ruleRepository;

    @Cacheable(value = "rules", key = "'all'")
    public List<BusinessRule> findAll() {
        return ruleRepository.findAllByOrderByPriorityDesc();
    }

    public Page<BusinessRule> findAll(Pageable pageable) {
        return ruleRepository.findAll(pageable);
    }

    @Cacheable(value = "rules", key = "#id")
    public Optional<BusinessRule> findById(UUID id) {
        return ruleRepository.findById(id);
    }

    @Cacheable(value = "rules", key = "'active'")
    public List<BusinessRule> findActive() {
        return ruleRepository.findByIsActiveTrueOrderByPriorityDesc();
    }

    @Cacheable(value = "rules", key = "'type-' + #ruleType")
    public List<BusinessRule> findByType(String ruleType) {
        return ruleRepository.findByRuleTypeAndIsActiveTrue(ruleType);
    }

    public List<BusinessRule> findByCategory(String category) {
        return ruleRepository.findByCategoryAndIsActiveTrue(category);
    }

    public List<BusinessRule> findByAcademyId(UUID academyId) {
        return ruleRepository.findByAcademyIdAndIsActiveTrue(academyId);
    }

    @Transactional
    @CacheEvict(value = "rules", allEntries = true)
    public BusinessRule create(BusinessRule rule) {
        if (rule.getIsActive() == null) rule.setIsActive(true);
        if (rule.getPriority() == null) rule.setPriority(0);
        rule.setCreatedAt(LocalDateTime.now());
        BusinessRule saved = ruleRepository.save(rule);
        log.info("Created rule id={} name={} type={}", saved.getId(), saved.getRuleName(), saved.getRuleType());
        return saved;
    }

    @Transactional
    @CacheEvict(value = "rules", allEntries = true)
    public Optional<BusinessRule> update(UUID id, BusinessRule details) {
        return ruleRepository.findById(id).map(existing -> {
            if (details.getRuleName() != null) existing.setRuleName(details.getRuleName());
            if (details.getDescription() != null) existing.setDescription(details.getDescription());
            if (details.getRuleType() != null) existing.setRuleType(details.getRuleType());
            if (details.getCategory() != null) existing.setCategory(details.getCategory());
            if (details.getConditionExpression() != null) existing.setConditionExpression(details.getConditionExpression());
            if (details.getActionType() != null) existing.setActionType(details.getActionType());
            if (details.getActionParams() != null) existing.setActionParams(details.getActionParams());
            if (details.getPriority() != null) existing.setPriority(details.getPriority());
            if (details.getIsActive() != null) existing.setIsActive(details.getIsActive());
            if (details.getEffectiveFrom() != null) existing.setEffectiveFrom(details.getEffectiveFrom());
            if (details.getEffectiveUntil() != null) existing.setEffectiveUntil(details.getEffectiveUntil());
            existing.setUpdatedAt(LocalDateTime.now());
            return ruleRepository.save(existing);
        });
    }

    @Transactional
    @CacheEvict(value = "rules", allEntries = true)
    public Optional<BusinessRule> toggleActive(UUID id) {
        return ruleRepository.findById(id).map(rule -> {
            rule.setIsActive(!rule.getIsActive());
            rule.setUpdatedAt(LocalDateTime.now());
            log.info("Toggled rule id={} active={}", id, rule.getIsActive());
            return ruleRepository.save(rule);
        });
    }

    @Transactional
    @CacheEvict(value = "rules", allEntries = true)
    public boolean delete(UUID id) {
        if (ruleRepository.existsById(id)) {
            ruleRepository.deleteById(id);
            log.info("Deleted rule id={}", id);
            return true;
        }
        return false;
    }
}
