package com.lera.academy_service.repository;

import com.lera.academy_service.entity.PermissionSlipResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PermissionSlipResponseRepository extends JpaRepository<PermissionSlipResponse, UUID> {
    List<PermissionSlipResponse> findBySlipId(UUID slipId);
    Optional<PermissionSlipResponse> findBySlipIdAndStudentId(UUID slipId, UUID studentId);
    List<PermissionSlipResponse> findByParentId(UUID parentId);
}
