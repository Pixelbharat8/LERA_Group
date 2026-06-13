package com.lera.academy_service.repository;

import com.lera.academy_service.entity.TransportAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TransportAttendanceRepository extends JpaRepository<TransportAttendance, UUID> {
}
