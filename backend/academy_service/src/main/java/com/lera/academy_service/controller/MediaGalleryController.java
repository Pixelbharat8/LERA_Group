package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.MediaGallery;
import com.lera.academy_service.repository.MediaGalleryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class MediaGalleryController {
    
    private final MediaGalleryRepository mediaGalleryRepository;
    
    @GetMapping
    public ResponseEntity<List<MediaGallery>> getAllMedia() {
        return ResponseEntity.ok(mediaGalleryRepository.findAllByOrderByUploadedAtDesc());
    }
    
    @GetMapping("/public")
    public ResponseEntity<List<MediaGallery>> getPublicMedia() {
        return ResponseEntity.ok(mediaGalleryRepository.findByIsPublicTrueOrderByDisplayOrderAsc());
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<MediaGallery>> getMediaByCategory(@PathVariable String category) {
        return ResponseEntity.ok(mediaGalleryRepository.findByCategoryOrderByDisplayOrderAsc(category));
    }
    
    @GetMapping("/type/{type}")
    public ResponseEntity<List<MediaGallery>> getMediaByType(@PathVariable String type) {
        return ResponseEntity.ok(mediaGalleryRepository.findByMediaTypeOrderByUploadedAtDesc(type));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<MediaGallery> getMediaById(@PathVariable UUID id) {
        return mediaGalleryRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<MediaGallery> createMedia(@Valid @RequestBody MediaGallery media) {
        media.setUploadedAt(LocalDateTime.now());
        media.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(mediaGalleryRepository.save(media));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<MediaGallery> updateMedia(@PathVariable UUID id, @Valid @RequestBody MediaGallery updatedMedia) {
        return mediaGalleryRepository.findById(id).map(media -> {
            media.setName(updatedMedia.getName());
            media.setFileUrl(updatedMedia.getFileUrl());
            media.setThumbnailUrl(updatedMedia.getThumbnailUrl());
            media.setMediaType(updatedMedia.getMediaType());
            media.setMimeType(updatedMedia.getMimeType());
            media.setFileSize(updatedMedia.getFileSize());
            media.setFileSizeFormatted(updatedMedia.getFileSizeFormatted());
            media.setAltText(updatedMedia.getAltText());
            media.setAltTextVi(updatedMedia.getAltTextVi());
            media.setCaption(updatedMedia.getCaption());
            media.setCaptionVi(updatedMedia.getCaptionVi());
            media.setCategory(updatedMedia.getCategory());
            media.setTags(updatedMedia.getTags());
            media.setUsedIn(updatedMedia.getUsedIn());
            media.setIsPublic(updatedMedia.getIsPublic());
            media.setDisplayOrder(updatedMedia.getDisplayOrder());
            media.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(mediaGalleryRepository.save(media));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedia(@PathVariable UUID id) {
        if (mediaGalleryRepository.existsById(id)) {
            mediaGalleryRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping("/batch")
    public ResponseEntity<List<MediaGallery>> createBatchMedia(@Valid @RequestBody List<MediaGallery> mediaList) {
        mediaList.forEach(media -> {
            media.setUploadedAt(LocalDateTime.now());
            media.setUpdatedAt(LocalDateTime.now());
        });
        return ResponseEntity.ok(mediaGalleryRepository.saveAll(mediaList));
    }
    
    @DeleteMapping("/batch")
    public ResponseEntity<Void> deleteBatchMedia(@Valid @RequestBody List<UUID> ids) {
        mediaGalleryRepository.deleteAllById(ids);
        return ResponseEntity.ok().build();
    }
}
