package com.lera.academy_service.repository;

import com.lera.academy_service.entity.Testimonial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TestimonialRepository extends JpaRepository<Testimonial, UUID> {
    
    List<Testimonial> findByIsPublishedTrueOrderByDisplayOrderAsc();
    
    List<Testimonial> findByIsFeaturedTrueAndIsPublishedTrueOrderByDisplayOrderAsc();
    
    List<Testimonial> findAllByOrderByDisplayOrderAsc();
    
    // Methods needed by PublicContentController
    List<Testimonial> findByCenterIdAndIsFeaturedTrueAndIsPublishedTrueOrderByDisplayOrderAsc(UUID centerId);
    
    List<Testimonial> findByCenterIdAndIsPublishedTrueOrderByDisplayOrderAsc(UUID centerId);
    
    @Query("SELECT t FROM Testimonial t WHERE t.centerId = :centerId AND t.isPublished = true ORDER BY t.displayOrder")
    List<Testimonial> findByCenterIdAndPublished(UUID centerId);
}
