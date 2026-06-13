package com.lera.connect_service.repository;

import com.lera.connect_service.entity.AdAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AdAccountRepository extends JpaRepository<AdAccount, UUID> {
    
    List<AdAccount> findByPlatform(String platform);
    
    Optional<AdAccount> findByPlatformAndAccountId(String platform, String accountId);
    
    List<AdAccount> findByIsActiveTrue();
    
    List<AdAccount> findByIsActiveTrueOrderByPlatform();
}
