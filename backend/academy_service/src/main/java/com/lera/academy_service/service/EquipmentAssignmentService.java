package com.lera.academy_service.service;
import com.lera.academy_service.entity.EquipmentAssignment;
import com.lera.academy_service.repository.EquipmentAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class EquipmentAssignmentService {
    private final EquipmentAssignmentRepository repo;
    public Page<EquipmentAssignment> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<EquipmentAssignment> getById(UUID id) { return repo.findById(id); }
    @Transactional public EquipmentAssignment save(EquipmentAssignment e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
