package com.lera.academy_service.repository;

import com.lera.academy_service.entity.SportMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SportMatchRepository extends JpaRepository<SportMatch, UUID> {
}
