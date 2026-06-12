package com.lera.academy_service.service;
import com.lera.academy_service.entity.Tournament;
import com.lera.academy_service.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class TournamentService {
    private final TournamentRepository repo;
    public Page<Tournament> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<Tournament> getById(UUID id) { return repo.findById(id); }
    @Transactional public Tournament save(Tournament e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
