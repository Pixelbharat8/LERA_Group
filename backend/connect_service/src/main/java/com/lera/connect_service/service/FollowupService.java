package com.lera.connect_service.service;

import com.lera.connect_service.entity.Followup;
import com.lera.connect_service.repository.FollowupRepository;
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
public class FollowupService {

    private final FollowupRepository followupRepository;

    public Page<Followup> getAll(Pageable pageable) {
        return followupRepository.findAll(pageable);
    }

    public Optional<Followup> getById(UUID id) {
        return followupRepository.findById(id);
    }

    public List<Followup> getByLeadId(UUID leadId) {
        return followupRepository.findByLeadId(leadId);
    }

    @Transactional
    public Followup create(Followup followup) {
        log.info("Creating followup for lead: {}", followup.getLeadId());
        return followupRepository.save(followup);
    }

    @Transactional
    public Optional<Followup> update(UUID id, Followup details) {
        return followupRepository.findById(id).map(existing -> {
            if (details.getActionType() != null) existing.setActionType(details.getActionType());
            if (details.getNextFollowupDate() != null) existing.setNextFollowupDate(details.getNextFollowupDate());
            if (details.getNotes() != null) existing.setNotes(details.getNotes());
            if (details.getOutcome() != null) existing.setOutcome(details.getOutcome());
            return followupRepository.save(existing);
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (followupRepository.existsById(id)) {
            followupRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
