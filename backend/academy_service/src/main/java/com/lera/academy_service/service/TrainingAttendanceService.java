package com.lera.academy_service.service;
import com.lera.academy_service.entity.TrainingAttendance;
import com.lera.academy_service.repository.TrainingAttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class TrainingAttendanceService {
    private final TrainingAttendanceRepository repo;
    public Page<TrainingAttendance> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<TrainingAttendance> getById(UUID id) { return repo.findById(id); }
    @Transactional public TrainingAttendance save(TrainingAttendance e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
