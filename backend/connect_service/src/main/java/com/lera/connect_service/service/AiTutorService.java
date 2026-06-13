package com.lera.connect_service.service;

import com.lera.connect_service.entity.AiTutorSession;
import com.lera.connect_service.repository.AiTutorSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AiTutorService {
    private final AiTutorSessionRepository repo;

    public Page<AiTutorSession> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<AiTutorSession> getById(UUID id) { return repo.findById(id); }
    public List<AiTutorSession> getByStudent(UUID studentId) { return repo.findByStudentId(studentId); }
    public List<AiTutorSession> getByConversation(UUID convId) { return repo.findByConversationId(convId); }
    public List<AiTutorSession> getByType(String type) { return repo.findBySessionType(type); }

    @Transactional public AiTutorSession save(AiTutorSession entity) { return repo.save(entity); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
