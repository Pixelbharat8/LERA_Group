package com.lera.connect_service.service;

import com.lera.connect_service.entity.ChatAttachment;
import com.lera.connect_service.repository.ChatAttachmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AttachmentService {
    private final ChatAttachmentRepository repo;

    public Page<ChatAttachment> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<ChatAttachment> getById(UUID id) { return repo.findById(id); }
    public List<ChatAttachment> getByMessage(UUID messageId) { return repo.findByMessageId(messageId); }
    public List<ChatAttachment> getByUploader(UUID uploadedBy) { return repo.findByUploadedBy(uploadedBy); }

    @Transactional public ChatAttachment save(ChatAttachment entity) { return repo.save(entity); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
