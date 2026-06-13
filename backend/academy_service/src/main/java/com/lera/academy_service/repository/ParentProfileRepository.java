package com.lera.academy_service.repository;

import com.lera.academy_service.entity.ParentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParentProfileRepository extends JpaRepository<ParentProfile, UUID> {
    
    Optional<ParentProfile> findByUserId(UUID userId);
    
    boolean existsByUserId(UUID userId);
}
