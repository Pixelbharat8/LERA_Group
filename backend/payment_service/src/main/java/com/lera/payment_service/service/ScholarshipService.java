package com.lera.payment_service.service;

import com.lera.payment_service.entity.Scholarship;
import com.lera.payment_service.repository.ScholarshipRepository;
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
public class ScholarshipService {

    private final ScholarshipRepository scholarshipRepository;

    public Page<Scholarship> getAllScholarships(Pageable pageable) {
        return scholarshipRepository.findAll(pageable);
    }

    public Optional<Scholarship> getScholarshipById(UUID id) {
        return scholarshipRepository.findById(id);
    }

    public List<Scholarship> getActiveScholarships() {
        return scholarshipRepository.findByIsActiveTrue();
    }

    public Optional<Scholarship> getScholarshipByCode(String code) {
        return scholarshipRepository.findByScholarshipCode(code);
    }

    public List<Scholarship> getScholarshipsByType(String type) {
        return scholarshipRepository.findByScholarshipType(type);
    }

    @Transactional
    public Scholarship createScholarship(Scholarship scholarship) {
        log.info("Creating scholarship: {}", scholarship.getScholarshipCode());
        return scholarshipRepository.save(scholarship);
    }

    @Transactional
    public Optional<Scholarship> updateScholarship(UUID id, Scholarship details) {
        return scholarshipRepository.findById(id).map(existing -> {
            details.setId(id);
            return scholarshipRepository.save(details);
        });
    }

    @Transactional
    public boolean deleteScholarship(UUID id) {
        if (scholarshipRepository.existsById(id)) {
            scholarshipRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
