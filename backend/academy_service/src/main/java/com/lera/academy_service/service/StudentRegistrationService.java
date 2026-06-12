package com.lera.academy_service.service;
import com.lera.academy_service.entity.StudentRegistration;
import com.lera.academy_service.repository.StudentRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class StudentRegistrationService {
    private final StudentRegistrationRepository repo;
    public Page<StudentRegistration> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<StudentRegistration> getById(UUID id) { return repo.findById(id); }
    @Transactional public StudentRegistration save(StudentRegistration e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
