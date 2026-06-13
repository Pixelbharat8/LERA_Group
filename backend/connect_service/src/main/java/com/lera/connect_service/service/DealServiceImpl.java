package com.lera.connect_service.service;

import com.lera.connect_service.entity.Deal;
import com.lera.connect_service.repository.DealRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DealServiceImpl {

    private final DealRepository dealRepository;

    @Cacheable(value = "deals", key = "'all'")
    public List<Deal> getAll() {
        return dealRepository.findByOrderByCreatedAtDesc();
    }

    @Cacheable(value = "deals", key = "'center:' + #centerId")
    public List<Deal> getByCenterId(UUID centerId) {
        return dealRepository.findByCenterId(centerId);
    }

    public List<Deal> getByCenterIdAndStage(UUID centerId, String stage) {
        return dealRepository.findByCenterIdAndStage(centerId, stage);
    }

    public List<Deal> getByStage(String stage) {
        return dealRepository.findByStage(stage);
    }

    @Cacheable(value = "deals", key = "#id")
    public Optional<Deal> getById(UUID id) {
        return dealRepository.findById(id);
    }

    public List<Deal> getByLeadId(UUID leadId) {
        return dealRepository.findByLeadId(leadId);
    }

    @Transactional
    @CacheEvict(value = "deals", allEntries = true)
    public Deal create(Deal deal) {
        log.info("Creating deal: {}", deal.getTitle());
        return dealRepository.save(deal);
    }

    @Transactional
    @CacheEvict(value = "deals", allEntries = true)
    public Optional<Deal> update(UUID id, Deal details) {
        return dealRepository.findById(id).map(deal -> {
            if (details.getTitle() != null) deal.setTitle(details.getTitle());
            if (details.getDealCode() != null) deal.setDealCode(details.getDealCode());
            if (details.getLeadId() != null) deal.setLeadId(details.getLeadId());
            if (details.getValue() != null) deal.setValue(details.getValue());
            if (details.getStage() != null) deal.setStage(details.getStage());
            if (details.getProbability() != null) deal.setProbability(details.getProbability());
            if (details.getExpectedCloseDate() != null) deal.setExpectedCloseDate(details.getExpectedCloseDate());
            if (details.getNotes() != null) deal.setNotes(details.getNotes());
            if (details.getAssignedTo() != null) deal.setAssignedTo(details.getAssignedTo());
            return dealRepository.save(deal);
        });
    }

    @Transactional
    @CacheEvict(value = "deals", allEntries = true)
    public boolean delete(UUID id) {
        if (dealRepository.existsById(id)) {
            dealRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional
    @CacheEvict(value = "deals", allEntries = true)
    public Optional<Deal> updateStage(UUID id, String stage) {
        return dealRepository.findById(id).map(deal -> {
            deal.setStage(stage);
            return dealRepository.save(deal);
        });
    }
}
