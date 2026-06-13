package com.lera.social_media_service.service;

import com.lera.social_media_service.entity.LeadFollowup;
import com.lera.social_media_service.repository.LeadFollowupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class LeadFollowupService {
    private final LeadFollowupRepository repo;

    public Page<LeadFollowup> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<LeadFollowup> getById(UUID id) { return repo.findById(id); }
    public List<LeadFollowup> getByLead(UUID leadId) { return repo.findByLeadIdOrderByScheduledAtDesc(leadId); }
    public List<LeadFollowup> getByAssignee(UUID assignedTo) { return repo.findByAssignedToOrderByScheduledAtAsc(assignedTo); }
    public List<LeadFollowup> getByStatus(String status) { return repo.findByStatusOrderByScheduledAtAsc(status); }
    public List<LeadFollowup> getUpcoming(LocalDateTime start, LocalDateTime end, String status) { return repo.findByScheduledAtBetweenAndStatus(start, end, status); }

    @Transactional
    public LeadFollowup save(LeadFollowup entity) { return repo.save(entity); }

    @Transactional
    public void deleteById(UUID id) { repo.deleteById(id); }
}
