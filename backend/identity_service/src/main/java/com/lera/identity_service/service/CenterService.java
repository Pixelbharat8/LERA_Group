package com.lera.identity_service.service;

import com.lera.identity_service.entity.Center;
import com.lera.identity_service.repository.CenterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CenterService {
    
    private final CenterRepository centerRepository;
    
    public List<Center> getAllCenters() {
        return centerRepository.findAll().stream()
                .filter(c -> c.getStatus() == null || !"DELETED".equalsIgnoreCase(c.getStatus()))
                .sorted(Comparator.comparing(Center::getName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .collect(Collectors.toList());
    }
    
    public Optional<Center> getCenterById(UUID id) {
        return centerRepository.findById(id);
    }
    
    public Optional<Center> getCenterByCode(String code) {
        return centerRepository.findByCode(code);
    }
    
    public List<Center> getActiveCenters() {
        return centerRepository.findByStatus("ACTIVE");
    }
    
    public List<Center> getCentersByCity(String city) {
        return centerRepository.findByCity(city);
    }
    
    @Transactional
    public Center createCenter(Center center) {
        if (centerRepository.existsByCode(center.getCode())) {
            throw new RuntimeException("Center code already exists");
        }
        return centerRepository.save(center);
    }
    
    @Transactional
    public Optional<Center> updateCenter(UUID id, Center centerDetails) {
        return centerRepository.findById(id).map(center -> {
            if (centerDetails.getName() != null) center.setName(centerDetails.getName());
            if (centerDetails.getNameVi() != null) center.setNameVi(centerDetails.getNameVi());
            if (centerDetails.getAddress() != null) center.setAddress(centerDetails.getAddress());
            if (centerDetails.getAddressVi() != null) center.setAddressVi(centerDetails.getAddressVi());
            if (centerDetails.getCity() != null) center.setCity(centerDetails.getCity());
            if (centerDetails.getDistrict() != null) center.setDistrict(centerDetails.getDistrict());
            if (centerDetails.getPhone() != null) center.setPhone(centerDetails.getPhone());
            if (centerDetails.getEmail() != null) center.setEmail(centerDetails.getEmail());
            if (centerDetails.getLogoUrl() != null) center.setLogoUrl(centerDetails.getLogoUrl());
            if (centerDetails.getStatus() != null) center.setStatus(centerDetails.getStatus());
            if (centerDetails.getCapacity() != null) center.setCapacity(centerDetails.getCapacity());
            
            return centerRepository.save(center);
        });
    }
    
    /**
     * Deletes a center when nothing references it; otherwise marks it {@code DELETED}
     * and rewrites {@code code} so the unique constraint stays satisfied (FK-safe).
     */
    @Transactional
    public boolean deleteCenter(UUID id) {
        Optional<Center> opt = centerRepository.findById(id);
        if (opt.isEmpty()) {
            return false;
        }
        Center c = opt.get();
        // Centres are referenced by users/students/classes (FK), so a hard DELETE would
        // violate constraints AND mark the transaction rollback-only (which previously made
        // the soft-delete fallback fail → "unexpected error"). Soft-delete directly instead:
        // mark DELETED and free the unique code. getAllCenters() already hides DELETED rows.
        if (!"DELETED".equalsIgnoreCase(c.getStatus())) {
            String suffix = "_DEL_" + UUID.randomUUID().toString().substring(0, 8);
            String base = c.getCode() != null ? c.getCode() : "X";
            int max = 50;
            if (base.length() + suffix.length() > max) {
                base = base.substring(0, Math.max(1, max - suffix.length()));
            }
            c.setCode(base + suffix);
            c.setStatus("DELETED");
            centerRepository.save(c);
        }
        return true;
    }
    
    @Transactional
    public Optional<Center> updateCenterStatus(UUID id, String status) {
        return centerRepository.findById(id).map(center -> {
            center.setStatus(status);
            return centerRepository.save(center);
        });
    }
}
