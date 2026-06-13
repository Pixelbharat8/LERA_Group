package com.lera.academy_service.service;
import com.lera.academy_service.entity.TransportRoute;
import com.lera.academy_service.repository.TransportRouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class TransportRouteService {
    private final TransportRouteRepository repo;
    @Cacheable("transportRoutes") public Page<TransportRoute> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<TransportRoute> getById(String id) { return repo.findById(id); }
    @Transactional @CacheEvict(value="transportRoutes",allEntries=true) public TransportRoute save(TransportRoute e) { return repo.save(e); }
    @Transactional @CacheEvict(value="transportRoutes",allEntries=true) public void deleteById(String id) { repo.deleteById(id); }
}
