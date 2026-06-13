package com.lera.connect_service.repository;

import com.lera.connect_service.entity.SocialPlatform;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SocialPlatformRepository extends JpaRepository<SocialPlatform, UUID> {
    
    Optional<SocialPlatform> findByPlatformName(String platformName);
    
    List<SocialPlatform> findByIsActiveTrue();
    
    List<SocialPlatform> findByIsConnectedTrue();
    
    List<SocialPlatform> findByIsActiveTrueOrderByPlatformName();
}
