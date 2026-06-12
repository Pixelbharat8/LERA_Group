package com.lera.payment_service.repository;

import com.lera.payment_service.entity.Discount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DiscountRepository extends JpaRepository<Discount, UUID> {
    
    Optional<Discount> findByCode(String code);
    
    List<Discount> findByIsActive(Boolean isActive);
    
    List<Discount> findByDiscountType(Discount.DiscountType discountType);
}
