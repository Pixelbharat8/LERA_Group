package com.lera.academy_service.service;
import com.lera.academy_service.entity.FacilityBooking;
import com.lera.academy_service.repository.FacilityBookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class FacilityBookingService {
    private final FacilityBookingRepository repo;
    public Page<FacilityBooking> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<FacilityBooking> getById(UUID id) { return repo.findById(id); }
    @Transactional public FacilityBooking save(FacilityBooking e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
