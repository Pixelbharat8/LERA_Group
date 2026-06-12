package com.lera.connect_service.service;

import com.lera.connect_service.entity.Lead;
import com.lera.connect_service.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class LeadService {

    private final LeadRepository leadRepository;

    public Page<Lead> getAll(Pageable pageable) {
        return leadRepository.findAll(pageable);
    }

    @Cacheable(value = "leads", key = "#id")
    public Optional<Lead> getById(UUID id) {
        return leadRepository.findById(id);
    }

    @Cacheable(value = "leads", key = "'all'")
    public List<Lead> getAll() {
        return leadRepository.findAll();
    }

    @Transactional
    @CacheEvict(value = "leads", allEntries = true)
    public Lead create(Lead lead) {
        log.info("Creating lead: {}", lead.getFullName());
        return leadRepository.save(lead);
    }

    @Transactional
    @CacheEvict(value = "leads", allEntries = true)
    public Optional<Lead> update(UUID id, Lead details) {
        return leadRepository.findById(id).map(existing -> {
            details.setId(id);
            return leadRepository.save(details);
        });
    }

    @Transactional
    @CacheEvict(value = "leads", allEntries = true)
    public boolean delete(UUID id) {
        if (leadRepository.existsById(id)) {
            leadRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
