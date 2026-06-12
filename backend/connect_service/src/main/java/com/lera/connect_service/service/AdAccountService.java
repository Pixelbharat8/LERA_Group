package com.lera.connect_service.service;

import com.lera.connect_service.entity.AdAccount;
import com.lera.connect_service.repository.AdAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AdAccountService {
    private final AdAccountRepository repo;

    @Cacheable("adAccounts")
    public Page<AdAccount> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<AdAccount> getById(UUID id) { return repo.findById(id); }
    public List<AdAccount> getByPlatform(String platform) { return repo.findByPlatform(platform); }
    public List<AdAccount> getActive() { return repo.findByIsActiveTrue(); }

    @CacheEvict(value = "adAccounts", allEntries = true) @Transactional
    public AdAccount save(AdAccount entity) { return repo.save(entity); }

    @CacheEvict(value = "adAccounts", allEntries = true) @Transactional
    public void deleteById(UUID id) { repo.deleteById(id); }
}
