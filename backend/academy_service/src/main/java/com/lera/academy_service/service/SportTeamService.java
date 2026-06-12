package com.lera.academy_service.service;
import com.lera.academy_service.entity.SportTeam;
import com.lera.academy_service.repository.SportTeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class SportTeamService {
    private final SportTeamRepository repo;
    public Page<SportTeam> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<SportTeam> getById(UUID id) { return repo.findById(id); }
    @Transactional public SportTeam save(SportTeam e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
