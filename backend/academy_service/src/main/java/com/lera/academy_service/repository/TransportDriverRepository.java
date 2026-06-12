package com.lera.academy_service.repository;

import com.lera.academy_service.entity.TransportDriver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TransportDriverRepository extends JpaRepository<TransportDriver, UUID> {
}
