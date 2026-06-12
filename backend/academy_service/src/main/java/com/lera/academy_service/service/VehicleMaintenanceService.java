package com.lera.academy_service.service;
import com.lera.academy_service.entity.VehicleMaintenance;
import com.lera.academy_service.repository.VehicleMaintenanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class VehicleMaintenanceService {
    private final VehicleMaintenanceRepository repo;
    public Page<VehicleMaintenance> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<VehicleMaintenance> getById(UUID id) { return repo.findById(id); }
    @Transactional public VehicleMaintenance save(VehicleMaintenance e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
