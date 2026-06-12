package com.lera.connect_service.service;

import com.lera.connect_service.entity.LeadNote;
import com.lera.connect_service.repository.LeadNoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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
public class LeadNoteService {

    private final LeadNoteRepository leadNoteRepository;

    public Page<LeadNote> getAll(Pageable pageable) {
        return leadNoteRepository.findAll(pageable);
    }

    public Optional<LeadNote> getById(UUID id) {
        return leadNoteRepository.findById(id);
    }

    public List<LeadNote> getByLeadId(UUID leadId) {
        return leadNoteRepository.findByLeadId(leadId);
    }

    public List<LeadNote> getByLeadCenterId(UUID centerId) {
        return leadNoteRepository.findByLeadCenterId(centerId);
    }

    @Transactional
    @CacheEvict(value = "leads", allEntries = true)
    public LeadNote create(LeadNote note) {
        log.info("Creating lead note for lead: {}", note.getLeadId());
        return leadNoteRepository.save(note);
    }

    @Transactional
    @CacheEvict(value = "leads", allEntries = true)
    public Optional<LeadNote> update(UUID id, LeadNote details) {
        return leadNoteRepository.findById(id).map(note -> {
            if (details.getNote() != null) note.setNote(details.getNote());
            return leadNoteRepository.save(note);
        });
    }

    @Transactional
    @CacheEvict(value = "leads", allEntries = true)
    public boolean delete(UUID id) {
        if (leadNoteRepository.existsById(id)) {
            leadNoteRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
