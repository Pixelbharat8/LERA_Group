package com.lera.academy_service.repository;

import com.lera.academy_service.entity.MediaGallery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MediaGalleryRepository extends JpaRepository<MediaGallery, UUID> {
    
    List<MediaGallery> findByIsPublicTrueOrderByDisplayOrderAsc();
    
    List<MediaGallery> findByCategoryOrderByDisplayOrderAsc(String category);
    
    List<MediaGallery> findByMediaTypeOrderByUploadedAtDesc(String mediaType);
    
    List<MediaGallery> findByTagsContainingIgnoreCase(String tag);
    
    List<MediaGallery> findAllByOrderByUploadedAtDesc();
    
    List<MediaGallery> findByUsedInContainingIgnoreCase(String pageReference);
}
