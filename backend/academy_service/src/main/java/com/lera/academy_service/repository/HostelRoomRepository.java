package com.lera.academy_service.repository;

import com.lera.academy_service.entity.HostelRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface HostelRoomRepository extends JpaRepository<HostelRoom, UUID> {
    List<HostelRoom> findAllByOrderByRoomNumberAsc();
    List<HostelRoom> findByCenterIdOrderByRoomNumberAsc(UUID centerId);
    long countByStatus(String status);
}
