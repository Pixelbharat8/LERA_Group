package com.lera.payment_service.service;

import com.lera.payment_service.entity.FeeRule;
import com.lera.payment_service.repository.FeeRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class FeeRuleService {

    private final FeeRuleRepository feeRuleRepository;

    public Page<FeeRule> getAllRules(Pageable pageable) {
        return feeRuleRepository.findAll(pageable);
    }

    public Optional<FeeRule> getRuleById(UUID id) {
        return feeRuleRepository.findById(id);
    }

    public List<FeeRule> getActiveRules() {
        return feeRuleRepository.findByIsActiveTrue();
    }

    public List<FeeRule> getRulesByCategory(String category) {
        return feeRuleRepository.findByCategory(category);
    }

    public List<FeeRule> getRulesByCenter(UUID centerId) {
        return feeRuleRepository.findByCenterId(centerId);
    }

    public List<FeeRule> getRulesByCourse(UUID courseId) {
        return feeRuleRepository.findByCourseId(courseId);
    }

    public List<FeeRule> getRulesByScope(String scope) {
        return feeRuleRepository.findByScope(scope);
    }

    public List<FeeRule> getActiveCenterRules(UUID centerId) {
        return feeRuleRepository.findByCenterIdAndIsActiveTrue(centerId);
    }

    @Transactional
    public FeeRule createRule(FeeRule rule) {
        log.info("Creating fee rule: {}", rule.getCategory());
        return feeRuleRepository.save(rule);
    }

    @Transactional
    public Optional<FeeRule> updateRule(UUID id, FeeRule rule) {
        return feeRuleRepository.findById(id).map(existing -> {
            rule.setId(id);
            return feeRuleRepository.save(rule);
        });
    }

    @Transactional
    public boolean deleteRule(UUID id) {
        if (feeRuleRepository.existsById(id)) {
            feeRuleRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional
    public Optional<FeeRule> toggleActive(UUID id) {
        return feeRuleRepository.findById(id).map(rule -> {
            rule.setIsActive(!Boolean.TRUE.equals(rule.getIsActive()));
            rule.setUpdatedAt(java.time.LocalDateTime.now());
            return feeRuleRepository.save(rule);
        });
    }
}
