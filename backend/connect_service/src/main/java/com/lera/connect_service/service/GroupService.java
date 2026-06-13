package com.lera.connect_service.service;

import com.lera.connect_service.entity.ChatGroup;
import com.lera.connect_service.repository.ChatGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class GroupService {
    private final ChatGroupRepository repo;

    public Page<ChatGroup> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<ChatGroup> getById(UUID id) { return repo.findById(id); }
    public List<ChatGroup> getActive() { return repo.findByIsActiveTrue(); }
    public List<ChatGroup> getByMember(UUID memberId) { return repo.findByMemberId(memberId); }
    public List<ChatGroup> getByCreator(UUID createdBy) { return repo.findByCreatedBy(createdBy); }

    @Transactional public ChatGroup save(ChatGroup entity) { return repo.save(entity); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
