package com.lera.connect_service.service;

import com.lera.connect_service.entity.LeadAssignment;
import com.lera.connect_service.repository.LeadAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
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
public class LeadAssignmentService {

    private final LeadAssignmentRepository leadAssignmentRepository;

    public Page<LeadAssignment> getAll(Pageable pageable) {
        return leadAssignmentRepository.findAll(pageable);
    }

    public Optional<LeadAssignment> getById(UUID id) {
        return leadAssignmentRepository.findById(id);
    }

    public List<LeadAssignment> getByLeadId(UUID leadId) {
        return leadAssignmentRepository.findByLeadId(leadId);
    }

    public List<LeadAssignment> getByAssignedTo(UUID userId) {
        return leadAssignmentRepository.findByAssignedTo(userId);
    }

    @Transactional
    @CacheEvict(value = "leads", allEntries = true)
    public LeadAssignment create(LeadAssignment assignment) {
        log.info("Creating lead assignment for lead: {}", assignment.getLeadId());
        return leadAssignmentRepository.save(assignment);
    }

    @Transactional
    @CacheEvict(value = "leads", allEntries = true)
    public boolean delete(UUID id) {
        if (leadAssignmentRepository.existsById(id)) {
            leadAssignmentRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
