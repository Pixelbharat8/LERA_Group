package com.lera.connect_service.service;

import com.lera.connect_service.entity.ChatMessage;
import com.lera.connect_service.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final ChatMessageRepository repo;

    public Page<ChatMessage> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<ChatMessage> getById(UUID id) { return repo.findById(id); }
    public List<ChatMessage> getByLead(UUID leadId) { return repo.findByLeadIdOrderBySentAtAsc(leadId); }
    public List<ChatMessage> getBySender(UUID senderId) { return repo.findBySenderId(senderId); }

    @Transactional public ChatMessage save(ChatMessage entity) { return repo.save(entity); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
