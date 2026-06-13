package com.lera.academy_service.service;
import com.lera.academy_service.entity.GpsTracking;
import com.lera.academy_service.repository.GpsTrackingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class GpsTrackingService {
    private final GpsTrackingRepository repo;
    public Page<GpsTracking> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<GpsTracking> getById(UUID id) { return repo.findById(id); }
    @Transactional public GpsTracking save(GpsTracking e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
