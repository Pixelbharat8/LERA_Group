package com.lera.academy_service.service;
import com.lera.academy_service.entity.Vehicle;
import com.lera.academy_service.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class VehicleService {
    private final VehicleRepository repo;
    @Cacheable("vehicles") public Page<Vehicle> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<Vehicle> getById(UUID id) { return repo.findById(id); }
    @Transactional @CacheEvict(value="vehicles",allEntries=true) public Vehicle save(Vehicle e) { return repo.save(e); }
    @Transactional @CacheEvict(value="vehicles",allEntries=true) public void deleteById(UUID id) { repo.deleteById(id); }
}
