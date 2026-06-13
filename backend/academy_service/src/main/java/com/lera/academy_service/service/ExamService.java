package com.lera.academy_service.service;
import com.lera.academy_service.entity.Exam;
import com.lera.academy_service.repository.ExamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class ExamService {
    private final ExamRepository repo;
    public Page<Exam> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<Exam> getById(UUID id) { return repo.findById(id); }
    @Transactional public Exam save(Exam e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
