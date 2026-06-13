package com.lera.academy_service.repository;

import com.lera.academy_service.entity.Referral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReferralRepository extends JpaRepository<Referral, UUID> {

    List<Referral> findByReferrerUserIdOrderByCreatedAtDesc(UUID referrerUserId);

    List<Referral> findByStudentIdOrderByCreatedAtDesc(UUID studentId);

    List<Referral> findByCenterIdOrderByCreatedAtDesc(UUID centerId);

    List<Referral> findByStatusOrderByCreatedAtDesc(String status);

    long countByReferrerUserIdAndStatus(UUID referrerUserId, String status);
}
