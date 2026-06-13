package com.lera.connect_service.repository;

import com.lera.connect_service.entity.ChatAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatAttachmentRepository extends JpaRepository<ChatAttachment, UUID> {
    
    List<ChatAttachment> findByMessageId(UUID messageId);
    
    List<ChatAttachment> findByUploadedBy(UUID uploadedBy);

    Optional<ChatAttachment> findFirstByFileUrlEndingWith(String suffix);
}
