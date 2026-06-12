package com.lera.connect_service.service;

import com.lera.connect_service.entity.CrmTrigger;
import com.lera.connect_service.repository.CrmTriggerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CrmTriggerService {
    private final CrmTriggerRepository repo;

    public Page<CrmTrigger> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<CrmTrigger> getById(UUID id) { return repo.findById(id); }

    @Transactional public CrmTrigger save(CrmTrigger entity) { return repo.save(entity); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
