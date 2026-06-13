package com.lera.academy_service.service;
import com.lera.academy_service.entity.TransportDriver;
import com.lera.academy_service.repository.TransportDriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class TransportDriverService {
    private final TransportDriverRepository repo;
    public Page<TransportDriver> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<TransportDriver> getById(UUID id) { return repo.findById(id); }
    @Transactional public TransportDriver save(TransportDriver e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
