package com.lera.academy_service.repository;

import com.lera.academy_service.entity.BookReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BookReservationRepository extends JpaRepository<BookReservation, UUID> {

    List<BookReservation> findByStudentId(UUID studentId);
}
