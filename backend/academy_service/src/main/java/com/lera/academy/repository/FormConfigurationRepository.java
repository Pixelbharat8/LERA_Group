package com.lera.academy.repository;

import com.lera.academy.entity.FormConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FormConfigurationRepository extends JpaRepository<FormConfiguration, UUID> {
    
    Optional<FormConfiguration> findByFormName(String formName);
    
    List<FormConfiguration> findByEntityType(String entityType);
    
    List<FormConfiguration> findByIsActiveTrue();
    
    List<FormConfiguration> findByEntityTypeAndIsActiveTrue(String entityType);
    
    boolean existsByFormName(String formName);
}
