package com.lera.identity_service.repository;

import com.lera.identity_service.entity.Center;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CenterRepository extends JpaRepository<Center, UUID> {
    
    Optional<Center> findByCode(String code);
    
    boolean existsByCode(String code);
    
    List<Center> findByStatus(String status);
    
    List<Center> findByCity(String city);
    
    List<Center> findByManagerId(UUID managerId);
}
