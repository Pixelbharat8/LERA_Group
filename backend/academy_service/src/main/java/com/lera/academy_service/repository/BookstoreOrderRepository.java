package com.lera.academy_service.repository;

import com.lera.academy_service.entity.BookstoreOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BookstoreOrderRepository extends JpaRepository<BookstoreOrder, UUID> {
    List<BookstoreOrder> findAllByOrderByCreatedAtDesc();
    List<BookstoreOrder> findByStatusOrderByCreatedAtDesc(String status);
    long countByStatus(String status);
}
