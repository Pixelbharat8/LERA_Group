package com.lera.connect_service.service;

import com.lera.connect_service.entity.UserConversationPrefs;
import com.lera.connect_service.repository.UserConversationPrefsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ConversationPrefsService {
    private final UserConversationPrefsRepository repo;

    public List<UserConversationPrefs> getAll() { return repo.findAll(); }
    public Optional<UserConversationPrefs> getById(UUID id) { return repo.findById(id); }

    @Transactional public UserConversationPrefs save(UserConversationPrefs entity) { return repo.save(entity); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
