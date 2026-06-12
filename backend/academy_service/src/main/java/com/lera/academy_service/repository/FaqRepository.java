package com.lera.academy_service.repository;

import com.lera.academy_service.entity.Faq;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FaqRepository extends JpaRepository<Faq, UUID> {
    
    List<Faq> findAllByOrderByDisplayOrderAsc();
    
    List<Faq> findByIsActiveTrueOrderByDisplayOrderAsc();
    
    List<Faq> findByPageAndIsActiveTrueOrderByDisplayOrderAsc(String page);
    
    List<Faq> findByCategoryAndIsActiveTrueOrderByDisplayOrderAsc(String category);
    
    List<Faq> findByPageOrderByDisplayOrderAsc(String page);
    
    List<Faq> findByCategoryOrderByDisplayOrderAsc(String category);
}
