package com.lera.academy_service.repository;

import com.lera.academy_service.entity.CmsPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CmsPageRepository extends JpaRepository<CmsPage, UUID> {
    Optional<CmsPage> findBySlug(String slug);
    List<CmsPage> findByIsPublishedTrue();
    List<CmsPage> findByAuthorId(UUID authorId);
    boolean existsBySlug(String slug);
}
