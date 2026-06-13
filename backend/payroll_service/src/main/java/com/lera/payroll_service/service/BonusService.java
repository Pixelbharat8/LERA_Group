package com.lera.payroll_service.service;

import com.lera.payroll_service.entity.*;
import com.lera.payroll_service.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class BonusService {

    private final BonusRepository bonusRepository;

    public Page<Bonus> getAll(Pageable pageable) {
        return bonusRepository.findAll(pageable);
    }

    public Optional<Bonus> getById(Long id) {
        return bonusRepository.findById(id);
    }

    public List<Bonus> getAll() {
        return bonusRepository.findAll();
    }

    public List<Bonus> getByTeacher(Long teacherId) {
        return bonusRepository.findByTeacherId(teacherId);
    }

    @Transactional
    public Bonus create(Bonus bonus) {
        log.info("Creating bonus");
        return bonusRepository.save(bonus);
    }

    @Transactional
    public Optional<Bonus> update(Long id, Bonus details) {
        return bonusRepository.findById(id).map(existing -> {
            details.setId(id);
            return bonusRepository.save(details);
        });
    }

    @Transactional
    public boolean delete(Long id) {
        if (bonusRepository.existsById(id)) {
            bonusRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
