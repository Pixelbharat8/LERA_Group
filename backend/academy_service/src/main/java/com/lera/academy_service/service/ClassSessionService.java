package com.lera.academy_service.service;
import com.lera.academy_service.entity.ClassSession;
import com.lera.academy_service.repository.ClassSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class ClassSessionService {
    private final ClassSessionRepository repo;
    public Page<ClassSession> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<ClassSession> getById(UUID id) { return repo.findById(id); }
    public List<ClassSession> getByClassId(UUID classId) { return repo.findByClassId(classId); }
    @Transactional public ClassSession save(ClassSession e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
