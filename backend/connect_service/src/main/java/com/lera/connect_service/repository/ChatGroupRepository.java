package com.lera.connect_service.repository;

import com.lera.connect_service.entity.ChatGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatGroupRepository extends JpaRepository<ChatGroup, UUID> {
    
    List<ChatGroup> findByIsActiveTrue();
    
    @Query("SELECT g FROM ChatGroup g WHERE :memberId MEMBER OF g.memberIds AND g.isActive = true")
    List<ChatGroup> findByMemberId(UUID memberId);
    
    List<ChatGroup> findByCreatedBy(UUID createdBy);
}
