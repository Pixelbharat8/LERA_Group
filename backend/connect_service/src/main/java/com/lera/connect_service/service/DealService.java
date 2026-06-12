package com.lera.connect_service.service;

import com.lera.connect_service.entity.Deal;
import com.lera.connect_service.repository.DealRepository;
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
public class DealService {

    private final DealRepository dealRepository;

    public Page<Deal> getAll(Pageable pageable) {
        return dealRepository.findAll(pageable);
    }

    public Optional<Deal> getById(UUID id) {
        return dealRepository.findById(id);
    }

    @Transactional
    public Deal create(Deal deal) {
        log.info("Creating deal: {}", deal.getTitle());
        return dealRepository.save(deal);
    }

    @Transactional
    public Optional<Deal> update(UUID id, Deal details) {
        return dealRepository.findById(id).map(existing -> {
            details.setId(id);
            return dealRepository.save(details);
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (dealRepository.existsById(id)) {
            dealRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
