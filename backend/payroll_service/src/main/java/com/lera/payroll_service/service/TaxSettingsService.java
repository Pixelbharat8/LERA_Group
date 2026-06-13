package com.lera.payroll_service.service;

import com.lera.payroll_service.entity.TaxSettings;
import com.lera.payroll_service.repository.TaxSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TaxSettingsService {

    private final TaxSettingsRepository taxSettingsRepository;

    public Page<TaxSettings> getAll(Pageable pageable) {
        return taxSettingsRepository.findAll(pageable);
    }

    public Optional<TaxSettings> getById(UUID id) {
        return taxSettingsRepository.findById(id);
    }

    public List<TaxSettings> getAll() {
        return taxSettingsRepository.findAll();
    }

    public Optional<TaxSettings> getByType(String type) {
        return taxSettingsRepository.findByTaxType(type);
    }

    public List<TaxSettings> getActive() {
        return taxSettingsRepository.findByIsActive(true);
    }

    @Transactional
    public Optional<TaxSettings> toggleActive(UUID id) {
        return taxSettingsRepository.findById(id).map(settings -> {
            settings.setIsActive(!settings.getIsActive());
            return taxSettingsRepository.save(settings);
        });
    }

    @Transactional
    public TaxSettings create(TaxSettings settings) {
        log.info("Creating tax settings");
        return taxSettingsRepository.save(settings);
    }

    @Transactional
    public Optional<TaxSettings> update(UUID id, TaxSettings details) {
        return taxSettingsRepository.findById(id).map(existing -> {
            details.setId(id);
            return taxSettingsRepository.save(details);
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (taxSettingsRepository.existsById(id)) {
            taxSettingsRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
