package com.lera.academy_service.service;
import com.lera.academy_service.entity.ExamResult;
import com.lera.academy_service.repository.ExamResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class ExamResultService {
    private final ExamResultRepository repo;
    public Page<ExamResult> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<ExamResult> getById(UUID id) { return repo.findById(id); }
    @Transactional public ExamResult save(ExamResult e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
