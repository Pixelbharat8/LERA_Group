package com.lera.academy_service.repository;

import com.lera.academy_service.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BadgeRepository extends JpaRepository<Badge, UUID> {

    List<Badge> findByIsActiveTrueOrderByPointsRequiredAsc();

    List<Badge> findAllByOrderByPointsRequiredAsc();
}
