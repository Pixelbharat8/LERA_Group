package com.lera.academy_service.service;
import com.lera.academy_service.entity.CenterSettings;
import com.lera.academy_service.repository.CenterSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class CenterSettingsService {
    private final CenterSettingsRepository repo;
    public Page<CenterSettings> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<CenterSettings> getById(UUID id) { return repo.findById(id); }
    @Transactional public CenterSettings save(CenterSettings e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
