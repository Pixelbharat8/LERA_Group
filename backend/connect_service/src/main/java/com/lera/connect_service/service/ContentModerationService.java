package com.lera.connect_service.service;

import com.lera.connect_service.entity.ContentModerationLog;
import com.lera.connect_service.repository.ContentModerationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ContentModerationService {
    private final ContentModerationLogRepository repo;

    public Page<ContentModerationLog> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<ContentModerationLog> getById(UUID id) { return repo.findById(id); }
    public List<ContentModerationLog> getByUser(UUID userId) { return repo.findByUserId(userId); }
    public List<ContentModerationLog> getByMessage(UUID messageId) { return repo.findByMessageId(messageId); }

    @Transactional public ContentModerationLog save(ContentModerationLog entity) { return repo.save(entity); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
