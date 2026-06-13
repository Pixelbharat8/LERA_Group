package com.lera.connect_service.service;

import com.lera.connect_service.entity.ChatMessageReaction;
import com.lera.connect_service.repository.ChatMessageReactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ReactionService {
    private final ChatMessageReactionRepository repo;

    public List<ChatMessageReaction> getByMessage(UUID messageId) { return repo.findByMessageId(messageId); }
    public long countByMessageAndEmoji(UUID messageId, String emoji) { return repo.countByMessageIdAndEmoji(messageId, emoji); }
    public boolean exists(UUID messageId, UUID userId, String emoji) { return repo.existsByMessageIdAndUserIdAndEmoji(messageId, userId, emoji); }

    @Transactional public ChatMessageReaction save(ChatMessageReaction entity) { return repo.save(entity); }
    @Transactional public void remove(UUID messageId, UUID userId, String emoji) { repo.deleteByMessageIdAndUserIdAndEmoji(messageId, userId, emoji); }
}
