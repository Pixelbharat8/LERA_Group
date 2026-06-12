package com.lera.academy_service.service;
import com.lera.academy_service.entity.SportFacility;
import com.lera.academy_service.repository.SportFacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class SportFacilityService {
    private final SportFacilityRepository repo;
    public Page<SportFacility> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<SportFacility> getById(UUID id) { return repo.findById(id); }
    @Transactional public SportFacility save(SportFacility e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
