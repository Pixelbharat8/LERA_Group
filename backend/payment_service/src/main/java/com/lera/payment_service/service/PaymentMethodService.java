package com.lera.payment_service.service;

import com.lera.payment_service.entity.PaymentMethod;
import com.lera.payment_service.repository.PaymentMethodRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PaymentMethodService {

    private final PaymentMethodRepository paymentMethodRepository;

    public Page<PaymentMethod> getAllMethods(Pageable pageable) {
        return paymentMethodRepository.findAll(pageable);
    }

    public Optional<PaymentMethod> getMethodById(UUID id) {
        return paymentMethodRepository.findById(id);
    }

    public List<PaymentMethod> getActiveMethods() {
        return paymentMethodRepository.findByIsActiveTrue();
    }

    public Optional<PaymentMethod> getMethodByCode(String code) {
        return paymentMethodRepository.findByMethodCode(code);
    }

    public List<PaymentMethod> getMethodsByType(String type) {
        return paymentMethodRepository.findByMethodType(type);
    }

    @Transactional
    public PaymentMethod createMethod(PaymentMethod method) {
        log.info("Creating payment method: {}", method.getMethodCode());
        return paymentMethodRepository.save(method);
    }

    @Transactional
    public Optional<PaymentMethod> updateMethod(UUID id, PaymentMethod details) {
        return paymentMethodRepository.findById(id).map(existing -> {
            details.setId(id);
            return paymentMethodRepository.save(details);
        });
    }

    @Transactional
    public boolean deleteMethod(UUID id) {
        if (paymentMethodRepository.existsById(id)) {
            paymentMethodRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
