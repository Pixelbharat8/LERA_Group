package com.lera.academy_service.repository;

import com.lera.academy_service.entity.Renewal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RenewalRepository extends JpaRepository<Renewal, UUID> {

    boolean existsByCurrentEnrollmentId(UUID currentEnrollmentId);

    List<Renewal> findAllByOrderByEndDateAsc();

    List<Renewal> findByStatusOrderByEndDateAsc(String status);

    List<Renewal> findByCenterIdOrderByEndDateAsc(UUID centerId);

    List<Renewal> findByCenterIdAndStatusOrderByEndDateAsc(UUID centerId, String status);

    long countByStatus(String status);
}
