package com.lera.connect_service.service;

import com.lera.connect_service.entity.EmailLog;
import com.lera.connect_service.repository.EmailLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class EmailLogService {
    private final EmailLogRepository repo;

    public Page<EmailLog> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<EmailLog> getById(UUID id) { return repo.findById(id); }

    @Transactional public EmailLog save(EmailLog entity) { return repo.save(entity); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
