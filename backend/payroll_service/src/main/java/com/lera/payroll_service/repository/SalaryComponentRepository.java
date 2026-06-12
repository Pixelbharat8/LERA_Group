package com.lera.payroll_service.repository;

import com.lera.payroll_service.entity.SalaryComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SalaryComponentRepository extends JpaRepository<SalaryComponent, UUID> {
    List<SalaryComponent> findByComponentType(String componentType);
    List<SalaryComponent> findByIsActive(Boolean isActive);
}
