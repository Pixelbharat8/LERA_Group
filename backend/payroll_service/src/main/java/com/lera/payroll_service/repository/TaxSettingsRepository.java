package com.lera.payroll_service.repository;

import com.lera.payroll_service.entity.TaxSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaxSettingsRepository extends JpaRepository<TaxSettings, UUID> {
    Optional<TaxSettings> findByTaxType(String taxType);
    List<TaxSettings> findByIsActive(Boolean isActive);
}
