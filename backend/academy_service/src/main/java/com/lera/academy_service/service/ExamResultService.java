package com.lera.academy_service.service;
import com.lera.academy_service.entity.ExamResult;
import com.lera.academy_service.repository.ExamRepository;
import com.lera.academy_service.repository.ExamResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.*;
@Service @RequiredArgsConstructor
public class ExamResultService {
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private final ExamResultRepository repo;
    private final ExamRepository examRepo;
    public Page<ExamResult> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<ExamResult> getById(UUID id) { return repo.findById(id); }
    @Transactional public ExamResult save(ExamResult e) { validate(e); return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }

    /**
     * Guard exam-result data quality: a non-negative score no greater than the exam's maxScore,
     * and a percentage within 0..100. (Previously results were saved unvalidated, so a score above
     * the maximum, a negative score, or an impossible percentage could be recorded.) To permit
     * bonus points above the maximum, relax the score-vs-maxScore check below.
     */
    private void validate(ExamResult e) {
        if (e.getScore() != null) {
            if (e.getScore().signum() < 0) {
                throw new IllegalArgumentException("Score cannot be negative");
            }
            if (e.getExamId() != null) {
                examRepo.findById(e.getExamId()).ifPresent(exam -> {
                    if (exam.getMaxScore() != null && exam.getMaxScore().signum() > 0
                            && e.getScore().compareTo(exam.getMaxScore()) > 0) {
                        throw new IllegalArgumentException(
                                "Score " + e.getScore() + " exceeds the exam maximum of " + exam.getMaxScore());
                    }
                });
            }
        }
        if (e.getPercentage() != null
                && (e.getPercentage().signum() < 0 || e.getPercentage().compareTo(HUNDRED) > 0)) {
            throw new IllegalArgumentException("Percentage must be between 0 and 100");
        }
    }
}
