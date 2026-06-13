package com.lera.academy_service.service;
import com.lera.academy_service.entity.ClassScheduleException;
import com.lera.academy_service.repository.ClassScheduleExceptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class ClassScheduleExceptionService {
    private final ClassScheduleExceptionRepository repo;
    public Page<ClassScheduleException> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<ClassScheduleException> getById(Long id) { return repo.findById(id); }
    @Transactional public ClassScheduleException save(ClassScheduleException e) { return repo.save(e); }
    @Transactional public void deleteById(Long id) { repo.deleteById(id); }
}
