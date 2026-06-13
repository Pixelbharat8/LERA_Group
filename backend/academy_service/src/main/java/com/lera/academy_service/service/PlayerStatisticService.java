package com.lera.academy_service.service;
import com.lera.academy_service.entity.PlayerStatistic;
import com.lera.academy_service.repository.PlayerStatisticRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class PlayerStatisticService {
    private final PlayerStatisticRepository repo;
    public Page<PlayerStatistic> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<PlayerStatistic> getById(UUID id) { return repo.findById(id); }
    @Transactional public PlayerStatistic save(PlayerStatistic e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
