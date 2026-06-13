package com.lera.academy_service.controller;

import com.lera.academy_service.entity.Testimonial;
import com.lera.academy_service.repository.TestimonialRepository;
import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/testimonials")
@RequiredArgsConstructor
public class TestimonialController {

    private final TestimonialRepository testimonialRepository;

    @GetMapping
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<List<Testimonial>> getAllTestimonials() {
        return ResponseEntity.ok(testimonialRepository.findAllByOrderByDisplayOrderAsc());
    }

    @GetMapping("/public")
    public ResponseEntity<List<Testimonial>> getPublishedTestimonials() {
        return ResponseEntity.ok(testimonialRepository.findByIsPublishedTrueOrderByDisplayOrderAsc());
    }

    @GetMapping("/published")
    public ResponseEntity<List<Testimonial>> getPublishedTestimonialsAlias() {
        return ResponseEntity.ok(testimonialRepository.findByIsPublishedTrueOrderByDisplayOrderAsc());
    }

    @GetMapping("/featured")
    public ResponseEntity<List<Testimonial>> getFeaturedTestimonials() {
        return ResponseEntity.ok(testimonialRepository.findByIsFeaturedTrueAndIsPublishedTrueOrderByDisplayOrderAsc());
    }

    /** Non-staff only receive published rows (drafts return 404 to avoid enumeration). */
    @GetMapping("/{id}")
    public ResponseEntity<Testimonial> getTestimonialById(@PathVariable UUID id) {
        return testimonialRepository.findById(id)
                .map(t -> {
                    if (!Boolean.TRUE.equals(t.getIsPublished()) && !CurrentUser.isStaff()) {
                        throw new ResponseStatusException(HttpStatus.NOT_FOUND);
                    }
                    return ResponseEntity.ok(t);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<Testimonial> createTestimonial(@Valid @RequestBody Testimonial testimonial) {
        return ResponseEntity.ok(testimonialRepository.save(testimonial));
    }

    @PutMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<Testimonial> updateTestimonial(@PathVariable UUID id, @Valid @RequestBody Testimonial testimonialDetails) {
        return testimonialRepository.findById(id).map(testimonial -> {
            if (testimonialDetails.getParentName() != null) testimonial.setParentName(testimonialDetails.getParentName());
            if (testimonialDetails.getParentNameVi() != null) testimonial.setParentNameVi(testimonialDetails.getParentNameVi());
            if (testimonialDetails.getStudentName() != null) testimonial.setStudentName(testimonialDetails.getStudentName());
            if (testimonialDetails.getStudentAge() != null) testimonial.setStudentAge(testimonialDetails.getStudentAge());
            if (testimonialDetails.getRating() != null) testimonial.setRating(testimonialDetails.getRating());
            if (testimonialDetails.getContent() != null) testimonial.setContent(testimonialDetails.getContent());
            if (testimonialDetails.getContentVi() != null) testimonial.setContentVi(testimonialDetails.getContentVi());
            if (testimonialDetails.getAvatarUrl() != null) testimonial.setAvatarUrl(testimonialDetails.getAvatarUrl());
            if (testimonialDetails.getIsFeatured() != null) testimonial.setIsFeatured(testimonialDetails.getIsFeatured());
            if (testimonialDetails.getIsPublished() != null) testimonial.setIsPublished(testimonialDetails.getIsPublished());
            if (testimonialDetails.getDisplayOrder() != null) testimonial.setDisplayOrder(testimonialDetails.getDisplayOrder());

            return ResponseEntity.ok(testimonialRepository.save(testimonial));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<Void> deleteTestimonial(@PathVariable UUID id) {
        if (testimonialRepository.existsById(id)) {
            testimonialRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/bulk")
    @PreAuthorize(AcademyRoles.STAFF)
    public ResponseEntity<List<Testimonial>> saveAllTestimonials(@Valid @RequestBody List<Testimonial> testimonials) {
        return ResponseEntity.ok(testimonialRepository.saveAll(testimonials));
    }
}
