package com.lera.connect_service.repository;

import com.lera.connect_service.entity.LeadTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LeadTagRepository extends JpaRepository<LeadTag, UUID> {
    List<LeadTag> findByTagName(String tagName);
    List<LeadTag> findByIsActive(Boolean isActive);
}
