package com.lera.academy_service.repository;

import com.lera.academy_service.entity.PermissionSlip;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface PermissionSlipRepository extends JpaRepository<PermissionSlip, UUID> {
    // Soft-delete-aware finders. Anything deleted (deleted_at IS NOT NULL) is
    // hidden from normal lookups; admin tools that need historical rows can
    // use the underlying JpaRepository methods (findById / findAll) directly.
    List<PermissionSlip> findByDeletedAtIsNullAndClassIdOrderByCreatedAtDesc(UUID classId);
    List<PermissionSlip> findByDeletedAtIsNullAndCenterIdOrderByCreatedAtDesc(UUID centerId);
    List<PermissionSlip> findByDeletedAtIsNullAndStatusOrderByCreatedAtDesc(String status);
    List<PermissionSlip> findByDeletedAtIsNullOrderByCreatedAtDesc();

    // Backwards-compat aliases — kept so existing calls compile while we
    // migrate. Marked default so we can deprecate cleanly later.
    default List<PermissionSlip> findByClassIdOrderByCreatedAtDesc(UUID classId) {
        return findByDeletedAtIsNullAndClassIdOrderByCreatedAtDesc(classId);
    }
    default List<PermissionSlip> findByCenterIdOrderByCreatedAtDesc(UUID centerId) {
        return findByDeletedAtIsNullAndCenterIdOrderByCreatedAtDesc(centerId);
    }
    default List<PermissionSlip> findByStatusOrderByCreatedAtDesc(String status) {
        return findByDeletedAtIsNullAndStatusOrderByCreatedAtDesc(status);
    }
    default List<PermissionSlip> findAllByOrderByCreatedAtDesc() {
        return findByDeletedAtIsNullOrderByCreatedAtDesc();
    }
}
