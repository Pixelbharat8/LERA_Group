package com.lera.academy_service.repository;

import com.lera.academy_service.entity.HostelRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface HostelRegistrationRepository extends JpaRepository<HostelRegistration, UUID> {
    List<HostelRegistration> findByStudentIdOrderByCreatedAtDesc(UUID studentId);
    List<HostelRegistration> findByStatusOrderByCreatedAtDesc(String status);
    List<HostelRegistration> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
}
