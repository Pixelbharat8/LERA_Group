package com.lera.payment_service.service;

import com.lera.payment_service.entity.LateFeeRule;
import com.lera.payment_service.repository.LateFeeRuleRepository;
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
public class LateFeeRuleService {

    private final LateFeeRuleRepository lateFeeRuleRepository;

    public Page<LateFeeRule> getAllRules(Pageable pageable) {
        return lateFeeRuleRepository.findAll(pageable);
    }

    public Optional<LateFeeRule> getRuleById(UUID id) {
        return lateFeeRuleRepository.findById(id);
    }

    public List<LateFeeRule> getActiveRules() {
        return lateFeeRuleRepository.findByIsActiveTrue();
    }

    public List<LateFeeRule> getActiveCenterRules(UUID centerId) {
        return lateFeeRuleRepository.findByCenterIdAndIsActiveTrue(centerId);
    }

    public List<LateFeeRule> getRulesByFeeType(String feeType) {
        return lateFeeRuleRepository.findByFeeType(feeType);
    }

    @Transactional
    public LateFeeRule createRule(LateFeeRule rule) {
        log.info("Creating late fee rule: {}", rule.getFeeType());
        return lateFeeRuleRepository.save(rule);
    }

    @Transactional
    public Optional<LateFeeRule> updateRule(UUID id, LateFeeRule rule) {
        return lateFeeRuleRepository.findById(id).map(existing -> {
            rule.setId(id);
            return lateFeeRuleRepository.save(rule);
        });
    }

    @Transactional
    public boolean deleteRule(UUID id) {
        if (lateFeeRuleRepository.existsById(id)) {
            lateFeeRuleRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional
    public Optional<LateFeeRule> toggleActive(UUID id) {
        return lateFeeRuleRepository.findById(id).map(rule -> {
            rule.setIsActive(!rule.getIsActive());
            return lateFeeRuleRepository.save(rule);
        });
    }
}
