package com.lera.academy_service.service;
import com.lera.academy_service.entity.SportEquipment;
import com.lera.academy_service.repository.SportEquipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class SportEquipmentService {
    private final SportEquipmentRepository repo;
    public Page<SportEquipment> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<SportEquipment> getById(UUID id) { return repo.findById(id); }
    @Transactional public SportEquipment save(SportEquipment e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
