package com.lera.academy_service.service;
import com.lera.academy_service.entity.RouteStop;
import com.lera.academy_service.repository.RouteStopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class RouteStopService {
    private final RouteStopRepository repo;
    public Page<RouteStop> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<RouteStop> getById(UUID id) { return repo.findById(id); }
    @Transactional public RouteStop save(RouteStop e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
