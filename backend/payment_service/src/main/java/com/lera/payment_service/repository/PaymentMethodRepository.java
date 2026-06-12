package com.lera.payment_service.repository;

import com.lera.payment_service.entity.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, UUID> {
    List<PaymentMethod> findByIsActiveTrue();
    Optional<PaymentMethod> findByMethodCode(String methodCode);
    List<PaymentMethod> findByMethodType(String methodType);
}
