package com.lera.connect_service.service;

import com.lera.connect_service.entity.ChatMessage;
import com.lera.connect_service.entity.ChatGroup;
import com.lera.connect_service.repository.ChatMessageRepository;
import com.lera.connect_service.repository.ChatGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatGroupRepository chatGroupRepository;

    public Page<ChatMessage> getAllMessages(Pageable pageable) {
        return chatMessageRepository.findAll(pageable);
    }

    public Optional<ChatMessage> getMessageById(UUID id) {
        return chatMessageRepository.findById(id);
    }

    public Page<ChatGroup> getAllGroups(Pageable pageable) {
        return chatGroupRepository.findAll(pageable);
    }

    public Optional<ChatGroup> getGroupById(UUID id) {
        return chatGroupRepository.findById(id);
    }

    @Transactional
    public ChatMessage createMessage(ChatMessage message) {
        return chatMessageRepository.save(message);
    }

    @Transactional
    public ChatGroup createGroup(ChatGroup group) {
        log.info("Creating chat group: {}", group.getName());
        return chatGroupRepository.save(group);
    }

    @Transactional
    public boolean deleteMessage(UUID id) {
        if (chatMessageRepository.existsById(id)) {
            chatMessageRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
