package com.lera.academy_service.repository;

import com.lera.academy_service.entity.StaffCertification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StaffCertificationRepository extends JpaRepository<StaffCertification, UUID> {

    List<StaffCertification> findByUserIdOrderByIssueDateDesc(UUID userId);

    List<StaffCertification> findByCenterIdOrderByIssueDateDesc(UUID centerId);

    List<StaffCertification> findAllByOrderByIssueDateDesc();
}
