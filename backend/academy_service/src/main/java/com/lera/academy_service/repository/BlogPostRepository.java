package com.lera.academy_service.repository;

import com.lera.academy_service.entity.BlogPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, UUID> {
    
    List<BlogPost> findByStatusOrderByPublishedAtDesc(String status);
    
    List<BlogPost> findByStatusOrderByCreatedAtDesc(String status);
    
    List<BlogPost> findByCategoryAndStatusOrderByPublishedAtDesc(String category, String status);
    
    List<BlogPost> findByIsFeaturedTrueAndStatusOrderByPublishedAtDesc(String status);
    
    Optional<BlogPost> findBySlug(String slug);
    
    List<BlogPost> findAllByOrderByCreatedAtDesc();
    
    List<BlogPost> findByCategoryOrderByCreatedAtDesc(String category);

    List<BlogPost> findByAudienceAndStatusOrderByPublishedAtDesc(String audience, String status);

    List<BlogPost> findByAudienceOrderByCreatedAtDesc(String audience);
}
