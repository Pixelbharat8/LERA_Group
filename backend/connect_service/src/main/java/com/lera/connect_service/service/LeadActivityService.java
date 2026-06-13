package com.lera.connect_service.service;

import com.lera.connect_service.entity.LeadActivity;
import com.lera.connect_service.repository.LeadActivityRepository;
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
public class LeadActivityService {

    private final LeadActivityRepository leadActivityRepository;

    public Page<LeadActivity> getAll(Pageable pageable) {
        return leadActivityRepository.findAll(pageable);
    }

    public Optional<LeadActivity> getById(UUID id) {
        return leadActivityRepository.findById(id);
    }

    public List<LeadActivity> getByLeadId(UUID leadId) {
        return leadActivityRepository.findByLeadId(leadId);
    }

    @Transactional
    public LeadActivity create(LeadActivity activity) {
        log.info("Creating lead activity for lead: {}", activity.getLeadId());
        return leadActivityRepository.save(activity);
    }

    @Transactional
    public boolean delete(UUID id) {
        if (leadActivityRepository.existsById(id)) {
            leadActivityRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
