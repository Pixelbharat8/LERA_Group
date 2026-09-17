package com.lera.academy_service.controller;

import com.lera.academy_service.entity.Badge;
import com.lera.academy_service.repository.BadgeRepository;
import com.lera.academy_service.security.AcademyRoles;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * The badge catalogue. Read-only for now: the rows exist and students earn them, but nothing
 * in the platform creates or edits a badge, so there is no write path to expose yet.
 */
@RestController
@RequestMapping("/api/badges")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF_OR_STUDENT)
public class BadgeController {

    private final BadgeRepository badgeRepository;

    @GetMapping
    public ResponseEntity<List<Badge>> getBadges(
            @RequestParam(required = false, defaultValue = "true") boolean activeOnly) {
        return ResponseEntity.ok(activeOnly
                ? badgeRepository.findByIsActiveTrueOrderByPointsRequiredAsc()
                : badgeRepository.findAllByOrderByPointsRequiredAsc());
    }
}
