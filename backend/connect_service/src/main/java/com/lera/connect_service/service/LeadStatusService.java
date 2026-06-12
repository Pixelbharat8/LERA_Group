package com.lera.connect_service.service;

import com.lera.connect_service.entity.LeadStatus;
import com.lera.connect_service.repository.LeadStatusRepository;
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
public class LeadStatusService {

    private final LeadStatusRepository leadStatusRepository;

    @Cacheable(value = "leadStatuses", key = "'page:' + #pageable.pageNumber")
    public Page<LeadStatus> getAll(Pageable pageable) {
        return leadStatusRepository.findAll(pageable);
    }

    @Cacheable(value = "leadStatuses", key = "#id")
    public Optional<LeadStatus> getById(UUID id) {
        return leadStatusRepository.findById(id);
    }

    @Transactional
    @CacheEvict(value = "leadStatuses", allEntries = true)
    public LeadStatus create(LeadStatus status) {
        log.info("Creating lead status: {}", status.getStatusName());
        return leadStatusRepository.save(status);
    }

    @Transactional
    @CacheEvict(value = "leadStatuses", allEntries = true)
    public Optional<LeadStatus> update(UUID id, LeadStatus details) {
        return leadStatusRepository.findById(id).map(status -> {
            if (details.getStatusName() != null) status.setStatusName(details.getStatusName());
            if (details.getColorCode() != null) status.setColorCode(details.getColorCode());
            if (details.getDisplayOrder() != null) status.setDisplayOrder(details.getDisplayOrder());
            return leadStatusRepository.save(status);
        });
    }

    @Transactional
    @CacheEvict(value = "leadStatuses", allEntries = true)
    public boolean delete(UUID id) {
        if (leadStatusRepository.existsById(id)) {
            leadStatusRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
