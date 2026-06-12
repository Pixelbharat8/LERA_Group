package com.lera.payment_service.service;

import com.lera.payment_service.entity.Discount;
import com.lera.payment_service.repository.DiscountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DiscountService {

    private final DiscountRepository discountRepository;

    @Cacheable(value = "discounts", key = "'all'")
    public List<Discount> getAll() {
        return discountRepository.findAll();
    }

    public Page<Discount> getAllDiscounts(Pageable pageable) {
        return discountRepository.findAll(pageable);
    }

    public List<Discount> getDiscountsByType(Discount.DiscountType type) {
        return discountRepository.findByDiscountType(type);
    }

    public List<Discount> getActiveDiscounts() {
        return discountRepository.findByIsActive(true);
    }

    @Cacheable(value = "discounts", key = "#id")
    public Optional<Discount> getById(UUID id) {
        return discountRepository.findById(id);
    }

    public Optional<Discount> getDiscountById(UUID id) {
        return discountRepository.findById(id);
    }

    public Optional<Discount> getDiscountByCode(String code) {
        return discountRepository.findByCode(code);
    }

    @CacheEvict(value = "discounts", allEntries = true)
    @Transactional
    public Discount create(Discount discount) {
        discount.setCreatedAt(LocalDateTime.now());
        discount.setCurrentUses(0);
        discount.setIsActive(true);
        log.info("Creating discount: {} ({})", discount.getName(), discount.getCode());
        return discountRepository.save(discount);
    }

    @CacheEvict(value = "discounts", allEntries = true)
    @Transactional
    public Discount createDiscount(Discount discount) {
        return create(discount);
    }

    @Transactional
    public Optional<Discount> updateDiscount(UUID id, Discount discount) {
        return discountRepository.findById(id).map(existing -> {
            discount.setId(id);
            discount.setCreatedAt(existing.getCreatedAt());
            discount.setCurrentUses(existing.getCurrentUses());
            return discountRepository.save(discount);
        });
    }

    @CacheEvict(value = "discounts", allEntries = true)
    @Transactional
    public boolean delete(UUID id) {
        if (discountRepository.existsById(id)) {
            discountRepository.deleteById(id);
            log.info("Deleted discount: {}", id);
            return true;
        }
        return false;
    }

    @CacheEvict(value = "discounts", allEntries = true)
    @Transactional
    public boolean deleteDiscount(UUID id) {
        return delete(id);
    }

    public Map<String, Object> validatePromoCode(String code) {
        return discountRepository.findByCode(code).map(discount -> {
            boolean valid = Boolean.TRUE.equals(discount.getIsActive());

            if (discount.getMaxUses() != null && discount.getCurrentUses() >= discount.getMaxUses()) {
                valid = false;
            }
            if (discount.getValidFrom() != null && discount.getValidFrom().isAfter(LocalDate.now())) {
                valid = false;
            }
            if (discount.getValidTo() != null && discount.getValidTo().isBefore(LocalDate.now())) {
                valid = false;
            }

            Map<String, Object> result = new HashMap<>();
            result.put("valid", valid);
            result.put("discount", discount);
            result.put("message", valid ? "Promo code is valid" : "Promo code is invalid or expired");
            return result;
        }).orElse(Map.of("valid", false, "message", "Promo code not found"));
    }

    @Transactional
    public Optional<Discount> applyDiscount(UUID id) {
        return discountRepository.findById(id).map(discount -> {
            discount.setCurrentUses(discount.getCurrentUses() + 1);
            if (discount.getMaxUses() != null && discount.getCurrentUses() >= discount.getMaxUses()) {
                discount.setIsActive(false);
            }
            log.info("Applied discount: {} (uses: {})", discount.getCode(), discount.getCurrentUses());
            return discountRepository.save(discount);
        });
    }

    @CacheEvict(value = "discounts", allEntries = true)
    @Transactional
    public Optional<Discount> toggleActive(UUID id) {
        return discountRepository.findById(id).map(discount -> {
            discount.setIsActive(!Boolean.TRUE.equals(discount.getIsActive()));
            return discountRepository.save(discount);
        });
    }

    @Transactional
    public Optional<Discount> updateStatus(UUID id, String status) {
        return discountRepository.findById(id).map(discount -> {
            discount.setIsActive("ACTIVE".equalsIgnoreCase(status));
            return discountRepository.save(discount);
        });
    }
}
