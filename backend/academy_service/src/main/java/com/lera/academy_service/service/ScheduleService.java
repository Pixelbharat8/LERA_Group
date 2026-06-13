package com.lera.academy_service.service;
import com.lera.academy_service.entity.ClassSchedule;
import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.repository.ClassScheduleRepository;
import com.lera.academy_service.repository.ClassRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class ScheduleService {
    private final ClassScheduleRepository scheduleRepo;
    private final ClassRepository classRepo;
    public Page<ClassSchedule> getAll(Pageable pageable) { return scheduleRepo.findAll(pageable); }
    public Optional<ClassSchedule> getById(UUID id) { return scheduleRepo.findById(id); }
    @Transactional public ClassSchedule save(ClassSchedule e) { return scheduleRepo.save(e); }
    @Transactional public void deleteById(UUID id) { scheduleRepo.deleteById(id); }
}
