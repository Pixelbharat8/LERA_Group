package com.lera.academy_service.service;
import com.lera.academy_service.entity.StudentPoints;
import com.lera.academy_service.entity.PointTransaction;
import com.lera.academy_service.repository.StudentPointsRepository;
import com.lera.academy_service.repository.PointTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class GamificationService {
    private final StudentPointsRepository pointsRepo;
    private final PointTransactionRepository transactionRepo;
    public Page<StudentPoints> getAllPoints(Pageable pageable) { return pointsRepo.findAll(pageable); }
    public Page<PointTransaction> getAllTransactions(Pageable pageable) { return transactionRepo.findAll(pageable); }
    @Transactional public StudentPoints savePoints(StudentPoints e) { return pointsRepo.save(e); }
    @Transactional public PointTransaction saveTransaction(PointTransaction e) { return transactionRepo.save(e); }
}
