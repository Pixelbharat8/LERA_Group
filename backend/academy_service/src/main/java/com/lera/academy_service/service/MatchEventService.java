package com.lera.academy_service.service;
import com.lera.academy_service.entity.MatchEvent;
import com.lera.academy_service.repository.MatchEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class MatchEventService {
    private final MatchEventRepository repo;
    public Page<MatchEvent> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<MatchEvent> getById(UUID id) { return repo.findById(id); }
    @Transactional public MatchEvent save(MatchEvent e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
