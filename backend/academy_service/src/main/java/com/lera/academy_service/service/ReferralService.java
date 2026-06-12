package com.lera.academy_service.service;

import com.lera.academy_service.entity.Referral;
import com.lera.academy_service.repository.ReferralRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReferralService {

    private final ReferralRepository repo;

    public List<Referral> findForParent(UUID parentId)   { return repo.findByReferrerUserIdOrderByCreatedAtDesc(parentId); }
    public List<Referral> findForStudent(UUID studentId) { return repo.findByStudentIdOrderByCreatedAtDesc(studentId); }
    public List<Referral> findForCenter(UUID centerId)   { return repo.findByCenterIdOrderByCreatedAtDesc(centerId); }
    public List<Referral> findByStatus(String status)    { return repo.findByStatusOrderByCreatedAtDesc(status); }
    public List<Referral> findAll()                      { return repo.findAll(); }
    public Optional<Referral> findById(UUID id)          { return repo.findById(id); }

    @Transactional
    public Referral create(Referral r) {
        if (r.getStatus() == null) r.setStatus("PENDING");
        return repo.save(r);
    }

    @Transactional
    public Optional<Referral> update(UUID id, Referral patch) {
        return repo.findById(id).map(existing -> {
            if (patch.getReferredEmail() != null) existing.setReferredEmail(patch.getReferredEmail());
            if (patch.getReferredName()  != null) existing.setReferredName(patch.getReferredName());
            if (patch.getReferredPhone() != null) existing.setReferredPhone(patch.getReferredPhone());
            if (patch.getNotes()         != null) existing.setNotes(patch.getNotes());
            if (patch.getRewardAmount()  != null) existing.setRewardAmount(patch.getRewardAmount());
            if (patch.getRewardStatus()  != null) existing.setRewardStatus(patch.getRewardStatus());
            if (patch.getStatus()        != null) existing.setStatus(patch.getStatus());
            if (patch.getStudentId()     != null) existing.setStudentId(patch.getStudentId());
            if (patch.getCenterId()      != null) existing.setCenterId(patch.getCenterId());
            return existing;
        });
    }

    @Transactional
    public Optional<Referral> markConverted(UUID id, UUID studentId) {
        return repo.findById(id).map(existing -> {
            existing.setStatus("CONVERTED");
            existing.setStudentId(studentId);
            existing.setConvertedAt(LocalDateTime.now());
            return existing;
        });
    }

    @Transactional
    public void deleteById(UUID id) { repo.deleteById(id); }
}
