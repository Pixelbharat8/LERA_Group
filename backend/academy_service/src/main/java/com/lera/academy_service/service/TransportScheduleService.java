package com.lera.academy_service.service;
import com.lera.academy_service.entity.TransportSchedule;
import com.lera.academy_service.repository.TransportScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class TransportScheduleService {
    private final TransportScheduleRepository repo;
    public Page<TransportSchedule> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<TransportSchedule> getById(UUID id) { return repo.findById(id); }
    @Transactional public TransportSchedule save(TransportSchedule e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
