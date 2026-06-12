package com.lera.ai_gateway.service;

import com.lera.ai_gateway.entity.AiConversation;
import com.lera.ai_gateway.repository.AiConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AiConversationService {
    private final AiConversationRepository repo;

    public Page<AiConversation> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<AiConversation> getById(UUID id) { return repo.findById(id); }
    public List<AiConversation> getByUser(UUID userId) { return repo.findByUserId(userId); }
    public List<AiConversation> getByStudent(UUID studentId) { return repo.findByStudentId(studentId); }
    public List<AiConversation> getByType(String type) { return repo.findByConversationType(type); }
    public List<AiConversation> getBySubject(String subject) { return repo.findBySubject(subject); }

    @Transactional public AiConversation save(AiConversation entity) { return repo.save(entity); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
