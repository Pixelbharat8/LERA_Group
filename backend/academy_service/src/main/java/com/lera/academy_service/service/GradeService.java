package com.lera.academy_service.service;
import com.lera.academy_service.entity.ExamResult;
import com.lera.academy_service.entity.Exam;
import com.lera.academy_service.repository.ExamResultRepository;
import com.lera.academy_service.repository.ExamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class GradeService {
    private final ExamResultRepository examResultRepo;
    private final ExamRepository examRepo;
    public Page<ExamResult> getAllResults(Pageable pageable) { return examResultRepo.findAll(pageable); }
    public Page<Exam> getAllExams(Pageable pageable) { return examRepo.findAll(pageable); }
    public Optional<ExamResult> getResultById(UUID id) { return examResultRepo.findById(id); }
    @Transactional public ExamResult saveResult(ExamResult e) { return examResultRepo.save(e); }
}
