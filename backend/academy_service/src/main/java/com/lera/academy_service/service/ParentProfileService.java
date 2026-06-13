package com.lera.academy_service.service;

import com.lera.academy_service.entity.ParentProfile;
import com.lera.academy_service.repository.ParentProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings({"NullAway", "DataFlowIssue", "nullness"})
public class ParentProfileService {

    private final ParentProfileRepository parentProfileRepository;

    @Transactional
    public ParentProfile createProfile(ParentProfile profile) {
        if (profile == null || profile.getUserId() == null) {
            throw new IllegalArgumentException("profile and userId must not be null");
        }
        log.info("Creating parent profile for user ID: {}", profile.getUserId());

        if (parentProfileRepository.existsByUserId(profile.getUserId())) {
            throw new IllegalArgumentException("Parent profile already exists for user ID: " + profile.getUserId());
        }

        ParentProfile saved = parentProfileRepository.save(profile);
        log.info("Parent profile created with ID: {}", saved.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public Optional<ParentProfile> getProfileByUserId(UUID userId) {
        if (userId == null) {
            return Optional.empty();
        }
        log.debug("Fetching parent profile for user ID: {}", userId);
        return parentProfileRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public Optional<ParentProfile> getProfileById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        log.debug("Fetching parent profile by ID: {}", id);
        return parentProfileRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<ParentProfile> getAllProfiles() {
        log.debug("Fetching all parent profiles");
        return parentProfileRepository.findAll();
    }

    @Transactional
    public ParentProfile updateProfile(UUID id, ParentProfile profileDetails) {
        if (id == null) {
            throw new IllegalArgumentException("id must not be null");
        }
        log.info("Updating parent profile ID: {}", id);

        ParentProfile profile = parentProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Parent profile not found with ID: " + id));

        if (profileDetails != null) {
            if (profileDetails.getOccupation() != null) {
                profile.setOccupation(profileDetails.getOccupation());
            }
            if (profileDetails.getEducationLevel() != null) {
                profile.setEducationLevel(profileDetails.getEducationLevel());
            }
            if (profileDetails.getPreferredContactMethod() != null) {
                profile.setPreferredContactMethod(profileDetails.getPreferredContactMethod());
            }
            if (profileDetails.getPreferredLanguage() != null) {
                profile.setPreferredLanguage(profileDetails.getPreferredLanguage());
            }
            if (profileDetails.getInterests() != null) {
                profile.setInterests(profileDetails.getInterests());
            }
            if (profileDetails.getNotes() != null) {
                profile.setNotes(profileDetails.getNotes());
            }
        }

        ParentProfile updated = parentProfileRepository.save(profile);
        log.info("Parent profile updated successfully: {}", id);
        return updated;
    }

    @Transactional
    public void deleteProfile(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("id must not be null");
        }
        log.info("Deleting parent profile ID: {}", id);

        if (!parentProfileRepository.existsById(id)) {
            throw new IllegalArgumentException("Parent profile not found with ID: " + id);
        }

        parentProfileRepository.deleteById(id);
        log.info("Parent profile deleted successfully: {}", id);
    }

    @Transactional(readOnly = true)
    public boolean existsByUserId(UUID userId) {
        return userId != null && parentProfileRepository.existsByUserId(userId);
    }
}
