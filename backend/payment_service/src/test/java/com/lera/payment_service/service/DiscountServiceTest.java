package com.lera.payment_service.service;

import com.lera.payment_service.entity.Discount;
import com.lera.payment_service.repository.DiscountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiscountServiceTest {

    @Mock
    private DiscountRepository discountRepository;

    @InjectMocks
    private DiscountService discountService;

    private Discount testDiscount;

    @BeforeEach
    void setUp() {
        testDiscount = new Discount();
        testDiscount.setId(UUID.randomUUID());
        testDiscount.setCode("SUMMER2024");
        testDiscount.setName("Summer Discount");
        testDiscount.setIsActive(true);
        testDiscount.setCurrentUses(0);
        testDiscount.setMaxUses(100);
        testDiscount.setValidFrom(LocalDate.now().minusDays(10));
        testDiscount.setValidTo(LocalDate.now().plusDays(30));
    }

    @Test
    void getAllDiscounts_shouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Discount> page = new PageImpl<>(List.of(testDiscount));
        when(discountRepository.findAll(pageable)).thenReturn(page);

        Page<Discount> result = discountService.getAllDiscounts(pageable);
        assertEquals(1, result.getTotalElements());
        verify(discountRepository).findAll(pageable);
    }

    @Test
    void getDiscountById_shouldReturnDiscount() {
        when(discountRepository.findById(testDiscount.getId())).thenReturn(Optional.of(testDiscount));

        Optional<Discount> result = discountService.getDiscountById(testDiscount.getId());
        assertTrue(result.isPresent());
        assertEquals("SUMMER2024", result.get().getCode());
    }

    @Test
    void getDiscountById_shouldReturnEmptyForMissingId() {
        UUID randomId = UUID.randomUUID();
        when(discountRepository.findById(randomId)).thenReturn(Optional.empty());

        Optional<Discount> result = discountService.getDiscountById(randomId);
        assertTrue(result.isEmpty());
    }

    @Test
    void createDiscount_shouldSetDefaults() {
        when(discountRepository.save(any(Discount.class))).thenReturn(testDiscount);

        Discount input = new Discount();
        input.setCode("NEW");
        Discount result = discountService.createDiscount(input);
        
        assertNotNull(result);
        verify(discountRepository).save(any(Discount.class));
    }

    @Test
    void deleteDiscount_shouldReturnTrueWhenExists() {
        when(discountRepository.existsById(testDiscount.getId())).thenReturn(true);
        doNothing().when(discountRepository).deleteById(testDiscount.getId());

        assertTrue(discountService.deleteDiscount(testDiscount.getId()));
        verify(discountRepository).deleteById(testDiscount.getId());
    }

    @Test
    void deleteDiscount_shouldReturnFalseWhenNotExists() {
        UUID randomId = UUID.randomUUID();
        when(discountRepository.existsById(randomId)).thenReturn(false);

        assertFalse(discountService.deleteDiscount(randomId));
        verify(discountRepository, never()).deleteById(any());
    }

    @Test
    void validatePromoCode_shouldReturnValidForActiveCode() {
        when(discountRepository.findByCode("SUMMER2024")).thenReturn(Optional.of(testDiscount));

        Map<String, Object> result = discountService.validatePromoCode("SUMMER2024");
        assertEquals(true, result.get("valid"));
    }

    @Test
    void validatePromoCode_shouldReturnInvalidForExpiredCode() {
        testDiscount.setValidTo(LocalDate.now().minusDays(1));
        when(discountRepository.findByCode("EXPIRED")).thenReturn(Optional.of(testDiscount));

        Map<String, Object> result = discountService.validatePromoCode("EXPIRED");
        assertEquals(false, result.get("valid"));
    }

    @Test
    void validatePromoCode_shouldReturnNotFoundForMissingCode() {
        when(discountRepository.findByCode("NOPE")).thenReturn(Optional.empty());

        Map<String, Object> result = discountService.validatePromoCode("NOPE");
        assertEquals(false, result.get("valid"));
    }

    @Test
    void applyDiscount_shouldIncrementUses() {
        when(discountRepository.findById(testDiscount.getId())).thenReturn(Optional.of(testDiscount));
        when(discountRepository.save(any(Discount.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<Discount> result = discountService.applyDiscount(testDiscount.getId());
        assertTrue(result.isPresent());
        assertEquals(1, result.get().getCurrentUses());
    }

    @Test
    void toggleActive_shouldFlipActiveStatus() {
        when(discountRepository.findById(testDiscount.getId())).thenReturn(Optional.of(testDiscount));
        when(discountRepository.save(any(Discount.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<Discount> result = discountService.toggleActive(testDiscount.getId());
        assertTrue(result.isPresent());
        assertFalse(result.get().getIsActive());
    }
}
