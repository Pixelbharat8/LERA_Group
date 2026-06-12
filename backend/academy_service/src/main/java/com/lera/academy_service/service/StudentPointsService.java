package com.lera.academy_service.service;
import com.lera.academy_service.entity.StudentPoints;
import com.lera.academy_service.repository.StudentPointsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class StudentPointsService {
    private final StudentPointsRepository repo;
    public Page<StudentPoints> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<StudentPoints> getById(UUID id) { return repo.findById(id); }
    @Transactional public StudentPoints save(StudentPoints e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
