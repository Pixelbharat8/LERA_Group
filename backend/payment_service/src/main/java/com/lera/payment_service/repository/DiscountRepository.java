package com.lera.payment_service.repository;

import com.lera.payment_service.entity.Discount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DiscountRepository extends JpaRepository<Discount, UUID> {

    Optional<Discount> findByCode(String code);

    List<Discount> findByIsActive(Boolean isActive);

    List<Discount> findByDiscountType(Discount.DiscountType discountType);

    /**
     * Atomically claim one use — increments only while under maxUses. Returns rows affected
     * (1 = claimed, 0 = exhausted/not found). Prevents a read-modify-write race in applyDiscount
     * from letting concurrent redemptions exceed maxUses.
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Discount d SET d.currentUses = d.currentUses + 1 " +
           "WHERE d.id = :id AND (d.maxUses IS NULL OR d.currentUses < d.maxUses)")
    int claimUse(@Param("id") UUID id);

    /** Deactivate a discount that has reached its maxUses (atomic follow-up to claimUse). */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Discount d SET d.isActive = false " +
           "WHERE d.id = :id AND d.maxUses IS NOT NULL AND d.currentUses >= d.maxUses")
    int deactivateIfExhausted(@Param("id") UUID id);
}
